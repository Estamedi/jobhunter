import { getPageNumbers } from '@/lib/utils'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface ListPaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  itemLabel?: string
  itemLabelPlural?: string
}

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = 'item',
  itemLabelPlural = `${itemLabel}s`,
}: ListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageNumbers = getPageNumbers(page, totalPages)

  if (total === 0) return null

  return (
    <div className='flex items-center justify-between gap-2'>
      <p className='text-sm text-muted-foreground'>
        {total} {total === 1 ? itemLabel : itemLabelPlural}
      </p>
      <Pagination className='mx-0 w-auto'>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href='#'
              onClick={(e) => {
                e.preventDefault()
                if (page > 1) onPageChange(page - 1)
              }}
              className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
            />
          </PaginationItem>
          {pageNumbers.map((pageNumber, index) =>
            pageNumber === '...' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href='#'
                  isActive={pageNumber === page}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(pageNumber as number)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href='#'
              onClick={(e) => {
                e.preventDefault()
                if (page < totalPages) onPageChange(page + 1)
              }}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
