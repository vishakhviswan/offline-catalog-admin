import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "./Layout/Sidebar";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import OrdersList from "./pages/OrdersList";
import Invoices from "./pages/Invoices";
import CreateOrders from "./pages/CreateOrders";
import AdminSettings from "./pages/AdminSettings";
import Salesman from "./pages/Salesman";

import { SettingsProvider } from "./context/SettingsContext";
import Vendors from "./pages/Vendors";
import SalesImport from "./pages/SalesImport";

const SALESMAN_AUTH_KEY = "salesman_auth_v1";

function hasSalesmanSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SALESMAN_AUTH_KEY) || "null");
    return !!(parsed?.mobile && parsed?.name);
  } catch {
    return false;
  }
}

/* ================= ROOT ================= */

export default function App() {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}

/* ================= MAIN APP ================= */

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!hasSalesmanSession()) return;
    if (location.pathname === "/salesman") return;
    navigate("/salesman", { replace: true });
  }, [location.pathname, navigate]);

  const homePath = hasSalesmanSession() ? "/salesman" : "/dashboard";

  return (
    <div style={layout}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div style={content}>
        {/* MOBILE HEADER */}
        <div style={topBar}>
          <button style={menuBtn} onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <div style={{ fontWeight: 600 }}>Admin Panel</div>
        </div>

        <div style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<Navigate to={homePath} replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/orders-list" element={<OrdersList />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/salesman" element={<Salesman />} />
            <Route
              path="/create-order"
              element={
                <CreateOrders
                  onBack={() => navigate("/orders-list")}
                  onSaved={() => navigate("/orders-list")}
                />
              }
            />
            <Route path="/sales-import" element={<SalesImport />} />
            <Route path="*" element={<Navigate to={homePath} replace />} />
          </Routes>
        </div>
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
