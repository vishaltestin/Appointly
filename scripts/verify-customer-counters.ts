/**
 * Simulates the customer-counter state machine against the definitions in
 * lib/customer-counters.ts, and cross-checks each result against a
 * recompute-from-scratch over the simulated booking rows.
 * A drift here is exactly the bug we're fixing, so both must always agree.
 */
type Status = "CONFIRMED" | "PENDING" | "CANCELLED"
interface Row { id: number; status: Status; supersededByReschedule: boolean }

interface Counters { total: number; completed: number; cancelled: number }

// --- mirrors the incremental helpers -------------------------------------
function onCreated(c: Counters, status: Status): Counters {
  return { total: c.total + 1, completed: c.completed + (status === "CONFIRMED" ? 1 : 0), cancelled: c.cancelled }
}
function onApproved(c: Counters): Counters {
  return { ...c, completed: c.completed + 1 }
}
function onCancelled(c: Counters, prev: Status): Counters {
  return { total: c.total, completed: c.completed - (prev === "CONFIRMED" ? 1 : 0), cancelled: c.cancelled + 1 }
}
// reschedule is deliberately a no-op

// --- mirrors recomputeCustomerCounters / the repair script ---------------
function recompute(rows: Row[]): Counters {
  return {
    total: rows.filter((r) => !r.supersededByReschedule).length,
    completed: rows.filter((r) => r.status === "CONFIRMED").length,
    cancelled: rows.filter((r) => r.status === "CANCELLED" && !r.supersededByReschedule).length,
  }
}

let pass = 0, fail = 0
function scenario(name: string, run: () => { inc: Counters; rows: Row[] }) {
  const { inc, rows } = run()
  const rec = recompute(rows)
  const ok = inc.total === rec.total && inc.completed === rec.completed && inc.cancelled === rec.cancelled
  if (ok) { pass++; console.log(`  ✓ ${name}  → total ${inc.total}, completed ${inc.completed}, cancelled ${inc.cancelled}`) }
  else { fail++; console.log(`  ✗ ${name}\n      incremental: ${JSON.stringify(inc)}\n      recomputed:  ${JSON.stringify(rec)}`) }
}

console.log("\nCustomer counter state machine (incremental vs recompute)\n")

scenario("single confirmed booking", () => {
  const c = onCreated({total:0,completed:0,cancelled:0}, "CONFIRMED")
  return { inc: c, rows: [{ id:1, status:"CONFIRMED", supersededByReschedule:false }] }
})

scenario("pending request, then approved", () => {
  let c = onCreated({total:0,completed:0,cancelled:0}, "PENDING")
  c = onApproved(c)
  return { inc: c, rows: [{ id:1, status:"CONFIRMED", supersededByReschedule:false }] }
})

scenario("pending request, then declined", () => {
  let c = onCreated({total:0,completed:0,cancelled:0}, "PENDING")
  c = onCancelled(c, "PENDING")
  return { inc: c, rows: [{ id:1, status:"CANCELLED", supersededByReschedule:false }] }
})

scenario("confirmed, then cancelled", () => {
  let c = onCreated({total:0,completed:0,cancelled:0}, "CONFIRMED")
  c = onCancelled(c, "CONFIRMED")
  return { inc: c, rows: [{ id:1, status:"CANCELLED", supersededByReschedule:false }] }
})

scenario("confirmed, rescheduled once (no-op)", () => {
  const c = onCreated({total:0,completed:0,cancelled:0}, "CONFIRMED")
  // reschedule: old row superseded, new row confirmed. counters untouched.
  return { inc: c, rows: [
    { id:1, status:"CANCELLED", supersededByReschedule:true },
    { id:2, status:"CONFIRMED", supersededByReschedule:false },
  ]}
})

scenario("confirmed, rescheduled twice", () => {
  const c = onCreated({total:0,completed:0,cancelled:0}, "CONFIRMED")
  return { inc: c, rows: [
    { id:1, status:"CANCELLED", supersededByReschedule:true },
    { id:2, status:"CANCELLED", supersededByReschedule:true },
    { id:3, status:"CONFIRMED", supersededByReschedule:false },
  ]}
})

scenario("rescheduled then cancelled for real", () => {
  let c = onCreated({total:0,completed:0,cancelled:0}, "CONFIRMED")
  c = onCancelled(c, "CONFIRMED")   // cancels the NEW booking
  return { inc: c, rows: [
    { id:1, status:"CANCELLED", supersededByReschedule:true },
    { id:2, status:"CANCELLED", supersededByReschedule:false },
  ]}
})

scenario("three bookings: 1 confirmed, 1 cancelled, 1 pending→approved", () => {
  let c: Counters = {total:0,completed:0,cancelled:0}
  c = onCreated(c, "CONFIRMED")
  c = onCreated(c, "CONFIRMED"); c = onCancelled(c, "CONFIRMED")
  c = onCreated(c, "PENDING");   c = onApproved(c)
  return { inc: c, rows: [
    { id:1, status:"CONFIRMED", supersededByReschedule:false },
    { id:2, status:"CANCELLED", supersededByReschedule:false },
    { id:3, status:"CONFIRMED", supersededByReschedule:false },
  ]}
})

scenario("repeat customer with a reschedule in the middle", () => {
  let c: Counters = {total:0,completed:0,cancelled:0}
  c = onCreated(c, "CONFIRMED")            // booking A
  c = onCreated(c, "CONFIRMED")            // booking B, later rescheduled
  return { inc: c, rows: [
    { id:1, status:"CONFIRMED", supersededByReschedule:false },
    { id:2, status:"CANCELLED", supersededByReschedule:true },
    { id:3, status:"CONFIRMED", supersededByReschedule:false },
  ]}
})

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
