import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { supabase } from "../supabaseClient";

const SORT_OPTIONS = [
  { value: "created_at", label: "Created Date" },
  { value: "invoice_date", label: "Invoice Date" },
  { value: "invoice_no", label: "Invoice No" },
  { value: "customer_name", label: "Customer Name" },
  { value: "total_amount", label: "Total Amount" },
];

function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function dateOnly(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Invoices() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeItems, setActiveItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  async function loadInvoices() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.message || "Invoices load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const sourceOptions = useMemo(() => {
    return [...new Set(invoices.map((inv) => inv.source).filter(Boolean))];
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const searchKey = search.trim().toLowerCase();
    const fromValue = dateFrom || "";
    const toValue = dateTo || "";

    let list = [...invoices];

    if (searchKey) {
      list = list.filter((inv) =>
        `${inv.invoice_no || ""} ${inv.customer_name || ""}`
          .toLowerCase()
          .includes(searchKey),
      );
    }

    if (sourceFilter !== "all") {
      list = list.filter((inv) => (inv.source || "") === sourceFilter);
    }

    if (fromValue) {
      list = list.filter((inv) => {
        const candidate = dateOnly(inv.invoice_date || inv.created_at);
        return candidate && candidate >= fromValue;
      });
    }

    if (toValue) {
      list = list.filter((inv) => {
        const candidate = dateOnly(inv.invoice_date || inv.created_at);
        return candidate && candidate <= toValue;
      });
    }

    list.sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;

      if (sortKey === "total_amount") {
        return (
          (toNumber(a.total_amount) - toNumber(b.total_amount)) * direction
        );
      }

      const leftRaw = a[sortKey] ?? "";
      const rightRaw = b[sortKey] ?? "";

      const leftDate = new Date(leftRaw);
      const rightDate = new Date(rightRaw);
      const dateComparable =
        !Number.isNaN(leftDate.getTime()) && !Number.isNaN(rightDate.getTime());

      if (dateComparable) {
        return (leftDate.getTime() - rightDate.getTime()) * direction;
      }

      return String(leftRaw).localeCompare(String(rightRaw)) * direction;
    });

    return list;
  }, [invoices, search, sourceFilter, dateFrom, dateTo, sortKey, sortDir]);

  async function openPreview(invoice) {
    setActiveInvoice(invoice);
    setActiveItems([]);
    setPreviewOpen(true);
    setPreviewLoading(true);

    try {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setActiveItems(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.message || "Preview load failed");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function deleteInvoices(ids) {
    const invoiceIds = [...new Set((ids || []).filter(Boolean))];
    if (!invoiceIds.length) return;

    const isBulk = invoiceIds.length > 1;
    const confirmText = isBulk
      ? `Delete ${invoiceIds.length} invoices?`
      : "Delete this invoice?";

    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      setDeleting(true);

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .delete()
        .in("invoice_id", invoiceIds);

      if (itemsError) throw itemsError;

      const { error: invoicesError } = await supabase
        .from("invoices")
        .delete()
        .in("id", invoiceIds);

      if (invoicesError) throw invoicesError;

      setInvoices((prev) => prev.filter((inv) => !invoiceIds.includes(inv.id)));
      setSelectedIds((prev) => prev.filter((id) => !invoiceIds.includes(id)));

      if (activeInvoice && invoiceIds.includes(activeInvoice.id)) {
        setPreviewOpen(false);
        setActiveInvoice(null);
        setActiveItems([]);
      }

      toast.success(
        isBulk ? `${invoiceIds.length} invoices deleted` : "Invoice deleted",
      );
    } catch (error) {
      toast.error(error?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const selectedInFiltered = filteredInvoices.filter((inv) =>
    selectedIds.includes(inv.id),
  ).length;
  const allFilteredSelected =
    filteredInvoices.length > 0 &&
    selectedInFiltered === filteredInvoices.length;
  const someFilteredSelected =
    selectedInFiltered > 0 && selectedInFiltered < filteredInvoices.length;

  return (
    <Box maxWidth={1400} mx="auto">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={1}
        mb={2}
      >
        <Typography variant="h5" fontWeight={700}>
          Invoices
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadInvoices}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {selectedIds.length > 0 && (
        <Card sx={{ p: 1.5, mb: 2, background: "#fff7ed" }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography fontWeight={600}>
              {selectedIds.length} selected
            </Typography>
            <Button
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => deleteInvoices(selectedIds)}
              disabled={deleting}
            >
              Delete Selected
            </Button>
          </Stack>
        </Card>
      )}

      <Card sx={{ p: 1.5, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Search invoice no / customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
          />

          <Select
            size="small"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="all">All Sources</MenuItem>
            {sourceOptions.map((source) => (
              <MenuItem key={source} value={source}>
                {source}
              </MenuItem>
            ))}
          </Select>

          <TextField
            size="small"
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Select
            size="small"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            sx={{ minWidth: 170 }}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="desc">Desc</MenuItem>
            <MenuItem value="asc">Asc</MenuItem>
          </Select>
        </Stack>
      </Card>

      <Card>
        {loading ? (
          <Typography p={2}>Loading invoices...</Typography>
        ) : filteredInvoices.length === 0 ? (
          <Typography p={2} color="text.secondary">
            No invoices found
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: "72vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allFilteredSelected}
                      indeterminate={someFilteredSelected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const filteredIds = filteredInvoices.map(
                          (inv) => inv.id,
                        );

                        if (checked) {
                          setSelectedIds((prev) => [
                            ...new Set([...prev, ...filteredIds]),
                          ]);
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => !filteredIds.includes(id)),
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Invoice Date</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow
                    hover
                    key={inv.id}
                    sx={{ cursor: "pointer" }}
                    onClick={() => openPreview(inv)}
                  >
                    <TableCell
                      padding="checkbox"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(inv.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedIds((prev) =>
                            checked
                              ? [...new Set([...prev, inv.id])]
                              : prev.filter((id) => id !== inv.id),
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>{inv.invoice_no || "-"}</TableCell>
                    <TableCell>{inv.customer_name || "-"}</TableCell>
                    <TableCell>
                      {formatDate(inv.invoice_date || inv.created_at)}
                    </TableCell>
                    <TableCell>
                      {inv.source ? (
                        <Chip size="small" label={inv.source} />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {toNumber(inv.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{formatDateTime(inv.created_at)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => openPreview(inv)}
                        >
                          Preview
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={deleting}
                          onClick={() => deleteInvoices([inv.id])}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Invoice Preview</DialogTitle>
        <DialogContent dividers>
          {!activeInvoice ? (
            <Typography color="text.secondary">No invoice selected</Typography>
          ) : (
            <Stack spacing={1.5}>
              <Typography>
                <b>Invoice No:</b> {activeInvoice.invoice_no || "-"}
              </Typography>
              <Typography>
                <b>Customer:</b> {activeInvoice.customer_name || "-"}
              </Typography>
              <Typography>
                <b>Invoice Date:</b>{" "}
                {formatDate(
                  activeInvoice.invoice_date || activeInvoice.created_at,
                )}
              </Typography>
              <Typography>
                <b>Source:</b> {activeInvoice.source || "-"}
              </Typography>
              <Typography>
                <b>Total:</b> {toNumber(activeInvoice.total_amount).toFixed(2)}
              </Typography>

              <Divider sx={{ my: 1 }} />

              {previewLoading ? (
                <Typography>Loading items...</Typography>
              ) : activeItems.length === 0 ? (
                <Typography color="text.secondary">No invoice items</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name || "-"}</TableCell>
                          <TableCell align="right">
                            {toNumber(item.qty)}
                          </TableCell>
                          <TableCell>{item.unit || "-"}</TableCell>
                          <TableCell align="right">
                            {toNumber(item.price).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {toNumber(item.total).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
