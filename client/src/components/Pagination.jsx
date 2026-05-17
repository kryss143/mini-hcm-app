// src/components/Pagination.jsx

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        marginTop: "0.75rem",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: "2px 10px", fontSize: "0.85rem" }}
        disabled={page === 1}
        onClick={() => onPageChange(1)}
      >
        «
      </button>

      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: "2px 10px", fontSize: "0.85rem" }}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            style={{ color: "var(--muted)", padding: "0 4px" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`btn ${page === p ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "2px 10px", fontSize: "0.85rem", minWidth: 32 }}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: "2px 10px", fontSize: "0.85rem" }}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </button>

      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: "2px 10px", fontSize: "0.85rem" }}
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        »
      </button>

      <span
        style={{ color: "var(--muted)", fontSize: "0.8rem", marginLeft: 4 }}
      >
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
