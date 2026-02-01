import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  Typography,
  Stack,
  Box,
  Button,
  Divider,
  Chip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";

import { apiGet } from "../api/api";

/* ======================================================
   ADMIN DASHBOARD – FINAL STABLE & RESPONSIVE
====================================================== */

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        const p = await apiGet("/api/products");
        setProducts(p || []);

        try {
          const o = await apiGet("/api/orders");
          setOrders(o || []);
        } catch {
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ================= PRODUCT STATS ================= */
  const stockStats = useMemo(() => {
    let inStock = 0;
    let outStock = 0;
    let lowStock = 0;
    let totalQty = 0;
    let totalValue = 0;

    products.forEach((p) => {
      const qty = Number(p.stock || 0);
      const price = Number(p.price || 0);

      totalQty += qty;
      totalValue += qty * price;

      if (qty === 0) outStock++;
      else {
        inStock++;
        if (qty < 5) lowStock++;
      }
    });

    return {
      totalProducts: products.length,
      inStock,
      outStock,
      lowStock,
      totalQty,
      totalValue,
    };
  }, [products]);

  /* ================= ORDER STATS ================= */
  const orderStats = useMemo(() => {
    const today = new Date();
    const m = today.getMonth();
    const y = today.getFullYear();

    let todayOrders = 0;
    let todayRevenue = 0;
    let monthOrders = 0;
    let monthRevenue = 0;

    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const amount = Number(o.total || 0);

      if (
        d.getDate() === today.getDate() &&
        d.getMonth() === m &&
        d.getFullYear() === y
      ) {
        todayOrders++;
        todayRevenue += amount;
      }

      if (d.getMonth() === m && d.getFullYear() === y) {
        monthOrders++;
        monthRevenue += amount;
      }
    });

    return {
      totalOrders: orders.length,
      todayOrders,
      todayRevenue,
      monthOrders,
      monthRevenue,
    };
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <Box py={6} textAlign="center" color="text.secondary">
        Loading dashboard…
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* ================= HEADER ================= */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Admin Dashboard
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => window.dispatchEvent(new CustomEvent("go-products"))}
          >
            Add Product
          </Button>
          <Button
            startIcon={<ListAltIcon />}
            variant="outlined"
            onClick={() => window.dispatchEvent(new CustomEvent("go-orders"))}
          >
            Orders
          </Button>
        </Stack>
      </Stack>

      {/* ================= KPI GRID ================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <KpiCard
          title="Total Products"
          value={stockStats.totalProducts}
          icon={<Inventory2Icon />}
        />
        <KpiCard
          title="In Stock"
          value={stockStats.inStock}
          icon={<Inventory2Icon />}
        />
        <KpiCard
          title="Out of Stock"
          value={stockStats.outStock}
          icon={<WarningAmberIcon />}
          color="#dc2626"
        />
        <KpiCard
          title="Low Stock (<5)"
          value={stockStats.lowStock}
          icon={<WarningAmberIcon />}
          color="#f59e0b"
        />
        <KpiCard
          title="Stock Quantity"
          value={stockStats.totalQty}
          icon={<Inventory2Icon />}
        />
        <KpiCard
          title="Stock Value"
          value={`₹${stockStats.totalValue.toLocaleString()}`}
          icon={<CurrencyRupeeIcon />}
        />
        <KpiCard
          title="Orders Today"
          value={orderStats.todayOrders}
          icon={<ShoppingCartIcon />}
        />
        <KpiCard
          title="Month Revenue"
          value={`₹${orderStats.monthRevenue.toLocaleString()}`}
          icon={<CurrencyRupeeIcon />}
        />
      </Box>

      {/* ================= STOCK ALERT ================= */}
      {(stockStats.outStock > 0 || stockStats.lowStock > 0) && (
        <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography fontWeight={700} mb={1}>
            ⚠ Stock Alerts
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {stockStats.outStock > 0 && (
              <Chip
                color="error"
                label={`${stockStats.outStock} items out of stock`}
              />
            )}
            {stockStats.lowStock > 0 && (
              <Chip
                color="warning"
                label={`${stockStats.lowStock} items low stock`}
              />
            )}
          </Stack>
        </Card>
      )}

      {/* ================= RECENT ORDERS ================= */}
      <Card sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography fontWeight={700} mb={1}>
          Recent Orders
        </Typography>
        <Divider sx={{ mb: 1 }} />

        {recentOrders.length === 0 ? (
          <Typography color="text.secondary">No recent orders</Typography>
        ) : (
          <Stack spacing={1}>
            {recentOrders.map((o) => (
              <Box
                key={o.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1.2,
                  borderRadius: 1,
                  background: "#f8fafc",
                }}
              >
                <Box>
                  <Typography fontWeight={600}>
                    {o.customer_name || "—"}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {new Date(o.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography fontWeight={700}>₹{o.total}</Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Container>
  );
}

/* ================= KPI CARD ================= */

function KpiCard({ title, value, icon, color }) {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color: color || "#2563eb" }}>{icon}</Box>
        <Typography fontSize={13} color="text.secondary">
          {title}
        </Typography>
      </Stack>
      <Typography
        mt={1}
        fontSize={22}
        fontWeight={800}
        color={color || "#111827"}
      >
        {value}
      </Typography>
    </Card>
  );
}
