import { useState, type ReactNode } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  Filter,
  X,
  RotateCw,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

// Extend TanStack ColumnMeta for custom props (className, filterOptions)
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
    filterOptions?: (string | { label: string; value: string })[]
    filterType?: 'text' | 'number' | 'date'
  }
}

// Re-export ColumnDef so consumer pages keep the same import path
export type { ColumnDef }

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  searchPlaceholder?: string
  searchKey?: keyof T
  onAdd?: () => void
  addLabel?: string
  isLoading?: boolean
  itemsPerPage?: number
  exportFilename?: string
  // Server-side pagination props
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  // Server-side search, filter, sort
  onSearchChange?: (searchTerm: string) => void
  onFilterChange?: (filters: ColumnFiltersState) => void
  onSortChange?: (sorting: SortingState) => void
  onExport?: () => void
  // Row selection props
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: (rowSelection: Record<string, boolean>) => void
  hideFilter?: boolean
  onRefresh?: () => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  onPerPageChange?: (perPage: number) => void
  customActions?: (row: T) => ReactNode
}

export default function DataTable<T>({
  data,
  columns,
  searchPlaceholder,
  searchKey,
  onAdd,
  addLabel,
  isLoading = false,
  itemsPerPage = 10,
  exportFilename = 'data-export',
  totalItems,
  currentPage: externalPage,
  onPageChange,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onExport,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
  hideFilter = false,
  onRefresh,
  onEdit: _onEdit,
  onDelete: _onDelete,
  onView: _onView,
  onPerPageChange: _onPerPageChange,
  customActions: _customActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: itemsPerPage })
  const [internalRowSelection, setInternalRowSelection] = useState<Record<string, boolean>>({})

  const isServerSide = totalItems !== undefined && onPageChange !== undefined

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: searchTerm,
      rowSelection: externalRowSelection ?? internalRowSelection,
      ...(!isServerSide ? { pagination } : {}),
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function'
        ? updater(externalRowSelection ?? internalRowSelection)
        : updater

      if (onRowSelectionChange) {
        onRowSelectionChange(next)
      } else {
        setInternalRowSelection(next)
      }
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
      if (isServerSide) {
        onSortChange?.(next)
        onPageChange?.(1)
      }
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnFilters) : updater
      setColumnFilters(next)
      if (isServerSide) {
        onFilterChange?.(next)
        onPageChange?.(1)
      }
    },
    onGlobalFilterChange: (value) => {
      setSearchTerm(value)
      if (isServerSide) {
        onSearchChange?.(value)
        onPageChange?.(1)
      }
    },
    ...(!isServerSide ? { onPaginationChange: setPagination } : {}),
    getCoreRowModel: getCoreRowModel(),
    ...(isServerSide
      ? {
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        pageCount: Math.ceil((totalItems || 0) / itemsPerPage),
      }
      : {
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
      }),
    globalFilterFn: (row, _columnId, filterValue): boolean => {
      const searchTerm = String(filterValue).toLowerCase()
      if (!searchTerm) return true

      if (searchKey) {
        const value = row.original[searchKey]
        return String(value ?? '').toLowerCase().includes(searchTerm)
      }

      // Search across all cells in the row
      return row.getVisibleCells().some(cell => {
        const value = cell.getValue()
        return String(value ?? '').toLowerCase().includes(searchTerm)
      })
    },
  })

  // Pagination values
  const currentPage = isServerSide ? Number(externalPage || 1) : (pagination.pageIndex + 1)
  const totalCount = isServerSide ? (totalItems || 0) : table.getFilteredRowModel().rows.length
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayRows = table.getRowModel().rows

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (isServerSide) {
        onPageChange!(newPage)
      } else {
        setPagination(prev => ({ ...prev, pageIndex: newPage - 1 }))
      }
    }
  }

  const clearFilters = () => {
    setColumnFilters([])
    setSearchTerm('')
    if (isServerSide) {
      onSearchChange?.('')
      onFilterChange?.([])
      onPageChange?.(1)
    } else {
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }
  }

  const downloadCSV = () => {
    if (isServerSide && onExport) {
      onExport()
      return
    }

    const rowsData = isServerSide
      ? table.getRowModel().rows
      : table.getFilteredRowModel().rows
    if (rowsData.length === 0) return

    const exportableColumns = table.getAllLeafColumns().filter(col => col.accessorFn != null)

    const headers = exportableColumns
      .map(col => {
        const header = col.columnDef.header
        return typeof header === 'string' ? header : col.id
      })
      .join(',')

    const rows = rowsData
      .map(row =>
        exportableColumns
          .map(col => {
            const val = row.getValue(col.id)
            const escaped = String(val ?? '').replace(/"/g, '""')
            return `"${escaped}"`
          })
          .join(',')
      )
      .join('\n')

    const csvContent = `${headers}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${exportFilename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Count active filters
  const activeFiltersCount = columnFilters.length

  // Get filterable columns for filter panel
  const filterableColumns = table.getAllLeafColumns().filter(col => col.getCanFilter() && col.accessorFn != null)

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder={searchPlaceholder || 'Search...'}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value
              setSearchTerm(value)
              if (isServerSide) {
                onSearchChange?.(value)
                onPageChange?.(1)
              } else {
                setPagination(prev => ({ ...prev, pageIndex: 0 }))
              }
            }}
            className={cn(
              'w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant',
              'text-sm bg-background focus:bg-surface-container-lowest',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              'transition-all'
            )}
          />
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-2">
          {!hideFilter && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative p-2 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-background transition-colors cursor-pointer",
                showFilters && "bg-surface-container-low text-on-background",
                activeFiltersCount > 0 && "border-primary text-primary"
              )}
              title="Filters"
            >
              <Filter size={18} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={downloadCSV}
            disabled={displayRows.length === 0}
            title="Export CSV"
            className="p-2 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-background transition-colors hidden sm:flex disabled:opacity-50 cursor-pointer"
          >
            <Download size={18} />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh"
              className={cn(
                "p-2 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-background transition-colors cursor-pointer",
                isLoading && "animate-spin text-primary border-primary"
              )}
            >
              <RotateCw size={18} />
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:bg-primary/95 hover:shadow transition-all cursor-pointer"
            >
              {addLabel || 'Add New'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-surface-container-low/30 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">Column Filters</h3>
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              Reset All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filterableColumns.map((column) => {
              const meta = column.columnDef.meta
              const headerText = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
              return (
                <div key={column.id} className="space-y-1">
                  <label className="text-[10px] font-semibold text-secondary ml-1">
                    {headerText}
                  </label>
                  {meta?.filterOptions ? (
                    <select
                      value={(column.getFilterValue() as string) || ''}
                      onChange={(e) => {
                        const value = e.target.value || undefined
                        column.setFilterValue(value)
                        if (isServerSide) {
                          // Handled by TanStack and internal updater
                        } else {
                          setPagination(prev => ({ ...prev, pageIndex: 0 }))
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-outline-variant bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary text-on-background"
                    >
                      <option value="">All</option>
                      {meta.filterOptions.map((opt) => {
                        const label = typeof opt === 'string' ? opt : opt.label
                        const val = typeof opt === 'string' ? opt : opt.value
                        return <option key={val} value={val}>{label}</option>
                      })}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type={meta?.filterType || 'text'}
                        value={(column.getFilterValue() as string) || ''}
                        onChange={(e) => {
                          const value = e.target.value || undefined
                          column.setFilterValue(value)
                          if (isServerSide) {
                            // Handled by TanStack and internal updater
                          } else {
                            setPagination(prev => ({ ...prev, pageIndex: 0 }))
                          }
                        }}
                        placeholder={`Filter ${headerText}...`}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-outline-variant bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary text-on-background"
                      />
                      {Boolean(column.getFilterValue()) && (
                        <button
                          onClick={() => {
                            column.setFilterValue(undefined)
                            if (isServerSide) {
                              // Handled by TanStack and internal updater
                            } else {
                              setPagination(prev => ({ ...prev, pageIndex: 0 }))
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-on-background cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-surface-container-low/50 text-secondary font-medium border-b border-outline-variant">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <th className="px-5 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                  />
                </th>
                {headerGroup.headers.map(header => {
                  const meta = header.column.columnDef.meta
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={cn(
                        'px-5 py-3.5 select-none font-semibold text-xs uppercase tracking-wider',
                        canSort && 'cursor-pointer hover:bg-surface-container-low/85',
                        meta?.className
                      )}
                    >
                      <div className={cn(
                        "flex items-center gap-1",
                        meta?.className?.includes('text-right') && "justify-end",
                        meta?.className?.includes('text-center') && "justify-center"
                      )}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          {
                            asc: <ChevronUp size={14} className="text-primary" />,
                            desc: <ChevronDown size={14} className="text-primary" />,
                          }[header.column.getIsSorted() as string] ?? <ChevronUp size={14} className="opacity-0 hover:opacity-50" />
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-outline-variant text-on-background">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-4"><div className="w-4 h-4 bg-surface-container-high rounded mx-auto"></div></td>
                  {columns.map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-surface-container-high rounded w-full max-w-[80%]"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-secondary">
                  No data found.
                </td>
              </tr>
            ) : (
              displayRows.map((row: any) => (
                <tr key={row.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-5 py-3 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                    />
                  </td>
                  {row.getVisibleCells().map((cell: any) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <td key={cell.id} className={cn('px-5 py-3 text-sm', meta?.className)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalCount > 0 && (
        <div className="px-5 py-4 border-t border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-secondary">
            Showing <span className="font-semibold text-on-background">{startIndex + 1}</span> to <span className="font-semibold text-on-background">{Math.min(startIndex + itemsPerPage, totalCount)}</span> of <span className="font-semibold text-on-background">{totalCount}</span> entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-outline-variant text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 px-2">
              {(() => {
                const pages = []
                const maxVisible = 5
                let startPage = Math.max(1, currentPage - 2)
                let endPage = Math.min(totalPages, startPage + maxVisible - 1)

                if (endPage - startPage < maxVisible - 1) {
                  startPage = Math.max(1, endPage - maxVisible + 1)
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md text-sm font-semibold transition-colors cursor-pointer",
                        i === currentPage
                          ? "bg-primary text-on-primary"
                          : "text-secondary hover:bg-surface-container-low hover:text-on-background"
                      )}
                    >
                      {i}
                    </button>
                  )
                }
                return pages
              })()}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-outline-variant text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
