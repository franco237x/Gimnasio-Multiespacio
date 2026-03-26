import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, onItemsPerPageChange }) => {
    if (totalPages <= 1 && !onItemsPerPageChange) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 2) { start = 2; end = 4; }
            if (currentPage >= totalPages - 1) { start = totalPages - 3; end = totalPages - 1; }

            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Mostrando {startItem}-{endItem} de {totalItems}
            </div>

            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Anterior"
                >
                    <i className='bx bx-chevron-left'></i>
                </button>

                {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                        <span key={`dots-${idx}`} className="pagination-dots">…</span>
                    ) : (
                        <button
                            key={page}
                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Siguiente"
                >
                    <i className='bx bx-chevron-right'></i>
                </button>
            </div>

            {onItemsPerPageChange && (
                <div className="pagination-per-page">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    >
                        <option value={5}>5 / pág</option>
                        <option value={10}>10 / pág</option>
                        <option value={20}>20 / pág</option>
                        <option value={50}>50 / pág</option>
                    </select>
                </div>
            )}
        </div>
    );
};

export default Pagination;
