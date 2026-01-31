import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/api";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    async function load() {
      try {
        const p = await apiGet("/api/products");
        setProducts(p || []);

        // OPTIONAL: only if orders API exists
        try {
          const o = await apiGet("/api/orders");
          setOrders(o || []);
        } catch {
          setOrders([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ================= PRODUCT METRICS ================= */

  const stockStats = useMemo(() => {
    const totalProducts = products.length;

    let inStock = 0;
    let outStock = 0;
    let totalQty = 0;
    let totalValue = 0;

    products.forEach((p) => {
      const qty = Number(p.stock || 0);
      totalQty += qty;
      totalValue += qty * Number(p.price || 0);

      if (qty > 0) inStock++;
      else outStock++;
    });

    return {
      totalProducts,
      inStock,
      outStock,
      totalQty,
      totalValue,
    };
  }, [products]);

  /* ================= ORDER METRICS ================= */

  const orderStats = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    let todayOrders = 0;
    let monthOrders = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;

    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const amount = Number(o.total || 0);

      if (
        d.getDate() === today.getDate() &&
        d.getMonth() === month &&
        d.getFullYear() === year
      ) {
        todayOrders++;
        todayRevenue += amount;
      }

      if (d.getMonth() === month && d.getFullYear() === year) {
        monthOrders++;
        monthRevenue += amount;
      }
    });

    return {
      todayOrders,
      monthOrders,
      todayRevenue,
      monthRevenue,
      totalOrders: orders.length,
    };
  }, [orders]);

  if (loading) {
    return <div style={loadingBox}>Loading dashboard…</div>;
  }

  return (
    <div style={page}>
      <h2 style={title}>Admin Dashboard</h2>

      {/* ================= CARDS ================= */}
      <div style={grid}>
        <StatCard label="Total Products" value={stockStats.totalProducts} />
        <StatCard label="In Stock" value={stockStats.inStock} />
        <StatCard label="Out of Stock" value={stockStats.outStock} />
        <StatCard label="Total Stock Qty" value={stockStats.totalQty} />
        <StatCard
          label="Stock Value"
          value={`₹${stockStats.totalValue.toLocaleString()}`}
        />

        <StatCard label="Orders Today" value={orderStats.todayOrders} />
        <StatCard label="Orders This Month" value={orderStats.monthOrders} />
        <StatCard
          label="Today Revenue"
          value={`₹${orderStats.todayRevenue.toLocaleString()}`}
        />
        <StatCard
          label="Month Revenue"
          value={`₹${orderStats.monthRevenue.toLocaleString()}`}
        />
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

function StatCard({ label, value }) {
  return (
    <div style={card}>
      <div style={cardLabel}>{label}</div>
      <div style={cardValue}>{value}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  maxWidth: 1200,
  margin: "0 auto",
};

const title = {
  marginBottom: 16,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

const cardLabel = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 6,
};

const cardValue = {
  fontSize: 22,
  fontWeight: 800,
  color: "#111827",
};

const loadingBox = {
  padding: 40,
  textAlign: "center",
  color: "#6b7280",
};
