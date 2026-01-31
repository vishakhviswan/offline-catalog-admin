import { useState } from "react";

import Sidebar from "./Layout/Sidebar";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import OrdersList from "./pages/OrdersList";
import CreateOrders from "./pages/CreateOrders";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function renderPage() {
    switch (page) {
      case "dashboard":
        return <Dashboard />;

      case "products":
        return <Products />;

      case "categories":
        return <Categories />;

      case "customers":
        return <Customers />;

      /* ===== ORDERS ===== */
      case "orders-list":
        return <OrdersList />;

      case "create-order":
        return (
          <CreateOrders
            onBack={() => setPage("orders-list")}
            onSaved={() => setPage("orders-list")}
          />
        );

      default:
        return <Dashboard />;
    }
  }

  return (
    <div style={layout}>
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div style={content}>
        {/* MOBILE HEADER */}
        <div style={topBar}>
          <button style={menuBtn} onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <div style={{ fontWeight: 600 }}>Admin Panel</div>
        </div>

        <div style={{ padding: 20 }}>{renderPage()}</div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "#f1f5f9",
};

const content = {
  flex: 1,
  overflowY: "auto",
};

const topBar = {
  display: "none",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px",
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
};

/* Mobile only */
if (window.innerWidth < 768) {
  topBar.display = "flex";
}

const menuBtn = {
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 18,
  cursor: "pointer",
};
