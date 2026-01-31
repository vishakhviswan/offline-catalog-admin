import { useEffect, useState } from "react";
import { apiGet } from "../api/api";

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await apiGet("/api/orders");
      setOrders(data || []);
    } catch (err) {
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>Orders</h2>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Customer orders & totals
          </div>
        </div>

        <button
          style={createBtn}
          onClick={() =>
            window.dispatchEvent(new CustomEvent("go-create-order"))
          }
        >
          ➕ Create Order
        </button>
      </div>

      {/* TABLE */}
      <div style={tableCard}>
        <div style={tableHeader}>
          <div>#</div>
          <div>Customer</div>
          <div style={{ textAlign: "center" }}>Items</div>
          <div style={{ textAlign: "right" }}>Total ₹</div>
          <div>Date</div>
        </div>

        {loading && <div style={loadingText}>Loading orders…</div>}

        {!loading && orders.length === 0 && (
          <div style={empty}>📦 No orders found</div>
        )}

        {!loading &&
          orders.map((o, index) => (
            <div key={o.id} style={row}>
              <div>{index + 1}</div>

              <div style={{ fontWeight: 600 }}>{o.customer_name || "—"}</div>

              <div style={{ textAlign: "center" }}>
                {o.items_count || o.items?.length || 0}
              </div>

              <div style={{ textAlign: "right", fontWeight: 600 }}>
                ₹{Number(o.total || 0).toFixed(2)}
              </div>

              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {o.created_at
                  ? new Date(o.created_at).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const createBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const tableCard = {
  background: "#ffffff",
  borderRadius: 14,
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  overflow: "hidden",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "60px 1.5fr 1fr 1fr 1fr",
  padding: "14px 16px",
  background: "#f1f5f9",
  fontWeight: 600,
  fontSize: 14,
};

const row = {
  display: "grid",
  gridTemplateColumns: "60px 1.5fr 1fr 1fr 1fr",
  padding: "14px 16px",
  borderTop: "1px solid #e5e7eb",
  alignItems: "center",
};

const loadingText = {
  padding: 20,
  textAlign: "center",
  color: "#6b7280",
};

const empty = {
  padding: 30,
  textAlign: "center",
  color: "#6b7280",
};
