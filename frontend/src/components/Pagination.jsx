export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn-ghost" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ← Prev
      </button>
      <span className="pagination-label">
        Page {page} of {totalPages}
      </span>
      <button className="btn-ghost" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next →
      </button>
    </div>
  );
}
