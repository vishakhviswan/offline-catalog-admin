import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { apiGet, apiPost, apiPut } from "../api/api";
import { supabase } from "../supabaseClient";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Paper,
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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import toast from "react-hot-toast";

const LoadingButton = Button;

const REQUIRED_HEADER_ALIASES = {
  invoice_no: [
    "invoice no",
    "invoice number",
    "invoice",
    "invoice no./txn no.",
    "bill no",
    "voucher no",
    "invoice_no",
  ],
  customer_name: [
    "customer",
    "customer name",
    "party",
    "party name",
    "customer_name",
  ],
  product_name: [
    "product",
    "product name",
    "item",
    "item name",
    "product_name",
  ],
  qty: ["qty", "quantity", "qnty", "qty.", "quantity."],
  rate: ["rate", "price", "sale price", "unit price", "unitprice", "amount"],
  invoice_date: [
    "date",
    "invoice date",
    "bill date",
    "voucher date",
    "inv date",
    "invoice_date",
  ],
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function trimCell(value) {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return value;
}

function parseNumberSafe(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const txt = String(value || "").trim();
  if (!txt) return null;

  const normalized = txt.replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!normalized) return null;

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function parseDateSafe(value) {
  if (value === null || value === undefined) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value || "").trim();
  if (!text) return null;

  const directDate = new Date(text);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString().slice(0, 10);
  }

  const m = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!m) return null;

  const first = Number(m[1]);
  const second = Number(m[2]);
  let year = Number(m[3]);

  if (!Number.isFinite(first) || !Number.isFinite(second) || !Number.isFinite(year)) {
    return null;
  }

  if (year < 100) {
    year += 2000;
  }

  let day = first;
  let month = second;

  if (first <= 12 && second > 12) {
    day = second;
    month = first;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function findHeaderKey(headers, aliases) {
  const normalizedAliases = aliases.map(normalizeHeader);
  return (
    headers.find((header) =>
      normalizedAliases.includes(normalizeHeader(header)),
    ) || null
  );
}

function isCompletelyEmptyRow(row) {
  return Object.values(row).every((value) => trimCell(value) === "");
}

function pickTrimmed(row, key) {
  if (!key) return "";
  const value = trimCell(row[key]);
  return typeof value === "string" ? value : String(value || "");
}

function validateFileRows(rows) {
  if (!rows.length) {
    return {
      ok: false,
      cleanedRows: [],
      errors: [
        {
          type: "empty_sheet",
          message: "The selected sheet has no data rows.",
        },
      ],
      summary: {
        totalRows: 0,
        nonEmptyRows: 0,
        ignoredEmptyRows: 0,
      },
    };
  }

  const headers = Object.keys(rows[0] || {}).map((header) =>
    String(header).trim(),
  );

  const resolvedHeaders = {
    invoice_no: findHeaderKey(headers, REQUIRED_HEADER_ALIASES.invoice_no),
    customer_name: findHeaderKey(
      headers,
      REQUIRED_HEADER_ALIASES.customer_name,
    ),
    product_name: findHeaderKey(headers, REQUIRED_HEADER_ALIASES.product_name),
    qty: findHeaderKey(headers, REQUIRED_HEADER_ALIASES.qty),
    rate: findHeaderKey(headers, REQUIRED_HEADER_ALIASES.rate),
  };
  const invoiceDateHeader = findHeaderKey(
    headers,
    REQUIRED_HEADER_ALIASES.invoice_date,
  );

  const missingHeaders = Object.entries(resolvedHeaders)
    .filter(([, header]) => !header)
    .map(([field]) => ({
      type: "missing_header",
      field,
      message: `Missing required header for "${field}"`,
      accepted_headers: REQUIRED_HEADER_ALIASES[field],
    }));

  if (missingHeaders.length) {
    return {
      ok: false,
      cleanedRows: [],
      errors: missingHeaders,
      summary: {
        totalRows: rows.length,
        nonEmptyRows: 0,
        ignoredEmptyRows: 0,
      },
    };
  }

  let ignoredEmptyRows = 0;
  const cleanedRows = [];
  const errors = [];

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const row = {};

    Object.keys(rawRow || {}).forEach((key) => {
      row[key] = trimCell(rawRow[key]);
    });

    if (isCompletelyEmptyRow(row)) {
      ignoredEmptyRows += 1;
      return;
    }

    const invoiceNo = pickTrimmed(row, resolvedHeaders.invoice_no);
    const customerName = pickTrimmed(row, resolvedHeaders.customer_name);
    const productName = pickTrimmed(row, resolvedHeaders.product_name);
    const qty = parseNumberSafe(row[resolvedHeaders.qty]);
    const rate = parseNumberSafe(row[resolvedHeaders.rate]);
    const invoiceDate = parseDateSafe(
      invoiceDateHeader ? row[invoiceDateHeader] : null,
    );

    const rowErrors = [];
    if (!invoiceNo) rowErrors.push("invoice_no is required");
    if (!customerName) rowErrors.push("customer_name is required");
    if (!productName) rowErrors.push("product_name is required");
    if (qty === null) rowErrors.push("qty must be a valid number");
    if (rate === null) rowErrors.push("rate must be a valid number");
    if (qty !== null && qty <= 0) rowErrors.push("qty must be greater than 0");
    if (rate !== null && rate < 0) rowErrors.push("rate cannot be negative");

    if (rowErrors.length) {
      errors.push({
        type: "row_validation",
        row: rowNumber,
        message: `Row ${rowNumber} validation failed`,
        details: rowErrors,
      });
      return;
    }

    cleanedRows.push({
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      customer_name: customerName,
      product_name: productName,
      qty,
      rate,
    });
  });

  return {
    ok: errors.length === 0,
    cleanedRows,
    errors,
    summary: {
      totalRows: rows.length,
      nonEmptyRows: rows.length - ignoredEmptyRows,
      ignoredEmptyRows,
    },
  };
}

async function parseAndValidateWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames.length) {
    return {
      ok: false,
      cleanedRows: [],
      errors: [
        {
          type: "empty_workbook",
          message: "No sheets found in the uploaded file.",
        },
      ],
      summary: {
        totalRows: 0,
        nonEmptyRows: 0,
        ignoredEmptyRows: 0,
      },
    };
  }

  const sheetName = workbook.SheetNames[1];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      ok: false,
      cleanedRows: [],
      errors: [
        {
          type: "empty_workbook",
          message: "No second sheet found in the uploaded file.",
        },
      ],
      summary: {
        totalRows: 0,
        nonEmptyRows: 0,
        ignoredEmptyRows: 0,
      },
    };
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 2,
    defval: "",
    raw: false,
  });

  return validateFileRows(rows);
}

function extractApiErrors(err) {
  const data = err?.response?.data || err?.data;
  const message =
    data?.message || err?.message || "Analyze failed due to an unexpected error";

  if (Array.isArray(data?.errors) && data.errors.length) {
    return {
      message,
      errors: data.errors.map((item, index) => ({
        type: item?.type || "api_error",
        row: item?.row || null,
        message: item?.message || `Error ${index + 1}`,
        details: Array.isArray(item?.details)
          ? item.details
          : item?.details
            ? [String(item.details)]
            : [],
      })),
    };
  }

  return {
    message,
    errors: [
      {
        type: "api_error",
        row: null,
        message,
        details: [],
      },
    ],
  };
}

function extractEntity(payload, fallbackName) {
  if (payload && typeof payload === "object") {
    if (payload.id != null) {
      return { id: payload.id, name: payload.name || fallbackName };
    }

    if (payload.data && typeof payload.data === "object") {
      if (Array.isArray(payload.data) && payload.data[0]?.id != null) {
        return {
          id: payload.data[0].id,
          name: payload.data[0].name || fallbackName,
        };
      }

      if (payload.data.id != null) {
        return {
          id: payload.data.id,
          name: payload.data.name || fallbackName,
        };
      }
    }
  }

  if (Array.isArray(payload) && payload[0]?.id != null) {
    return {
      id: payload[0].id,
      name: payload[0].name || fallbackName,
    };
  }

  return {
    id: null,
    name: fallbackName,
  };
}

function dedupeSuggestions(items) {
  const seen = new Set();
  const output = [];

  for (const item of items || []) {
    if (!item || item.id == null || seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    output.push({ id: item.id, name: item.name || "" });
  }

  return output;
}

function normalizeReconcileItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    excelName: item?.excelName || "",
    status: item?.status || "new_required",
    match: item?.match ? { id: item.match.id, name: item.match.name || "" } : null,
    suggestions: dedupeSuggestions(item?.suggestions),
    resolved: item?.status === "exact_match" || item?.status === "alias_match",
    autoCreated: false,
    createError: "",
  }));
}

function getStatusColor(status) {
  if (status === "exact_match") return "success";
  if (status === "alias_match") return "info";
  if (status === "similar_match") return "warning";
  return "default";
}

function getStatusLabel(item) {
  if (item.autoCreated) return "auto created";
  if (item.status === "exact_match") return "exact match";
  if (item.status === "alias_match") return "alias match";
  if (item.status === "similar_match") return item.resolved ? "resolved" : "similar";
  return "new required";
}

function isResolved(item) {
  return item?.status === "exact_match" || item?.status === "alias_match";
}

function normalizeEntityName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildProductCreatePayload(productName, rows) {
  const normalizedName = normalizeEntityName(productName);
  const sourceRow = (Array.isArray(rows) ? rows : []).find(
    (row) => normalizeEntityName(row?.product_name) === normalizedName,
  );
  const rate = Number(sourceRow?.rate || 0);
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1;

  return {
    name: String(productName || "").trim(),
    description: "Auto-created from sales import",
    category_id: null,
    vendor_id: null,
    purchase_rate: safeRate,
    margin_percentage: 0,
    price: safeRate,
    mrp: safeRate,
    stock: 0,
    availability: false,
    units: [],
    images: [],
  };
}

function toSafeInteger(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.round(num);
}

function buildIntegerSafeOrderPayload(payload) {
  const items = (payload?.items || []).map((item) => ({
    ...item,
    qty: Math.max(1, toSafeInteger(item?.qty, 1)),
    price: Math.max(0, toSafeInteger(item?.price, 0)),
  }));

  const total = items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0),
    0,
  );

  return {
    ...payload,
    items,
    total: Math.max(0, toSafeInteger(total, 0)),
  };
}

async function trySalesImportEndpoint(file, cleanedRows, invoices) {
  const candidatePaths = [
    "/api/sales/import",
    "/api/import/sales",
    "/api/invoices/import",
  ];

  const basePayload = {
    rows: cleanedRows,
    cleaned_rows: cleanedRows,
    invoices,
  };

  const attempts = [];

  if (file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("cleaned_rows", JSON.stringify(cleanedRows));
    fd.append("invoices", JSON.stringify(invoices));
    attempts.push(fd);
  }

  attempts.push(basePayload);

  for (const path of candidatePaths) {
    for (const body of attempts) {
      try {
        const response = await apiPost(path, body);
        return { ok: true, path, response };
      } catch (error) {
        const status = Number(error?.status || 0);
        if (status === 404 || status === 405) {
          continue;
        }
      }
    }
  }

  return { ok: false };
}

function normalizeInvoiceNo(value) {
  return String(value || "").trim();
}

function toComparableNumber(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(4));
}

function makeItemKey(productName, qty, rate) {
  return `${normalizeEntityName(productName)}|${toComparableNumber(qty)}|${toComparableNumber(rate)}`;
}

function buildItemCountMap(items, rateField) {
  const map = new Map();
  for (const item of items || []) {
    const key = makeItemKey(item?.product_name, item?.qty, item?.[rateField]);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function compareItemMaps(incomingMap, existingMap) {
  const added = [];
  const removed = [];

  for (const [key, count] of incomingMap.entries()) {
    const other = existingMap.get(key) || 0;
    if (count > other) {
      added.push({ key, count: count - other });
    }
  }

  for (const [key, count] of existingMap.entries()) {
    const other = incomingMap.get(key) || 0;
    if (count > other) {
      removed.push({ key, count: count - other });
    }
  }

  return {
    equal: added.length === 0 && removed.length === 0,
    added,
    removed,
  };
}

function groupIncomingByInvoice(rows) {
  const map = new Map();

  for (const row of rows || []) {
    const invoiceNo = normalizeInvoiceNo(row?.invoice_no);
    if (!invoiceNo) continue;

    if (!map.has(invoiceNo)) {
      map.set(invoiceNo, {
        invoice_no: invoiceNo,
        customer_name: String(row?.customer_name || "").trim(),
        invoice_date: parseDateSafe(row?.invoice_date),
        items: [],
      });
    }

    const entry = map.get(invoiceNo);
    if (!entry.customer_name && row?.customer_name) {
      entry.customer_name = String(row.customer_name).trim();
    }

    const parsedDate = parseDateSafe(row?.invoice_date);
    if (!entry.invoice_date && parsedDate) {
      entry.invoice_date = parsedDate;
    }

    entry.items.push({
      product_name: String(row?.product_name || "").trim(),
      qty: Number(row?.qty || 0),
      rate: Number(row?.rate || 0),
    });
  }

  return map;
}

async function detectDuplicateInvoices(cleanedRows) {
  const incomingByInvoice = groupIncomingByInvoice(cleanedRows);
  const invoiceNos = [...incomingByInvoice.keys()];

  if (!invoiceNos.length) {
    return [];
  }

  const { data: existingInvoices, error: invoiceErr } = await supabase
    .from("invoices")
    .select("*")
    .in("invoice_no", invoiceNos)
    .order("created_at", { ascending: false });

  if (invoiceErr) throw invoiceErr;
  if (!Array.isArray(existingInvoices) || existingInvoices.length === 0) {
    return [];
  }

  const latestByInvoiceNo = new Map();
  for (const inv of existingInvoices) {
    const no = normalizeInvoiceNo(inv?.invoice_no);
    if (!no || latestByInvoiceNo.has(no)) continue;
    latestByInvoiceNo.set(no, inv);
  }

  const existingIds = [...latestByInvoiceNo.values()]
    .map((inv) => inv?.id)
    .filter(Boolean);

  const { data: existingItems, error: itemsErr } = await supabase
    .from("invoice_items")
    .select("*")
    .in("invoice_id", existingIds);

  if (itemsErr) throw itemsErr;

  const itemsByInvoiceId = new Map();
  for (const item of existingItems || []) {
    const list = itemsByInvoiceId.get(item.invoice_id) || [];
    list.push(item);
    itemsByInvoiceId.set(item.invoice_id, list);
  }

  const duplicates = [];

  for (const [invoiceNo, incoming] of incomingByInvoice.entries()) {
    const existing = latestByInvoiceNo.get(invoiceNo);
    if (!existing) continue;

    const differences = [];
    const existingCustomer = String(existing?.customer_name || "").trim();
    const incomingCustomer = String(incoming?.customer_name || "").trim();

    if (
      normalizeEntityName(existingCustomer) !== normalizeEntityName(incomingCustomer)
    ) {
      differences.push("Customer name changed");
    }

    const existingDate = parseDateSafe(existing?.invoice_date);
    const incomingDate = parseDateSafe(incoming?.invoice_date);
    if (incomingDate && existingDate !== incomingDate) {
      differences.push("Invoice date changed");
    }

    const existingItemMap = buildItemCountMap(
      itemsByInvoiceId.get(existing.id) || [],
      "price",
    );
    const incomingItemMap = buildItemCountMap(incoming.items, "rate");
    const itemCompare = compareItemMaps(incomingItemMap, existingItemMap);

    if (!itemCompare.equal) {
      differences.push("Items (name/qty/rate) changed");
    }

    duplicates.push({
      invoice_no: invoiceNo,
      existing_invoice_id: existing.id,
      status: differences.length ? "changed" : "unchanged",
      differences,
      incoming_customer_name: incomingCustomer,
      existing_customer_name: existingCustomer,
      incoming_invoice_date: incomingDate,
      existing_invoice_date: existingDate,
    });
  }

  return duplicates;
}

function buildInvoiceItemRows(invoiceId, items, productNameById) {
  return (items || []).map((item) => {
    const qty = Number(item?.qty || 0);
    const price = Number(item?.price || 0);
    const total = qty * price;
    const productName = productNameById.get(item?.product_id) || "";

    return {
      invoice_id: invoiceId,
      product_id: item?.product_id || null,
      product_name: productName,
      qty: Number.isFinite(qty) ? qty : 0,
      unit: "pcs",
      price: Number.isFinite(price) ? price : 0,
      total: Number.isFinite(total) ? total : 0,
    };
  });
}

async function persistInvoiceToSupabase(invoice, orderId, productNameById) {
  const invoiceTotal = Number(invoice?.total || 0);
  const invoiceDate =
    parseDateSafe(invoice?.invoice_date) || new Date().toISOString().slice(0, 10);
  const invoicePayload = {
    invoice_no: invoice?.invoice_no || null,
    invoice_date: invoiceDate,
    customer_id: invoice?.customer_id || null,
    customer_name: invoice?.customer_name || "",
    total_amount: Number.isFinite(invoiceTotal) ? invoiceTotal : 0,
    source: "sales_import_fallback",
    linked_order_id: orderId || null,
  };

  const { data: insertedInvoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert(invoicePayload)
    .select("id")
    .single();

  if (invoiceError) {
    throw invoiceError;
  }

  const invoiceId = insertedInvoice?.id;
  if (!invoiceId) {
    throw new Error("Invoice id missing after insert");
  }

  const itemRows = buildInvoiceItemRows(invoiceId, invoice?.items, productNameById);

  if (!itemRows.length) {
    return;
  }

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);
  if (itemsError) {
    throw itemsError;
  }
}

async function updateExistingInvoiceInSupabase(
  existingInvoiceId,
  invoice,
  productNameById,
) {
  const invoiceTotal = Number(invoice?.total || 0);
  const invoiceDate =
    parseDateSafe(invoice?.invoice_date) || new Date().toISOString().slice(0, 10);

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      invoice_date: invoiceDate,
      customer_id: invoice?.customer_id || null,
      customer_name: invoice?.customer_name || "",
      total_amount: Number.isFinite(invoiceTotal) ? invoiceTotal : 0,
      source: "sales_import_update",
    })
    .eq("id", existingInvoiceId);

  if (updateError) throw updateError;

  const { error: deleteItemsError } = await supabase
    .from("invoice_items")
    .delete()
    .eq("invoice_id", existingInvoiceId);

  if (deleteItemsError) throw deleteItemsError;

  const itemRows = buildInvoiceItemRows(
    existingInvoiceId,
    invoice?.items,
    productNameById,
  );

  if (!itemRows.length) return;

  const { error: insertItemsError } = await supabase
    .from("invoice_items")
    .insert(itemRows);

  if (insertItemsError) throw insertItemsError;
}

export default function SalesImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cleanedRows, setCleanedRows] = useState([]);
  const [rowLoading, setRowLoading] = useState({});
  const [continueLoading, setContinueLoading] = useState(false);
  const [canContinueImport, setCanContinueImport] = useState(false);
  const [pendingResolutions, setPendingResolutions] = useState(0);
  const [duplicateInvoices, setDuplicateInvoices] = useState([]);
  const [duplicateActions, setDuplicateActions] = useState({});

  useEffect(() => {
    const customerRows = analysis?.customers || [];
    const productRows = analysis?.products || [];
    const validationErrors = analysis?.validation_errors || [];

    const unresolvedCount = [...customerRows, ...productRows].filter(
      (item) => !isResolved(item),
    ).length;
    const pendingDuplicateChoices = (duplicateInvoices || []).filter(
      (item) =>
        item.status === "changed" &&
        !["update", "skip"].includes(duplicateActions[item.invoice_no]),
    ).length;

    setPendingResolutions(unresolvedCount);
    setCanContinueImport(
      unresolvedCount === 0 &&
        (analysis?.cleaned_rows || 0) > 0 &&
        validationErrors.length === 0 &&
        pendingDuplicateChoices === 0,
    );
  }, [analysis, duplicateInvoices, duplicateActions]);

  function getRowKey(entityType, excelName) {
    return `${entityType}:${String(excelName || "").toLowerCase()}`;
  }

  function setEntityItems(entityType, updater) {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const key = entityType === "customers" ? "customers" : "products";
      return {
        ...prev,
        [key]: updater(prev[key] || []),
      };
    });
  }

  function updateSingleItem(entityType, excelName, updater) {
    setEntityItems(entityType, (items) =>
      items.map((item) =>
        item.excelName === excelName ? updater(item) : item,
      ),
    );
  }

  function replaceNameInCleanedRows(entityType, fromName, toName) {
    setCleanedRows((prev) =>
      prev.map((row) => {
        if (entityType === "customers" && row.customer_name === fromName) {
          return { ...row, customer_name: toName };
        }

        if (entityType === "products" && row.product_name === fromName) {
          return { ...row, product_name: toName };
        }

        return row;
      }),
    );
  }

  async function resolveWithSuggestion(entityType, item, selected) {
    const rowKey = getRowKey(entityType, item.excelName);
    if (rowLoading[rowKey]) {
      return;
    }

    setRowLoading((prev) => ({ ...prev, [rowKey]: true }));

    try {
      let resolvedName = selected.name;

      if (entityType === "products") {
        const excelName = String(item.excelName || "").trim();
        if (
          normalizeEntityName(excelName) &&
          normalizeEntityName(excelName) !== normalizeEntityName(selected.name)
        ) {
          await apiPut(`/api/products/${selected.id}`, { name: excelName });
        }
        resolvedName = excelName;
      } else {
        replaceNameInCleanedRows(entityType, item.excelName, selected.name);
      }

      updateSingleItem(entityType, item.excelName, (current) => ({
        ...current,
        status: "exact_match",
        match: { id: selected.id, name: resolvedName },
        resolved: true,
        createError: "",
      }));

      if (entityType === "products") {
        toast.success(`Renamed to "${resolvedName}"`);
      }
    } catch (error) {
      const message = error?.message || "Resolve failed";
      updateSingleItem(entityType, item.excelName, (current) => ({
        ...current,
        createError: message,
      }));
      toast.error(message);
    } finally {
      setRowLoading((prev) => ({ ...prev, [rowKey]: false }));
    }
  }

  async function createEntity(entityType, excelName) {
    const endpoint = entityType === "customers" ? "/api/customers" : "/api/products";
    const payload =
      entityType === "customers"
        ? { name: excelName }
        : buildProductCreatePayload(excelName, cleanedRows);
    const response = await apiPost(endpoint, payload);
    const entity = extractEntity(response, excelName);
    if (entity.id == null) {
      throw new Error(`Failed to create ${entityType.slice(0, -1)}: ${excelName}`);
    }
    return entity;
  }

  async function autoResolveNewRequired(entityType, rows) {
    const output = [];

    for (const row of rows) {
      if (row.status !== "new_required") {
        output.push(row);
        continue;
      }

      try {
        const created = await createEntity(entityType, row.excelName);
        replaceNameInCleanedRows(entityType, row.excelName, created.name);
        output.push({
          ...row,
          status: "exact_match",
          match: created,
          resolved: true,
          autoCreated: true,
          createError: "",
        });
      } catch (error) {
        output.push({
          ...row,
          resolved: false,
          createError: error?.message || "Create failed",
        });
      }
    }

    return output;
  }

  async function handleCreateNew(entityType, item) {
    const rowKey = getRowKey(entityType, item.excelName);
    if (rowLoading[rowKey]) {
      return;
    }

    setRowLoading((prev) => ({ ...prev, [rowKey]: true }));

    try {
      const created = await createEntity(entityType, item.excelName);
      replaceNameInCleanedRows(entityType, item.excelName, created.name);

      updateSingleItem(entityType, item.excelName, (current) => ({
        ...current,
        status: "exact_match",
        match: created,
        resolved: true,
        autoCreated: true,
        createError: "",
      }));

      toast.success(`${item.excelName} created`);
    } catch (error) {
      const message = error?.message || "Create failed";
      updateSingleItem(entityType, item.excelName, (current) => ({
        ...current,
        createError: message,
      }));
      toast.error(message);
    } finally {
      setRowLoading((prev) => ({ ...prev, [rowKey]: false }));
    }
  }

  async function handleSuggestionChange(entityType, item, option) {
    if (!option) {
      return;
    }

    if (option.optionType === "create_new") {
      await handleCreateNew(entityType, item);
      return;
    }

    await resolveWithSuggestion(entityType, item, option);
  }

  function getAutocompleteOptions(item) {
    const suggestionOptions = (item.suggestions || []).map((entry) => ({
      ...entry,
      optionType: "suggestion",
    }));

    return [
      ...suggestionOptions,
      {
        id: `create-${item.excelName}`,
        name: `Create New ("${item.excelName}")`,
        optionType: "create_new",
      },
    ];
  }

  async function handleAnalyze() {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setAnalysis(null);
      setCleanedRows([]);
      setRowLoading({});
      setDuplicateInvoices([]);
      setDuplicateActions({});

      const localValidation = await parseAndValidateWorkbook(file);

      if (!localValidation.ok) {
        setAnalysis({
          total_rows: localValidation.summary.totalRows,
          total_invoices: 0,
          customers: [],
          products: [],
          validation_errors: localValidation.errors,
          validation_summary: localValidation.summary,
          cleaned_rows: 0,
        });
        setDialogOpen(true);
        toast.error("Validation failed. Fix the highlighted issues.");
        return;
      }

      setCleanedRows(localValidation.cleanedRows);

      const duplicateChecks = await detectDuplicateInvoices(
        localValidation.cleanedRows,
      );
      setDuplicateInvoices(duplicateChecks);
      const initialDuplicateActions = {};
      duplicateChecks.forEach((item) => {
        initialDuplicateActions[item.invoice_no] =
          item.status === "unchanged" ? "skip" : "";
      });
      setDuplicateActions(initialDuplicateActions);

      if (duplicateChecks.length > 0) {
        const changedCount = duplicateChecks.filter(
          (item) => item.status === "changed",
        ).length;
        if (changedCount > 0) {
          toast.error(
            `${changedCount} duplicate invoice(s) have changes. Choose Update or Skip.`,
          );
        } else {
          toast("Duplicate invoices already exist with same data. They will be skipped.");
        }
      }

      const uniqueCustomers = [
        ...new Set(
          localValidation.cleanedRows
            .map((row) => row.customer_name)
            .filter(Boolean),
        ),
      ];

      const uniqueProducts = [
        ...new Set(
          localValidation.cleanedRows
            .map((row) => row.product_name)
            .filter(Boolean),
        ),
      ];

      const formData = new FormData();
      formData.append("file", file);

      setProgress(35);
      const existingResponseData = await apiPost("/api/sales/analyze", formData);

      setProgress(65);
      const reconcileResponse = await apiPost("/api/import/reconcile", {
        customers: uniqueCustomers,
        products: uniqueProducts,
      });

      const normalizedCustomers = normalizeReconcileItems(
        reconcileResponse?.customers,
      );
      const normalizedProducts = normalizeReconcileItems(
        reconcileResponse?.products,
      );

      setProgress(85);
      const [customers, products] = await Promise.all([
        autoResolveNewRequired("customers", normalizedCustomers),
        autoResolveNewRequired("products", normalizedProducts),
      ]);

      setProgress(100);
      setAnalysis({
        ...(existingResponseData || {}),
        customers,
        products,
        validation_errors: existingResponseData?.validation_errors || [],
        validation_summary: localValidation.summary,
        cleaned_rows: localValidation.cleanedRows.length,
      });

      setDialogOpen(true);
      toast.success("Analysis completed");
    } catch (err) {
      console.error(err);
      const apiError = extractApiErrors(err);
      setAnalysis({
        total_rows: 0,
        total_invoices: 0,
        customers: [],
        products: [],
        validation_errors: apiError.errors,
        cleaned_rows: 0,
      });
      setDialogOpen(true);
      toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleContinueImport() {
    setContinueLoading(true);
    try {
      if (!cleanedRows.length) {
        toast.error("No cleaned rows available for import");
        return;
      }

      const [customerList, productList] = await Promise.all([
        apiGet("/api/customers"),
        apiGet("/api/products"),
      ]);

      const customerNameToId = new Map();
      const productNameToId = new Map();
      const productIdToName = new Map();

      const addEntity = (map, name, id) => {
        const key = normalizeEntityName(name);
        if (!key || id == null || map.has(key)) {
          return;
        }
        map.set(key, id);
      };

      (Array.isArray(customerList) ? customerList : []).forEach((item) =>
        addEntity(customerNameToId, item?.name, item?.id),
      );
      (Array.isArray(productList) ? productList : []).forEach((item) =>
        addEntity(productNameToId, item?.name, item?.id),
      );
      (Array.isArray(productList) ? productList : []).forEach((item) => {
        if (item?.id != null) {
          productIdToName.set(item.id, item?.name || "");
        }
      });

      (analysis?.customers || []).forEach((item) => {
        if (item?.match?.id == null) return;
        addEntity(customerNameToId, item.excelName, item.match.id);
        addEntity(customerNameToId, item.match.name, item.match.id);
      });

      (analysis?.products || []).forEach((item) => {
        if (item?.match?.id == null) return;
        addEntity(productNameToId, item.excelName, item.match.id);
        addEntity(productNameToId, item.match.name, item.match.id);
      });

      const groupedInvoices = new Map();
      const unresolvedRows = [];

      cleanedRows.forEach((row, index) => {
        const rowNo = index + 2;
        const invoiceNo = String(row.invoice_no || "").trim();
        const customerName = String(row.customer_name || "").trim();
        const productName = String(row.product_name || "").trim();
        const invoiceDate = parseDateSafe(row.invoice_date);

        const customerId = customerNameToId.get(normalizeEntityName(customerName));
        const productId = productNameToId.get(normalizeEntityName(productName));

        if (customerId == null || productId == null) {
          unresolvedRows.push({
            row: rowNo,
            invoiceNo,
            customerName,
            productName,
            reason:
              customerId == null && productId == null
                ? "customer and product not mapped"
                : customerId == null
                  ? "customer not mapped"
                  : "product not mapped",
          });
          return;
        }

        const qty = Number(row.qty || 0);
        const price = Number(row.rate || 0);
        const key = `${invoiceNo}::${customerId}`;

        if (!groupedInvoices.has(key)) {
          groupedInvoices.set(key, {
            invoice_no: invoiceNo,
            invoice_date: invoiceDate,
            customer_id: customerId,
            customer_name: customerName,
            items: [],
            total: 0,
          });
        }

        const invoice = groupedInvoices.get(key);
        if (!invoice.invoice_date && invoiceDate) {
          invoice.invoice_date = invoiceDate;
        }
        invoice.items.push({
          product_id: productId,
          qty,
          price,
        });
        invoice.total += qty * price;
      });

      if (unresolvedRows.length) {
        console.error("Sales import unresolved rows:", unresolvedRows);
        const first = unresolvedRows[0];
        toast.error(
          `${unresolvedRows.length} row(s) unresolved. First: row ${first.row} (${first.reason})`,
        );
        return;
      }

      const invoices = Array.from(groupedInvoices.values()).filter(
        (entry) => entry.items.length > 0,
      );

      const duplicateByInvoiceNo = new Map(
        (duplicateInvoices || []).map((item) => [item.invoice_no, item]),
      );
      const newInvoices = [];
      let duplicateUpdatedCount = 0;
      let duplicateSkippedCount = 0;
      const duplicateUpdateFailures = [];

      for (const invoice of invoices) {
        const duplicate = duplicateByInvoiceNo.get(invoice.invoice_no);
        if (!duplicate) {
          newInvoices.push(invoice);
          continue;
        }

        const decision =
          duplicate.status === "unchanged"
            ? "skip"
            : duplicateActions[duplicate.invoice_no];

        if (decision === "update") {
          try {
            await updateExistingInvoiceInSupabase(
              duplicate.existing_invoice_id,
              invoice,
              productIdToName,
            );
            duplicateUpdatedCount += 1;
          } catch (updateError) {
            duplicateUpdateFailures.push({
              invoice_no: invoice.invoice_no || "(blank)",
              message: updateError?.message || "Duplicate update failed",
            });
          }
          continue;
        }

        if (decision !== "skip") {
          toast.error(
            `Action pending for duplicate invoice ${invoice.invoice_no}. Select Update or Skip.`,
          );
          return;
        }

        duplicateSkippedCount += 1;
      }

      if (duplicateUpdatedCount > 0) {
        toast.success(`${duplicateUpdatedCount} duplicate invoice(s) updated`);
      }

      if (duplicateSkippedCount > 0) {
        toast(`${duplicateSkippedCount} duplicate invoice(s) skipped`);
      }

      if (duplicateUpdateFailures.length) {
        console.error("Duplicate invoice update failures:", duplicateUpdateFailures);
        toast.error(
          `${duplicateUpdateFailures.length} duplicate invoice(s) update failed. Check console.`,
        );
      }

      if (!newInvoices.length && (duplicateUpdatedCount > 0 || duplicateSkippedCount > 0)) {
        setDialogOpen(false);
        return;
      }

      if (!newInvoices.length) {
        toast.error("No invoices ready to import");
        return;
      }

      if (duplicateInvoices.length === 0) {
        const endpointImport = await trySalesImportEndpoint(file, cleanedRows, newInvoices);
        if (endpointImport.ok) {
          const importedCount =
            Number(endpointImport.response?.imported_invoices) ||
            Number(endpointImport.response?.imported) ||
            Number(endpointImport.response?.count) ||
            newInvoices.length;
          toast.success(
            `${importedCount} invoice(s) imported successfully via ${endpointImport.path}`,
          );
          setDialogOpen(false);
          return;
        }
      }

      let importedCount = 0;
      const failedInvoices = [];
      let integerFallbackCount = 0;
      let invoiceMirrorCount = 0;
      const invoiceMirrorFailures = [];

      for (const invoice of newInvoices) {
        const payload = {
          customer_id: invoice.customer_id,
          customer_name: invoice.customer_name,
          invoice_no: invoice.invoice_no,
          invoice_date: invoice.invoice_date || null,
          items: invoice.items,
          total: Number(invoice.total.toFixed(2)),
        };

        try {
          const orderResponse = await apiPost("/api/orders", payload);
          const orderId =
            orderResponse?.order_id ||
            orderResponse?.id ||
            orderResponse?.data?.id ||
            null;

          try {
            await persistInvoiceToSupabase(invoice, orderId, productIdToName);
            invoiceMirrorCount += 1;
          } catch (mirrorError) {
            invoiceMirrorFailures.push({
              invoice_no: invoice.invoice_no || "(blank)",
              message: mirrorError?.message || "Invoice mirror failed",
            });
          }

          importedCount += 1;
        } catch (error) {
          const message = String(error?.message || "");
          const isIntegerSyntaxError = message.includes(
            "invalid input syntax for type integer",
          );

          if (isIntegerSyntaxError) {
            try {
              const fallbackPayload = buildIntegerSafeOrderPayload(payload);
              const orderResponse = await apiPost("/api/orders", fallbackPayload);
              const orderId =
                orderResponse?.order_id ||
                orderResponse?.id ||
                orderResponse?.data?.id ||
                null;

              const roundedInvoice = {
                ...invoice,
                items: fallbackPayload.items,
                total: fallbackPayload.total,
              };

              try {
                await persistInvoiceToSupabase(
                  roundedInvoice,
                  orderId,
                  productIdToName,
                );
                invoiceMirrorCount += 1;
              } catch (mirrorError) {
                invoiceMirrorFailures.push({
                  invoice_no: invoice.invoice_no || "(blank)",
                  message: mirrorError?.message || "Invoice mirror failed",
                });
              }

              importedCount += 1;
              integerFallbackCount += 1;
              continue;
            } catch (retryError) {
              failedInvoices.push({
                invoice_no: invoice.invoice_no || "(blank)",
                message: retryError?.message || "Import failed",
              });
              continue;
            }
          }

          failedInvoices.push({
            invoice_no: invoice.invoice_no || "(blank)",
            message: message || "Import failed",
          });
        }
      }

      if (failedInvoices.length) {
        console.error("Sales import failed invoices:", failedInvoices);
        toast.error(
          `${failedInvoices.length} invoice(s) failed. Check console for details.`,
        );
      }

      if (importedCount > 0) {
        toast.success(`${importedCount} invoice(s) imported successfully`);
      }

      if (integerFallbackCount > 0) {
        toast(
          `${integerFallbackCount} invoice(s) imported after rounding decimal qty/price to integers`,
        );
      }

      if (invoiceMirrorCount > 0) {
        toast.success(`${invoiceMirrorCount} invoice(s) mirrored to invoices table`);
      }

      if (invoiceMirrorFailures.length) {
        console.error("Invoice mirror failures:", invoiceMirrorFailures);
        toast.error(
          `${invoiceMirrorFailures.length} invoice(s) not mirrored to invoices table. Check console.`,
        );
      }

      if (importedCount > 0 && failedInvoices.length === 0) {
        setDialogOpen(false);
      }
    } finally {
      setContinueLoading(false);
    }
  }

  function renderReconciliationTable(title, entityType, rows) {
    if (!rows.length) {
      return null;
    }

    return (
      <Box mt={3}>
        <Typography fontWeight={700} mb={1.5}>
          {title}
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Excel Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Matched Name</TableCell>
                <TableCell sx={{ minWidth: 260 }}>Resolve Similar</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((item) => {
                const rowKey = getRowKey(entityType, item.excelName);
                const busy = !!rowLoading[rowKey];
                const unresolvedSimilar = item.status === "similar_match" && !item.resolved;

                return (
                  <TableRow key={rowKey}>
                    <TableCell>{item.excelName}</TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusLabel(item)}
                        color={getStatusColor(item.status)}
                      />
                    </TableCell>

                    <TableCell>
                      {item.match?.name || "-"}
                      {!!item.createError && (
                        <Typography fontSize={12} color="error.main">
                          {item.createError}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      {unresolvedSimilar ? (
                        <Autocomplete
                          size="small"
                          options={getAutocompleteOptions(item)}
                          getOptionLabel={(option) => option?.name || ""}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id && option.optionType === value.optionType
                          }
                          onChange={(_, option) =>
                            handleSuggestionChange(entityType, item, option)
                          }
                          disabled={busy}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Pick suggestion"
                              placeholder="Select existing or create new"
                            />
                          )}
                        />
                      ) : (
                        <Typography color="text.secondary" fontSize={13}>
                          No action needed
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {unresolvedSimilar && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCreateNew(entityType, item)}
                          disabled={busy}
                        >
                          Create New
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  function renderDuplicateInvoiceTable(rows) {
    if (!rows.length) return null;

    return (
      <Box mt={3}>
        <Typography fontWeight={700} mb={1.5}>
          Duplicate Invoice Check
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice No</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Differences</TableCell>
                <TableCell sx={{ minWidth: 170 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((item) => {
                const isChanged = item.status === "changed";
                const action = duplicateActions[item.invoice_no] || "";

                return (
                  <TableRow key={`dup-${item.invoice_no}`}>
                    <TableCell>{item.invoice_no}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={isChanged ? "changed" : "same"}
                        color={isChanged ? "warning" : "success"}
                      />
                    </TableCell>
                    <TableCell>
                      {item.differences?.length
                        ? item.differences.join(" | ")
                        : "No changes"}
                    </TableCell>
                    <TableCell>
                      {isChanged ? (
                        <Select
                          size="small"
                          displayEmpty
                          value={action}
                          onChange={(e) =>
                            setDuplicateActions((prev) => ({
                              ...prev,
                              [item.invoice_no]: e.target.value,
                            }))
                          }
                          fullWidth
                        >
                          <MenuItem value="">Select action</MenuItem>
                          <MenuItem value="update">Update existing invoice</MenuItem>
                          <MenuItem value="skip">Skip this invoice</MenuItem>
                        </Select>
                      ) : (
                        <Typography fontSize={13} color="text.secondary">
                          Skip (already same)
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  const changedDuplicateCount = (duplicateInvoices || []).filter(
    (item) => item.status === "changed",
  ).length;
  const pendingDuplicateChoices = (duplicateInvoices || []).filter(
    (item) =>
      item.status === "changed" &&
      !["update", "skip"].includes(duplicateActions[item.invoice_no]),
  ).length;

  return (
    <Box maxWidth={900} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={3}>
        Sales Import (Step 1 - Analyze)
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
          >
            Select Excel File
            <input
              type="file"
              hidden
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </Button>

          {file && <Typography fontSize={14}>Selected: {file.name}</Typography>}

          {loading && <LinearProgress variant="determinate" value={progress} />}

          <LoadingButton
            variant="contained"
            onClick={handleAnalyze}
            disabled={loading}
            loading={loading}
          >
            Analyze File
          </LoadingButton>
        </Stack>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Analysis & Reconciliation</DialogTitle>

        <DialogContent dividers>
          {analysis && (
            <>
              <Typography>Total Rows: {analysis.total_rows || 0}</Typography>
              <Typography>
                Total Invoices: {analysis.total_invoices || 0}
              </Typography>

              {!!analysis.validation_summary && (
                <Typography mt={1} fontSize={13} color="text.secondary">
                  Non-empty Rows: {analysis.validation_summary.nonEmptyRows} | Ignored
                  Empty Rows: {analysis.validation_summary.ignoredEmptyRows}
                </Typography>
              )}

              <Typography mt={1} fontSize={13} color="text.secondary">
                Cleaned Rows Ready: {analysis.cleaned_rows || 0}
              </Typography>

              {Array.isArray(analysis.validation_errors) &&
                analysis.validation_errors.length > 0 && (
                  <>
                    <Typography mt={3} fontWeight={600} color="error.main">
                      Validation Errors
                    </Typography>
                    <Stack spacing={1} mt={1}>
                      {analysis.validation_errors.map((err, index) => (
                        <Box
                          key={`${err.type || "error"}-${err.row || "na"}-${index}`}
                          sx={{
                            border: "1px solid #fecaca",
                            background: "#fff1f2",
                            borderRadius: 1,
                            p: 1,
                          }}
                        >
                          <Typography fontSize={13} fontWeight={600}>
                            {err.row
                              ? `Row ${err.row}: ${err.message}`
                              : err.message}
                          </Typography>

                          {Array.isArray(err.details) &&
                            err.details.length > 0 && (
                              <Typography fontSize={12} color="text.secondary">
                                {err.details.join(" | ")}
                              </Typography>
                            )}

                          {Array.isArray(err.accepted_headers) &&
                            err.accepted_headers.length > 0 && (
                              <Typography fontSize={12} color="text.secondary">
                                Accepted headers: {" "}
                                {err.accepted_headers.join(", ")}
                              </Typography>
                            )}
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

              {pendingResolutions > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Resolve all similar matches before continuing. Pending: {pendingResolutions}
                </Alert>
              )}

              {changedDuplicateCount > 0 && pendingDuplicateChoices > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Duplicate invoice numbers found with changes. Choose Update or Skip for
                  all ({pendingDuplicateChoices} pending).
                </Alert>
              )}

              {changedDuplicateCount > 0 && pendingDuplicateChoices === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Duplicate invoice actions selected. Continue import to apply updates/skips.
                </Alert>
              )}

              {pendingResolutions === 0 && (analysis.cleaned_rows || 0) > 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  All reconciliation items are resolved.
                </Alert>
              )}

              {renderReconciliationTable(
                "Customer Reconciliation",
                "customers",
                analysis.customers || [],
              )}
              {renderReconciliationTable(
                "Product Reconciliation",
                "products",
                analysis.products || [],
              )}
              {renderDuplicateInvoiceTable(duplicateInvoices)}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <LoadingButton
            variant="contained"
            onClick={handleContinueImport}
            loading={continueLoading}
            disabled={!canContinueImport || continueLoading}
          >
            Continue Import
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
