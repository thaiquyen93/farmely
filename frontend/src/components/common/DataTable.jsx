import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  searchField,
  itemsPerPage = 10,
  actionButton,
  filterComponent
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter((item) => {
      if (searchField) {
        const val = item[searchField];
        return val ? String(val).toLowerCase().includes(searchTerm.toLowerCase()) : false;
      }
      return Object.values(item).some((val) =>
        val ? String(val).toLowerCase().includes(searchTerm.toLowerCase()) : false
      );
    });
  }, [data, searchTerm, searchField]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-brand-border shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-brand-cream/50 rounded-xl border border-brand-border/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
            />
          </div>
          {filterComponent}
        </div>
        {actionButton && <div className="flex items-center gap-2">{actionButton}</div>}
      </div>

      {/* Table Container */}
      <div className="admin-table-container shadow-sm overflow-x-auto">
        {paginatedData.length === 0 ? (
          <EmptyState
            title="Không tìm thấy bản ghi"
            description="Không có dữ liệu nào khớp với từ khóa tìm kiếm hoặc điều kiện lọc hiện tại."
          />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    className={col.sortable ? 'cursor-pointer select-none hover:bg-stone-200/50' : ''}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={row.id || idx}>
                  {columns.map((col) => (
                    <td key={col.key || col.header}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {sortedData.length > 0 && (
        <div className="flex items-center justify-between text-xs text-brand-muted px-2">
          <span>
            Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
            <strong>{Math.min(currentPage * itemsPerPage, sortedData.length)}</strong> trên tổng số{' '}
            <strong>{sortedData.length}</strong> kết quả
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-brand-border bg-white text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-cream transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-brand-dark">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-brand-border bg-white text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-cream transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
