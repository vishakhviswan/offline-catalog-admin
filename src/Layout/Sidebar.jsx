import useDevice from "../hooks/useDevice";
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdPeople,
  MdShoppingCart,
  MdListAlt,
  MdAddCircleOutline,
} from "react-icons/md";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={20} /> },
  { id: "products", label: "Products", icon: <MdInventory size={20} /> },
  { id: "categories", label: "Categories", icon: <MdCategory size={20} /> },
  { id: "customers", label: "Customers", icon: <MdPeople size={20} /> },
];

const ordersMenu = [
  {
    id: "orders-list",
    label: "Order List",
    icon: <MdListAlt size={20} />,
  },
  {
    id: "create-order",
    label: "Create Order",
    icon: <MdAddCircleOutline size={20} />,
  },
];

export default function Sidebar({ page, setPage, open, setOpen }) {
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
        {menu.map(({ id, label, icon }) => (
          <MenuItem
            key={id}
            active={page === id}
            icon={icon}
            label={label}
            onClick={() => {
              setPage(id);
              if (isMobile) setOpen(false);
            }}
            showText={!isTablet || open}
          />
        ))}

        {/* ORDERS SECTION */}
        <div style={sectionTitle}>ORDERS</div>

        {ordersMenu.map(({ id, label, icon }) => (
          <MenuItem
            key={id}
            active={page === id}
            icon={icon}
            label={label}
            onClick={() => {
              setPage(id);
              if (isMobile) setOpen(false);
            }}
            showText={!isTablet || open}
          />
        ))}
      </div>
    </>
  );
}

/* ================= COMPONENTS ================= */

function MenuItem({ icon, label, onClick, active, showText }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        borderLeft: active ? "4px solid #3b82f6" : "4px solid transparent",
        transition: "0.2s",
      }}
    >
      <span>{icon}</span>
      {showText && <span style={{ fontSize: 14 }}>{label}</span>}
    </div>
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
