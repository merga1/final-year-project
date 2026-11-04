'use client';

type PaginationProps = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemLabel?: string;
};

export function Pagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers with smart ellipsis for larger datasets
  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }

  const pages = getPageNumbers();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#ffffff',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '0.84rem',
        color: '#64748b',
      }}
    >
      {/* Left: Summary & Page Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span>
          Showing <strong style={{ color: '#0f172a' }}>{startItem}</strong> to{' '}
          <strong style={{ color: '#0f172a' }}>{endItem}</strong> of{' '}
          <strong style={{ color: '#0f172a' }}>{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && totalItems > 10 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: currentPage === 1 ? '#cbd5e1' : '#0f172a',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '0.82rem',
              transition: 'background 0.15s',
            }}
          >
            Previous
          </button>

          {/* Page numbers */}
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(Number(p))}
                style={{
                  minWidth: 32,
                  height: 32,
                  padding: '0 8px',
                  borderRadius: 6,
                  border: isCurrent ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: isCurrent ? '#0284c7' : '#ffffff',
                  color: isCurrent ? '#ffffff' : '#0f172a',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: currentPage === totalPages ? '#cbd5e1' : '#0f172a',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '0.82rem',
              transition: 'background 0.15s',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
