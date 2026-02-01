import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Select,
  MenuItem,
  Card,
  Checkbox,
  Drawer,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AssessmentIcon from "@mui/icons-material/Assessment";

import { apiGet, apiPut, apiDelete } from "../api/api";

/* ======================================================
   ORDERS LIST – FINAL STABLE VERSION (FIXED)
====================================================== */

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selected, setSelected] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [activeOrder, setActiveOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("party");

  /* ================= LOAD ================= */
  async function loadOrders() {
    try {
      setLoading(true);
      const data = await apiGet("/api/orders");
      setOrders(data || []);
    } catch {
      toast.error("Orders load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* ================= FILTER ================= */
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (search) {
      list = list.filter((o) =>
        o.customer_name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (statusFilter) {
      list = list.filter((o) => o.status === statusFilter);
    }

    return list;
  }, [orders, search, statusFilter]);

  /* ================= STATUS ================= */
  async function updateStatus(orderId, status) {
    console.log("Updating status:", orderId, status);

    try {
      await apiPut(`/api/orders/${orderId}/status`, { status });
      toast.success("Status updated");
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Status update failed");
    }
  }

  async function bulkStatusChange(status) {
    try {
      for (const id of selected) {
        await apiPut(`/api/orders/${id}/status`, { status });
      }
      toast.success("Bulk status updated");
      setSelected([]);
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Bulk status failed");
    }
  }

  /* ================= DELETE ================= */
  async function handleBulkDelete() {
    if (selected.length === 0) return;

    try {
      for (const id of selected) {
        await apiDelete(`/api/orders/${id}`);
      }
      toast.success("Order(s) deleted");
      setSelected([]);
      setConfirmDelete(false);
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  }

  /* ================= PRINT ================= */
  function printOrder(order) {
    let text = `ORDER SLIP\n\nCustomer: ${order.customer_name}\n\n`;
    order.order_items?.forEach((it, i) => {
      text += `${i + 1}) ${it.product_name} - ${it.qty} ${it.unit_name}\n`;
    });
    text += `\nTotal: ₹${order.total}`;

    const w = window.open("");
    w.document.write(`<pre>${text}</pre>`);
    w.print();
  }

  /* ================= SHARE ================= */
  function shareOrder(order) {
    let msg = `*ORDER SUMMARY*\nCustomer: ${order.customer_name}\n\n`;
    order.order_items?.forEach((it, i) => {
      msg += `${i + 1}) ${it.product_name}\n   ${it.qty} ${it.unit_name}\n\n`;
    });
    msg += `Total: ₹${order.total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  }

  /* ================= REPORT ================= */
  const partyReport = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!map[o.customer_name]) map[o.customer_name] = [];
      o.order_items?.forEach((it) => map[o.customer_name].push(it));
    });
    return map;
  }, [orders]);

  const itemReport = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      o.order_items?.forEach((it) => {
        if (!map[it.product_name]) map[it.product_name] = [];
        map[it.product_name].push({
          customer: o.customer_name,
          qty: it.qty,
          unit: it.unit_name,
        });
      });
    });
    return map;
  }, [orders]);

  /* ================= UI ================= */
  return (
    <Box maxWidth={1200} mx="auto" px={{ xs: 1, md: 0 }}>
      {/* HEADER */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Orders
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            size="small"
            value={statusFilter}
            displayEmpty
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="packed">Packed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>

          <Button
            startIcon={<AssessmentIcon />}
            onClick={() => setReportOpen(true)}
          >
            Reports
          </Button>
        </Stack>
      </Stack>

      {/* BULK BAR */}
      {selected.length > 0 && (
        <Card sx={{ p: 1.5, mb: 2, background: "#fff7ed" }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Typography fontWeight={600}>{selected.length} selected</Typography>
            <Button onClick={() => bulkStatusChange("packed")}>
              Mark Packed
            </Button>
            <Button onClick={() => bulkStatusChange("completed")}>
              Mark Completed
            </Button>
            <Button
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </Stack>
        </Card>
      )}

      {/* LIST */}
      <Card>
        {filteredOrders.map((o) => (
          <Box
            key={o.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 1.5,
              borderBottom: "1px solid #eee",
            }}
            onClick={() => {
              setActiveOrder(o);
              setDrawerOpen(true);
            }}
          >
            <Checkbox
              checked={selected.includes(o.id)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...selected, o.id]
                    : selected.filter((id) => id !== o.id),
                )
              }
            />

            <Box flex={1}>
              <Typography fontWeight={600}>{o.customer_name}</Typography>
              <Typography fontSize={12} color="text.secondary">
                {new Date(o.created_at).toLocaleString()}
              </Typography>
            </Box>

            <Select
              size="small"
              value={o.status || "pending"}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateStatus(o.id, e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="packed">Packed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>

            <Typography fontWeight={600}>₹{o.total}</Typography>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setSelected([o.id]);
                setConfirmDelete(true);
              }}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Box>
        ))}
      </Card>

      {/* ORDER DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", md: 480 } } }}
      >
        {activeOrder && (
          <Box p={2}>
            <Typography variant="h6">{activeOrder.customer_name}</Typography>
            <Divider sx={{ my: 1 }} />

            {activeOrder.order_items?.map((it, i) => (
              <Box key={i} py={1}>
                <Typography fontWeight={600}>{it.product_name}</Typography>
                <Typography fontSize={13}>
                  {it.qty} {it.unit_name}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 1 }} />
            <Typography fontWeight={700}>
              Total: ₹{activeOrder.total}
            </Typography>

            <Stack direction="row" spacing={1} mt={2}>
              <Button
                startIcon={<PrintIcon />}
                onClick={() => printOrder(activeOrder)}
              >
                Print
              </Button>
              <Button
                startIcon={<WhatsAppIcon />}
                onClick={() => shareOrder(activeOrder)}
              >
                Share
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* DELETE CONFIRM */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Delete selected order(s)?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleBulkDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
