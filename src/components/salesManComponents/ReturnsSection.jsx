import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SectionDateFilterCard from "./SectionDateFilterCard";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => num(v).toFixed(2);
const toId = (v) => String(v ?? "");

export default function ReturnsSection({
  isMobile,
  sectionDatePresets,
  filter,
  showCustomWarning,
  onChangePreset,
  onChangeFrom,
  onChangeTo,
  rows,
  orderedInvoices,
  invoiceItemsByInvoice,
  waTarget,
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEditMode, setPreviewEditMode] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewRow, setPreviewRow] = useState(null);
  const previewRef = useRef(null);
  const phone = String(waTarget || "").replace(/\D/g, "");
  const hasValidPhone = phone.length >= 10;
  const currentPreviewInvoiceId = previewRow?.inv?.id;

  function getInvoiceItems(invoiceId) {
    return (invoiceItemsByInvoice?.[invoiceId] || []).map((it) => ({
      itemId: it.id,
      name: it.product_name || "-",
      maxQty: Math.max(0, num(it.qty)),
      rate: Math.max(0, num(it.price)),
    }));
  }

  function getPreviousInvoicesFor(currentId) {
    if (!currentId) return [];
    const idx = (orderedInvoices || []).findIndex(
      (inv) => toId(inv.id) === toId(currentId),
    );
    if (idx <= 0) return [];
    return (orderedInvoices || [])
      .slice(0, idx)
      .reverse()
      .filter((inv) => (invoiceItemsByInvoice?.[inv.id] || []).length > 0);
  }

  const previousInvoices = getPreviousInvoicesFor(currentPreviewInvoiceId);

  function buildReturnMessage(r, items = []) {
    const validItems = Array.isArray(items)
      ? items.filter((it) => (it?.name || "").trim() && num(it?.qty) > 0)
      : [];
    const itemLines = validItems.map(
      (it, idx) =>
        `${idx + 1}. ${it.name} - Qty ${num(it.qty)} - Rate ${money(it.rate)}`,
    );
    const returnAmount = validItems.reduce(
      (sum, it) => sum + Math.max(0, num(it.qty)) * Math.max(0, num(it.rate)),
      0,
    );
    return [
      "Sales Return",
      `Shop: ${r?.inv?.customer_name || "-"}`,
      `Invoice: ${r?.inv?.invoice_no || "-"}`,
      `Return: ${money(returnAmount > 0 ? returnAmount : num(r?.amt))}`,
      "Items:",
      ...(itemLines.length ? itemLines : ["-"]),
    ].join("\n");
  }

  function createDefaultItem(source = "current") {
    const wantPrevious = source === "previous" && previousInvoices.length > 0;
    const fromInvoiceId = wantPrevious ? previousInvoices[0].id : currentPreviewInvoiceId;
    const sourceValue = wantPrevious ? "previous" : "current";
    const catalog = getInvoiceItems(fromInvoiceId);
    const picked = catalog[0];
    return {
      source: sourceValue,
      fromInvoiceId,
      itemId: picked?.itemId || "",
      name: picked?.name || "",
      qty: picked ? Math.min(Math.max(1, num(picked.maxQty, 1)), num(picked.maxQty, 1)) : 1,
      rate: picked?.rate || 0,
      maxQty: picked?.maxQty || 0,
    };
  }

  function normalizePreviewItem(raw, currentId) {
    const source = raw?.source === "previous" ? "previous" : "current";
    const prev = getPreviousInvoicesFor(currentId);
    let fromInvoiceId = source === "current" ? currentId : raw?.fromInvoiceId;
    if (
      source === "previous" &&
      !prev.some((inv) => toId(inv.id) === toId(fromInvoiceId))
    ) {
      fromInvoiceId = prev[0]?.id || "";
    }
    const catalog = getInvoiceItems(fromInvoiceId);
    const matched =
      catalog.find((it) => toId(it.itemId) === toId(raw?.itemId)) ||
      catalog.find((it) => it.name === raw?.name) ||
      catalog[0];
    if (!matched) {
      return {
        source,
        fromInvoiceId,
        itemId: "",
        name: raw?.name || "",
        qty: Math.max(1, num(raw?.qty, 1)),
        rate: Math.max(0, num(raw?.rate)),
        maxQty: Math.max(0, num(raw?.maxQty)),
      };
    }
    return {
      source,
      fromInvoiceId,
      itemId: matched.itemId,
      name: matched.name,
      qty: Math.min(Math.max(1, num(raw?.qty, 1)), Math.max(1, matched.maxQty)),
      rate: matched.rate,
      maxQty: matched.maxQty,
    };
  }

  function openPreview(r) {
    setPreviewRow(r);
    const currentId = r?.inv?.id;
    const seed =
      Array.isArray(r?.items) && r.items.length
        ? r.items.map((it) =>
            normalizePreviewItem(
              {
                source: "current",
                fromInvoiceId: currentId,
                itemId: it.itemId,
                name: it.name,
                qty: it.qty,
                rate: it.rate,
                maxQty: it.maxQty,
              },
              currentId,
            ),
          )
        : [normalizePreviewItem({ source: "current" }, currentId)];
    setPreviewItems(seed);
    setPreviewEditMode(false);
    setPreviewOpen(true);
  }

  function setRowSource(index, source) {
    setPreviewItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? normalizePreviewItem(
              {
                ...it,
                source,
                fromInvoiceId: source === "current" ? currentPreviewInvoiceId : it.fromInvoiceId,
                itemId: "",
              },
              currentPreviewInvoiceId,
            )
          : it,
      ),
    );
  }

  function setRowInvoice(index, fromInvoiceId) {
    setPreviewItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? normalizePreviewItem(
              {
                ...it,
                fromInvoiceId,
                itemId: "",
              },
              currentPreviewInvoiceId,
            )
          : it,
      ),
    );
  }

  function setRowItem(index, itemId) {
    setPreviewItems((prev) =>
      prev.map((it, i) =>
        i !== index
          ? it
          : normalizePreviewItem(
              {
                ...it,
                itemId,
                qty: 1,
              },
              currentPreviewInvoiceId,
            ),
      ),
    );
  }

  function setRowQty(index, qty) {
    setPreviewItems((prev) =>
      prev.map((it, i) =>
        i !== index
          ? it
          : {
              ...it,
              qty: Math.min(Math.max(1, num(qty, 1)), Math.max(1, num(it.maxQty, 1))),
            },
      ),
    );
  }

  function addPreviewItem(source = "current") {
    setPreviewItems((prev) => [...prev, createDefaultItem(source)]);
  }

  function removePreviewItem(index) {
    setPreviewItems((prev) => prev.filter((_, i) => i !== index));
  }

  function rowCatalog(it) {
    return getInvoiceItems(
      it.source === "previous" ? it.fromInvoiceId : currentPreviewInvoiceId,
    );
  }

  function confirmShare() {
    if (!previewRow || !hasValidPhone) return;
    const text = encodeURIComponent(buildReturnMessage(previewRow, previewItems));
    const primaryUrl = `https://wa.me/${phone}?text=${text}`;
    const fallbackUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
    const popup = window.open(primaryUrl, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = fallbackUrl;
    setPreviewOpen(false);
    setPreviewEditMode(false);
  }

  useEffect(() => {
    if (!previewOpen || !previewRef.current) return;
    const timer = window.setTimeout(() => {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [previewOpen]);

  return (
    <Stack spacing={1.5}>
      <SectionDateFilterCard
        title="Sales Return"
        presets={sectionDatePresets}
        filter={filter}
        showCustomWarning={showCustomWarning}
        onChangePreset={onChangePreset}
        onChangeFrom={onChangeFrom}
        onChangeTo={onChangeTo}
      />

      {previewOpen && (
        <Card
          ref={previewRef}
          variant="outlined"
          sx={{
            p: { xs: 1.2, md: 1.5 },
            borderRadius: 2.5,
            borderColor: "success.light",
            background:
              "linear-gradient(120deg, #ecfdf5 0%, #dcfce7 50%, #f0fdf4 100%)",
          }}
        >
          <Typography fontWeight={800} mb={0.4}>
            Sales Return Share Preview
          </Typography>
          <Typography color="text.secondary" fontSize={13} mb={1}>
            {previewRow?.inv?.customer_name || "-"} | Invoice: {previewRow?.inv?.invoice_no || "-"}
          </Typography>

          {previewEditMode ? (
            <Stack spacing={1}>
              <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small" sx={{ minWidth: 860 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Source</TableCell>
                      <TableCell>Invoice</TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewItems.map((it, idx) => {
                      const catalog = rowCatalog(it);
                      const qtyOptions = Array.from(
                        { length: Math.max(1, num(it.maxQty, 1)) },
                        (_, i) => i + 1,
                      );
                      return (
                        <TableRow key={`${idx}-${it.itemId}-${it.fromInvoiceId}`}>
                          <TableCell>
                            <Select
                              size="small"
                              value={it.source}
                              onChange={(e) => setRowSource(idx, e.target.value)}
                              sx={{ minWidth: 160 }}
                            >
                              <MenuItem value="current">Current Invoice</MenuItem>
                              <MenuItem value="previous">From Previous Invoices</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {it.source === "previous" ? (
                              <Select
                                size="small"
                                value={it.fromInvoiceId || ""}
                                onChange={(e) => setRowInvoice(idx, e.target.value)}
                                sx={{ minWidth: 210 }}
                              >
                                {previousInvoices.length ? (
                                  previousInvoices.map((inv) => (
                                    <MenuItem key={inv.id} value={inv.id}>
                                      {inv.invoice_no || "-"} - {inv.customer_name || "-"}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem value="" disabled>
                                    No previous invoices
                                  </MenuItem>
                                )}
                              </Select>
                            ) : (
                              <Typography fontSize={13}>
                                {previewRow?.inv?.invoice_no || "-"} - Current
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={it.itemId || ""}
                              onChange={(e) => setRowItem(idx, e.target.value)}
                              sx={{ minWidth: 240 }}
                            >
                              {catalog.length ? (
                                catalog.map((opt) => (
                                  <MenuItem key={opt.itemId} value={opt.itemId}>
                                    {opt.name} (Qty {opt.maxQty}, Rate {money(opt.rate)})
                                  </MenuItem>
                                ))
                              ) : (
                                <MenuItem value="" disabled>
                                  No items
                                </MenuItem>
                              )}
                            </Select>
                          </TableCell>
                          <TableCell align="right">
                            <Select
                              size="small"
                              value={Math.min(Math.max(1, num(it.qty, 1)), Math.max(1, num(it.maxQty, 1)))}
                              onChange={(e) => setRowQty(idx, e.target.value)}
                              sx={{ width: 90 }}
                            >
                              {qtyOptions.map((q) => (
                                <MenuItem key={q} value={q}>
                                  {q}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell align="right">{money(it.rate)}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removePreviewItem(idx)}
                              disabled={previewItems.length <= 1}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button size="small" variant="outlined" onClick={() => addPreviewItem("current")}>
                    Add Item
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => addPreviewItem("previous")}
                    disabled={!previousInvoices.length}
                  >
                    Add From Previous Invoices
                  </Button>
                </Stack>
                <Typography fontSize={13} color="text.secondary">
                  Return:{" "}
                  {money(
                    previewItems.reduce(
                      (sum, it) => sum + Math.max(0, num(it.qty)) * Math.max(0, num(it.rate)),
                      0,
                    ),
                  )}
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Typography fontSize={14} whiteSpace="pre-line">
              {buildReturnMessage(previewRow, previewItems)}
            </Typography>
          )}

          {!hasValidPhone && (
            <Typography color="error.main" fontSize={13} mt={1}>
              Invalid WhatsApp number. Add country code in salesman settings.
            </Typography>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1.2}>
            <Button variant="outlined" onClick={() => setPreviewEditMode((v) => !v)}>
              {previewEditMode ? "Done Edit" : "Edit"}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={confirmShare}
              disabled={!hasValidPhone}
            >
              Confirm & Share
            </Button>
            <Button
              variant="text"
              color="inherit"
              onClick={() => {
                setPreviewOpen(false);
                setPreviewEditMode(false);
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Card>
      )}

      <Card sx={{ p: 1, borderRadius: 3 }}>
        {isMobile ? (
          <Stack spacing={1}>
            {rows.map((r) => (
              <Card key={r.inv.id} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                <Stack spacing={0.6}>
                  <Typography fontWeight={700}>{r.inv.customer_name || "-"}</Typography>
                  <Typography color="text.secondary" fontSize={13}>
                    Invoice: {r.inv.invoice_no || "-"}
                  </Typography>
                  <Typography fontWeight={700}>Return: {money(r.amt)}</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<WhatsAppIcon />}
                    onClick={() => openPreview(r)}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Preview
                  </Button>
                </Stack>
              </Card>
            ))}
            {rows.length === 0 && <Typography color="text.secondary">No returns</Typography>}
          </Stack>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Return Amount</TableCell>
                  <TableCell align="right">Share</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.inv.id}>
                    <TableCell>{r.inv.invoice_no || "-"}</TableCell>
                    <TableCell>{r.inv.customer_name || "-"}</TableCell>
                    <TableCell align="right">{money(r.amt)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<WhatsAppIcon />} onClick={() => openPreview(r)}>
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary">No returns</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Stack>
  );
}
