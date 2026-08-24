"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * A column can declare how it serialises to CSV — richer cell renderers
 * (badges, links, avatars) need a plain-text projection for export. Without
 * `csvValue`, the raw row field named by the column id is exported.
 */
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    csvHeader?: string
    csvValue?: (row: TData) => string | number
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  /** Filename for the CSV download (extension added automatically). */
  csvFilename: string
  searchPlaceholder?: string
  /** Pre-fills the filter box (e.g. a ?q= deep link). */
  initialSearch?: string
  emptyState?: { title: string; description?: string }
  pageSize?: number
  /** Columns hidden from the grid (still included in CSV export). */
  columnVisibility?: VisibilityState
}

function escapeCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function DataTable<TData>({
  columns,
  data,
  csvFilename,
  searchPlaceholder = "Search…",
  initialSearch = "",
  emptyState = { title: "Nothing found", description: "Try a different search." },
  pageSize = 10,
  columnVisibility,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState(initialSearch)

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize }, columnVisibility },
  })

  function exportCsv() {
    // Filtered + sorted, every row — not just the visible page. Column order
    // follows the header, and each column contributes its meta.csvValue (or
    // its raw accessor value when the cell renders plain text anyway).
    const exportableColumns = table
      .getAllLeafColumns()
      .map((column) => {
        const meta = column.columnDef.meta ?? {}
        const header =
          meta.csvHeader ??
          (typeof column.columnDef.header === "string"
            ? column.columnDef.header
            : column.id)
        if (column.id === "actions" && !meta.csvValue) return null
        return {
          header,
          value:
            meta.csvValue ??
            ((row: TData) => {
              const raw = (row as Record<string, unknown>)[column.id]
              if (raw == null) return ""
              if (raw instanceof Date) return raw.toISOString().slice(0, 10)
              return typeof raw === "string" || typeof raw === "number"
                ? raw
                : ""
            }),
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    const rows = table.getSortedRowModel().rows.map((row) =>
      exportableColumns.map((c) => escapeCsvValue(c.value(row.original)))
    )

    const csv = [
      exportableColumns.map((c) => escapeCsvValue(c.header)).join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n")

    // BOM keeps Excel from mangling UTF-8 (₹, accented names).
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${csvFilename}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const { pageIndex } = table.getState().pagination
  const filteredCount = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const firstRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min(filteredCount, (pageIndex + 1) * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Filter table"
            className="h-10 pl-9"
          />
        </div>
        <Button
          variant="outline"
          className="h-10 shrink-0"
          onClick={exportCsv}
          disabled={filteredCount === 0}
        >
          <Download data-icon="inline-start" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]">
        <Table className="min-w-[640px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                      className="h-11 bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground first:pl-5 last:pr-5"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 uppercase transition-colors hover:text-foreground"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <p className="text-sm font-medium">{emptyState.title}</p>
                  {emptyState.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {emptyState.description}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("py-3.5 first:pl-5 last:pr-5")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filteredCount === 0
            ? "No entries"
            : `Showing ${firstRow}–${lastRow} of ${filteredCount} entr${
                filteredCount === 1 ? "y" : "ies"
              }`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Button>
          <span className="px-1 text-sm tabular-nums text-muted-foreground">
            {pageCount === 0 ? 0 : pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}
