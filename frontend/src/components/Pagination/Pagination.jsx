import React from 'react';
import './Pagination.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageSizeOptions = [10, 25, 50, 100];

    if (totalItems === 0) return null;

    const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        // ... existing logic ...
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="pagination-container">
            <div className="pagination-left">
                <div className="pagination-info">
                    Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
                </div>
                {onItemsPerPageChange && (
                    <div className="pagination-size-selector">
                        <span>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                onItemsPerPageChange(Number(e.target.value));
                                onPageChange(1); // Reset to page 1 on size change
                            }}
                            className="pagination-select"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        <span>entries</span>
                    </div>
                )}
            </div>

            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <FiChevronLeft />
                </button>

                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        disabled={typeof page !== 'number'}
                    >
                        {page}
                    </button>
                ))}

                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <FiChevronRight />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
