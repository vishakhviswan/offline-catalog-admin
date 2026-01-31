import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../api/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [route, setRoute] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD ---------------- */
  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await apiGet("/api/customers");
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  /* ---------------- SAVE ---------------- */
  async function saveCustomer() {
    if (!name.trim() || !mobile.trim()) {
      alert("Name & mobile required");
      return;
    }

    const payload = {
      name: name.trim(),
      mobile: mobile.trim(),
      route: route.trim(),
    };

    try {
      if (editingId) {
        await apiPut(`/api/customers/${editingId}`, payload);
      } else {
        await apiPost("/api/customers", payload);
      }

      reset();
      loadCustomers();
    } catch (err) {
      alert("Save failed");
    }
  }

  /* ---------------- DELETE ---------------- */
  async function removeCustomer(id) {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await apiDelete(`/api/customers/${id}`);
      loadCustomers();
    } catch {
      alert("Delete failed");
    }
  }

  function reset() {
    setName("");
    setMobile("");
    setRoute("");
    setEditingId(null);
  }

  /* ---------------- FILTER ---------------- */
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.route?.toLowerCase().includes(q)
    );
  });

  /* ---------------- UI ---------------- */
  return (
    <div style={page}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>Customers</h2>
          <div style={subtitle}>Manage your customers</div>
        </div>
      </div>

      {/* ADD / EDIT FORM */}
      <div style={formCard}>
        <div style={grid}>
          <input
            placeholder="Customer name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />

          <input
            placeholder="Mobile number *"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            style={input}
          />

          <input
            placeholder="Route (optional)"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            style={input}
          />
        </div>

        <div style={formActions}>
          <button onClick={saveCustomer} style={saveBtn}>
            {editingId ? "Update Customer" : "Add Customer"}
          </button>

          {editingId && (
            <button onClick={reset} style={cancelBtn}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="🔍 Search by name, mobile or route"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInput}
      />

      {/* LIST */}
      {loading ? (
        <div style={empty}>Loading customers…</div>
      ) : filtered.length === 0 ? (
        <div style={empty}>👥 No customers found</div>
      ) : (
        <div style={list}>
          {filtered.map((c) => (
            <div key={c.id} style={card}>
              <div>
                <div style={nameTxt}>{c.name}</div>
                <div style={meta}>📞 {c.mobile}</div>
                {c.route && <div style={meta}>🛣️ {c.route}</div>}
              </div>

              <div style={actions}>
                <button
                  style={editBtn}
                  onClick={() => {
                    setEditingId(c.id);
                    setName(c.name || "");
                    setMobile(c.mobile || "");
                    setRoute(c.route || "");
                  }}
                >
                  ✏️
                </button>

                <button style={deleteBtn} onClick={() => removeCustomer(c.id)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  maxWidth: 1200,
  margin: "0 auto",
};

const header = { marginBottom: 16 };

const subtitle = {
  fontSize: 13,
  color: "#6b7280",
};

const formCard = {
  background: "#fff",
  padding: 16,
  borderRadius: 14,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  marginBottom: 20,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const input = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

const formActions = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  flexWrap: "wrap",
};

const saveBtn = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const cancelBtn = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "#e5e7eb",
  fontWeight: 600,
};

const searchInput = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 20,
};

const list = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
  gap: 16,
};

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 14,
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const nameTxt = {
  fontWeight: 600,
  fontSize: 15,
};

const meta = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 4,
};

const actions = {
  display: "flex",
  gap: 8,
};

const editBtn = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#f59e0b",
  color: "#fff",
  cursor: "pointer",
};

const deleteBtn = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
};

const empty = {
  padding: 30,
  textAlign: "center",
  background: "#fff",
  borderRadius: 14,
  color: "#6b7280",
};
