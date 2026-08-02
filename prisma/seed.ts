import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@appointly.dev"
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123"

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Super admin already exists: ${email}`)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.user.create({
    data: {
      name: "Platform Admin",
      email,
      password: hashedPassword,
      globalRole: "SUPER_ADMIN",
    },
  })

  console.log(`✅ Super admin created: ${email} / ${password}`)
  console.log("⚠️  Log in and change this password immediately.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
