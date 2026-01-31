import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../api/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ================= */
  async function loadAll() {
    try {
      setLoading(true);
      const [catData, prodData] = await Promise.all([
        apiGet("/api/categories"),
        apiGet("/api/products"),
      ]);

      setCategories(catData || []);
      setProducts(prodData || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  /* ================= ADD ================= */
  async function addCategory() {
    if (!name.trim()) return alert("Enter category name");

    try {
      await apiPost("/api/categories", { name: name.trim() });
      setName("");
      loadAll();
    } catch {
      alert("Add failed");
    }
  }

  /* ================= UPDATE ================= */
  async function saveEdit(id) {
    if (!editName.trim()) return;

    try {
      await apiPut(`/api/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
      loadAll();
    } catch {
      alert("Update failed");
    }
  }

  /* ================= DELETE ================= */
  async function removeCategory(id) {
    const usedCount = products.filter((p) => p.category_id === id).length;

    if (usedCount > 0) {
      return alert(
        `Cannot delete ❌\n${usedCount} products are using this category`,
      );
    }

    if (!window.confirm("Delete this category?")) return;

    try {
      await apiDelete(`/api/categories/${id}`);
      loadAll();
    } catch {
      alert("Delete failed");
    }
  }

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [categories, search]);

  function getItemCount(catId) {
    return products.filter((p) => p.category_id === catId).length;
  }

  /* ================= UI ================= */
  return (
    <div style={page}>
      <h2 style={title}>Categories</h2>

      {/* ADD + SEARCH */}
      <div style={topBar}>
        <input
          placeholder="Search category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />

        <button onClick={addCategory} style={addBtn}>
          ➕ Add
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <div style={box}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={box}>No categories</div>
      ) : (
        <div style={list}>
          {filtered.map((c) => (
            <div key={c.id} style={row}>
              {editingId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={input}
                  />
                  <button onClick={() => saveEdit(c.id)} style={saveBtn}>
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} style={cancelBtn}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div style={info}>
                    <div style={nameTxt}>{c.name}</div>
                    <div style={meta}>{getItemCount(c.id)} items</div>
                  </div>

                  <div style={actions}>
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                      style={editBtn}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => removeCategory(c.id)}
                      style={deleteBtn}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  maxWidth: 900,
  margin: "0 auto",
};

const title = {
  marginBottom: 14,
};

const topBar = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  gap: 10,
  marginBottom: 18,
};

const input = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
};

const addBtn = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const row = {
  background: "#fff",
  padding: 14,
  borderRadius: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  flexWrap: "wrap",
  gap: 10,
};

const info = {
  display: "flex",
  flexDirection: "column",
};

const nameTxt = {
  fontWeight: 700,
};

const meta = {
  fontSize: 12,
  color: "#6b7280",
};

const actions = {
  display: "flex",
  gap: 8,
};

const editBtn = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 10px",
};

const deleteBtn = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 10px",
};

const saveBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
};

const cancelBtn = {
  background: "#e5e7eb",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
};

const box = {
  padding: 30,
  textAlign: "center",
  background: "#fff",
  borderRadius: 14,
};
