import { useState, useEffect } from "react";
import { apiGet } from "../api/api";

import AdminProductForm from "../components/AdminProductForm";
import AdminProductList from "../components/AdminProductList";
import BulkImport from "./BulkImport";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // ✅ ADD
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  /* ---------------- LOAD PRODUCTS ---------------- */
  async function loadProducts() {
    try {
      setLoading(true);
      const data = await apiGet("/api/products");
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- LOAD CATEGORIES ---------------- */
  async function loadCategories() {
    try {
      const data = await apiGet("/api/categories");
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load categories");
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories(); // ✅ LOAD ONCE
  }, []);

  /* ---------------- HANDLERS ---------------- */
  function handleAdd() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleSaved() {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  }

  function handleCancel() {
    setShowForm(false);
    setEditingProduct(null);
  }

  /* ---------------- UI ---------------- */
  return (
    <div style={page}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>Products</h2>
          <div style={subtitle}>
            Create, edit and manage your product catalog
          </div>
        </div>

        <button onClick={handleAdd} style={addBtn}>
          ➕ Add Product
        </button>
        <button onClick={() => setShowBulk(true)} style={addBtn}>
          ⬆ Bulk Import
        </button>
      </div>

      {/* BULK IMPORT */}
      {showBulk && <BulkImport onBack={() => setShowBulk(false)} />}

      {/* FORM */}
      {showForm && (
        <div style={formWrapper}>
          <AdminProductForm
            editingProduct={editingProduct}
            categories={categories}     
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* LIST */}
      <div style={{ marginTop: 24 }}>
        {loading ? (
          <div style={loadingBox}>Loading products…</div>
        ) : (
          <AdminProductList
            products={products}
            categories={categories}     
            onEdit={handleEdit}
            onRefresh={loadProducts}
          />
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  maxWidth: 1300,
  margin: "0 auto",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
  flexWrap: "wrap",
  gap: 12,
};

const subtitle = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 4,
};

const addBtn = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#2563eb,#1e40af)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const formWrapper = {
  marginTop: 16,
  background: "#ffffff",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
};

const loadingBox = {
  padding: 30,
  textAlign: "center",
  color: "#6b7280",
  background: "#ffffff",
  borderRadius: 14,
};