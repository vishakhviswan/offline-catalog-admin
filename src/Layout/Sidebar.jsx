import useDevice from "../hooks/useDevice";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdPeople,
  MdShoppingCart,
  MdDeliveryDining,
  MdListAlt,
  MdAddCircleOutline,
  MdReceiptLong,
  MdSettings,
  MdBusiness,
} from "react-icons/md";

const menu = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    icon: <MdDashboard size={20} />,
  },
  {
    id: "products",
    path: "/products",
    label: "Products",
    icon: <MdInventory size={20} />,
  },
  {
    id: "categories",
    path: "/categories",
    label: "Categories",
    icon: <MdCategory size={20} />,
  },
  {
    id: "customers",
    path: "/customers",
    label: "Customers",
    icon: <MdPeople size={20} />,
  },
  {
    id: "vendors",
    path: "/vendors",
    label: "Vendors",
    icon: <MdBusiness size={20} />,
  },
  {
    id: "salesman",
    path: "/salesman",
    label: "Salesman",
    icon: <MdDeliveryDining size={20} />,
  },
  {
    id: "settings",
    path: "/settings",
    label: "settings",
    icon: <MdSettings size={20} />,
  },
];

const ordersMenu = [
  {
    id: "orders-list",
    path: "/orders-list",
    label: "Order List",
    icon: <MdListAlt size={20} />,
  },
  {
    id: "invoices",
    path: "/invoices",
    label: "Invoices",
    icon: <MdReceiptLong size={20} />,
  },
  {
    id: "create-order",
    path: "/create-order",
    label: "Create Order",
    icon: <MdAddCircleOutline size={20} />,
  },
  {
    path: "/sales-import",
    label: "Sales Import",
    id: "sales-import",
  },
];

export default function Sidebar({ open, setOpen }) {
  const { isMobile, isTablet } = useDevice();

  const sidebarStyle = {
    width: isMobile ? 240 : isTablet ? (open ? 240 : 72) : 240,
    height: "100vh",
    background: "linear-gradient(180deg,#0f172a,#1e293b)",
    color: "#fff",
    position: isMobile ? "fixed" : "relative",
    left: isMobile && !open ? "-240px" : 0,
    top: 0,
    transition: "all 0.3s ease",
    zIndex: 1000,
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999,
          }}
        />
      )}

      <div style={sidebarStyle}>
        {/* HEADER */}
        <div style={header}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Admin Panel</div>
        </div>

        {/* MAIN MENU */}
        {menu.map(({ id, path, label, icon }) => (
          <MenuItem
            key={id}
            to={path}
            icon={icon}
            label={label}
            onNavigate={() => {
              if (isMobile) {
                setOpen(false);
              }
            }}
            showText={!isTablet || open}
          />
        ))}

        {/* ORDERS SECTION */}
        <div style={sectionTitle}>ORDERS</div>

        {ordersMenu.map(({ id, path, label, icon }) => (
          <MenuItem
            key={id}
            to={path}
            icon={icon}
            label={label}
            onNavigate={() => {
              if (isMobile) {
                setOpen(false);
              }
            }}
            showText={!isTablet || open}
          />
        ))}
      </div>
    </>
  );
}

/* ================= COMPONENTS ================= */

function MenuItem({ icon, label, to, onNavigate, showText }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      style={({ isActive }) => ({
        padding: "12px 16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
        borderLeft: isActive ? "4px solid #3b82f6" : "4px solid transparent",
        transition: "0.2s",
        color: "#fff",
        textDecoration: "none",
      })}
    >
      <span>{icon}</span>
      {showText && <span style={{ fontSize: 14 }}>{label}</span>}
    </NavLink>
  );
}

/* ================= STYLES ================= */

const header = {
  padding: "18px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  marginBottom: 8,
};

const sectionTitle = {
  padding: "10px 16px",
  fontSize: 12,
  opacity: 0.6,
};
