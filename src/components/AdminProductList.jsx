import { useMemo, useState } from "react";
import { apiDelete } from "../api/api";

const API_BASE = "https://offline-catalog-backend-production.up.railway.app";

export default function AdminProductList({
  products = [],
  categories = [],
  onEdit,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [view, setView] = useState("card"); // card | list

  /* ================= HELPERS ================= */

  function getCategoryName(categoryId) {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : "General";
  }

  /* ================= FILTER ================= */

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());

      const matchCategory = category === "all" || p.category_id === category;

      const matchStock =
        stockFilter === "all" ||
        (stockFilter === "in" && p.stock > 0) ||
        (stockFilter === "out" && p.stock <= 0);

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, search, category, stockFilter]);

  /* ================= ACTIONS ================= */

  async function toggleStock(p) {
    try {
      await fetch(`${API_BASE}/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: p.stock > 0 ? 0 : 1 }),
      });
      onRefresh?.();
    } catch {
      alert("Stock update failed ❌");
    }
  }

  async function removeProduct(id) {
    if (!window.confirm("Delete product?")) return;
    await apiDelete(`/api/products/${id}`);
    onRefresh?.();
  }

  if (!products.length) {
    return <div style={empty}>No products yet 📦</div>;
  }

  return (
    <>
      {/* ================= TOP BAR ================= */}
      <div style={toolbar}>
        <input
          placeholder="Search product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={select}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          style={select}
        >
          <option value="all">All Stock</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>

        <button
          style={viewBtn}
          onClick={() => setView(view === "card" ? "list" : "card")}
        >
          {view === "card" ? "📋 List" : "🧱 Card"}
        </button>
      </div>

      {/* ================= PRODUCTS ================= */}
      <div style={view === "card" ? grid : list}>
        {filteredProducts.map((p) => (
          <div key={p.id} style={view === "card" ? card : listRow}>
            {/* IMAGE */}
            <div style={view === "card" ? imgBoxCard : imgBoxList}>
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  style={view === "card" ? imgCard : imgList}
                />
              ) : (
                <span style={{ fontSize: view === "card" ? 36 : 20 }}>📦</span>
              )}
            </div>

            {/* DETAILS */}
            <div style={details}>
              <div style={categoryBadge}>{getCategoryName(p.category_id)}</div>

              <div style={name}>{p.name}</div>

              <div style={priceRow}>
                <span style={price}>₹{p.price}</span>
                {p.mrp && <span style={mrp}>₹{p.mrp}</span>}
              </div>
            </div>

            {/* STOCK */}
            <div style={stockRow}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: p.stock > 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {p.stock > 0 ? "In stock" : "Out"}
              </span>

              <div
                onClick={() => toggleStock(p)}
                style={{
                  ...toggle,
                  background: p.stock > 0 ? "#22c55e" : "#ef4444",
                }}
              >
                <div
                  style={{
                    ...knob,
                    left: p.stock > 0 ? 4 : 22,
                  }}
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div style={actions}>
              <button style={editBtn} onClick={() => onEdit(p)}>
                Edit
              </button>
              <button style={delBtn} onClick={() => removeProduct(p.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ================= STYLES ================= */

const toolbar = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr auto",
  gap: 10,
  marginBottom: 16,
};

const input = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const select = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const viewBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  fontWeight: 600,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 14,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const card = {
  background: "#fff",
  borderRadius: 16,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  boxShadow: "0 6px 18px rgba(0,0,0,.08)",
};

const listRow = {
  ...card,
  flexDirection: "row",
  alignItems: "center",
};

/* ---------- IMAGE STYLES ---------- */

// CARD VIEW IMAGE (BIG)
const imgBoxCard = {
  height: 120,
  width: "100%",
  borderRadius: 12,
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const imgCard = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

// LIST VIEW IMAGE (SMALL)
const imgBoxList = {
  height: 48,
  width: 48,
  borderRadius: 8,
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const imgList = {
  width: 36,
  height: 36,
  objectFit: "contain",
};

const details = {
  flex: 1,
};

const categoryBadge = {
  fontSize: 11,
  fontWeight: 700,
  color: "#1d4ed8",
  background: "#e0e7ff",
  padding: "3px 8px",
  borderRadius: 999,
  display: "inline-block",
  marginBottom: 6,
};

const name = {
  fontWeight: 700,
  fontSize: 15,
  color: "#111827", // dark name
};

const priceRow = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const price = {
  fontWeight: 800,
  fontSize: 16,
  color: "#2563eb", // BLUE price
};

const mrp = {
  fontSize: 12,
  color: "#9ca3af",
  textDecoration: "line-through",
};

const stockRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const toggle = {
  width: 44,
  height: 22,
  borderRadius: 20,
  position: "relative",
  cursor: "pointer",
};

const knob = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: "#fff",
  position: "absolute",
  top: 2,
  transition: ".2s",
};

const actions = {
  display: "flex",
  gap: 8,
};

const editBtn = {
  flex: 1,
  padding: 8,
  borderRadius: 10,
  border: "none",
  background: "#f59e0b",
  color: "#fff",
  fontWeight: 600,
};

const delBtn = {
  flex: 1,
  padding: 8,
  borderRadius: 10,
  border: "none",
  background: "#ef4444",
  color: "#fff",
  fontWeight: 600,
};

const empty = {
  padding: 40,
  textAlign: "center",
};
