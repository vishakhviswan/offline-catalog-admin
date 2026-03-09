import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Drawer,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import { supabase } from "../supabaseClient";
import DashboardSection from "../components/salesManComponents/DashboardSection";
import InvoicesSection from "../components/salesManComponents/InvoicesSection";
import SuppliedSection from "../components/salesManComponents/SuppliedSection";
import AssignSection from "../components/salesManComponents/AssignSection";
import SupplySection from "../components/salesManComponents/SupplySection";
import ReportsSection from "../components/salesManComponents/ReportsSection";
import ReturnsSection from "../components/salesManComponents/ReturnsSection";

const STORAGE_KEY = "salesman_state_v1";
const SECTION_FILTER_KEY = "salesman_section_filters_v1";
const SALESMAN_AUTH_KEY = "salesman_auth_v1";
const SALESMAN_SECTION_KEY = "salesman_current_section_v1";
const SALESMAN_USERS = [
  { mobile: "7025813716", password: "1234", name: "Abhijith" },
  { mobile: "9995976563", password: "1234", name: "Vishakh" },
];

const SECTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "invoices", label: "Invoices" },
  { id: "supplied", label: "Supplied Invoices" },
  { id: "assign", label: "Assign Supply Order" },
  { id: "supply", label: "Supply" },
  { id: "reports", label: "Reports" },
  { id: "returns", label: "Sales Return" },
];

const REASONS = ["shop_closed", "customer_rejected", "other"];
const REPORT_DATE_FILTERS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "custom", label: "Custom" },
];
const SECTION_DATE_PRESETS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "custom", label: "Custom" },
];
const PAYMENT_METHOD_COLUMNS = [
  { key: "cash_amount", label: "Cash" },
  { key: "cheque_amount", label: "Cheque" },
  { key: "upi_amount", label: "UPI" },
  { key: "account_transfer_amount", label: "Account Transfer" },
];

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => num(v).toFixed(2);
const dateFmt = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";
const toStartOfDay = (v) => {
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d;
};
const toEndOfDay = (v) => {
  const d = new Date(v);
  d.setHours(23, 59, 59, 999);
  return d;
};
const fromDateInput = (v, end = false) => {
  if (!v) return null;
  const [y, m, d] = String(v)
    .split("-")
    .map((x) => Number(x));
  if (!y || !m || !d) return null;
  return end
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
};
const startOfWeek = (v) => {
  const d = toStartOfDay(v);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
};
const normalizePhone = (v) => String(v || "").replace(/\D/g, "");
const normalizeMobile = (v) => String(v || "").replace(/\D/g, "");

function buildQuoteSet(category, openers, actions, outcomes) {
  const out = [];
  openers.forEach((a) => {
    actions.forEach((b) => {
      outcomes.forEach((c) => {
        out.push({ category, text: `${a} ${b} ${c}` });
      });
    });
  });
  return out;
}

const SALES_QUOTES = buildQuoteSet(
  "sales",
  [
    "വിൽപ്പനയുടെ വഴി വിശ്വാസത്തോടെ തുടങ്ങൂ,",
    "ഗ്രാഹകനെ ആദ്യം മനസ്സിലാക്കൂ,",
    "ഓരോ സന്ദർശനവും ഒരു പുതിയ അവസരമാണ്,",
    "സമയബന്ധിതമായ ഫോളോ-അപ്പ് വിജയത്തെ അടുത്താക്കും,",
  ],
  [
    "സത്യസന്ധമായ നിർദേശങ്ങൾ നൽകി,",
    "ആവശ്യത്തിന് യോജിച്ച ഉൽപ്പന്നം നിർദ്ദേശിച്ച്,",
    "ചിരിയോടെ സംസാരിച്ച് ബന്ധം ശക്തമാക്കി,",
  ],
  [
    "ഇന്നത്തെ ടാർഗറ്റ് നാളെയുടെ റെക്കോർഡാകും.",
    "ചെറിയ ഓർഡറുകൾ വലിയ ബന്ധങ്ങളായി വളരും.",
    "വിശ്വാസം വരുമാനത്തേക്കാൾ വലിയ നിക്ഷേപമാണ്.",
  ],
);

const HARD_WORK_QUOTES = buildQuoteSet(
  "hard_work",
  [
    "കഠിനാധ്വാനം ഒരു ദിവസം പോലും വഞ്ചിക്കില്ല,",
    "ദിവസേന ചെയ്യുന്ന ചെറിയ ശ്രമങ്ങൾ,",
    "ക്രമശീലം ചേർന്ന പരിശ്രമം,",
    "തളർച്ചയെ മറികടക്കുന്ന സ്ഥിരത,",
  ],
  [
    "സമയത്ത് ജോലി പൂർത്തിയാക്കി,",
    "ഓരോ തെറ്റിലും പാഠം കണ്ടെടുത്തു,",
    "ഉത്തരവാദിത്വം മനസ്സോടെ ഏറ്റെടുത്ത്,",
  ],
  [
    "വലിയ വിജയത്തിലേക്ക് വഴികാട്ടും.",
    "മറ്റുള്ളവർക്കും പ്രചോദനമാകും.",
    "നിന്റെ വളർച്ച ഉറപ്പാക്കും.",
  ],
);

const MOTIVATION_QUOTES = buildQuoteSet(
  "motivation",
  [
    "തുടങ്ങാൻ ധൈര്യം മതി,",
    "ഇന്ന് ഒന്നുകിൽ ചെറിയൊരു മുന്നേറ്റം ചെയ്യൂ,",
    "പരാജയം എത്തിയാലും യാത്ര നിർത്തരുത്,",
    "നിന്നെ വിശ്വസിക്കുന്ന മനസ്സ് കൈവിടരുത്,",
  ],
  [
    "സ്വയം ഓരോ ദിവസവും മെച്ചപ്പെടുത്തി,",
    "ലക്ഷ്യം മനസിൽ നിറുത്തി,",
    "നല്ല ചിന്തകളെ പ്രവർത്തിയാക്കി,",
  ],
  [
    "നാളെ നീ ഇന്നത്തേതിനേക്കാൾ ശക്തനായിരിക്കും.",
    "വിജയം നിന്റെ വാതിൽ തേടിയെത്തും.",
    "സ്വപ്നങ്ങൾ യാഥാർത്ഥ്യത്തിലേക്ക് മാറും.",
  ],
);

const WELCOME_QUOTES = [
  ...SALES_QUOTES,
  ...HARD_WORK_QUOTES,
  ...MOTIVATION_QUOTES,
];

function pickIndex(length) {
  return Math.floor(Math.random() * Math.max(1, length));
}

function pickNextQuoteIndex(length, lastIndex) {
  if (length <= 1) return 0;
  if (!Number.isInteger(lastIndex) || lastIndex < 0 || lastIndex >= length) {
    return pickIndex(length);
  }
  const offset = 1 + pickIndex(length - 1);
  return (lastIndex + offset) % length;
}

function loadWelcomeQuoteForSalesman(mobile) {
  const clean = normalizeMobile(mobile);
  if (!clean) return null;
  // const key = `${SALESMAN_WELCOME_QUOTES_KEY}_${clean}`;
  const total = WELCOME_QUOTES.length;
  const fallbackIndex = pickIndex(total);
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    const nextIndex = pickNextQuoteIndex(total, parsed?.lastIndex);
    localStorage.setItem(
      key,
      JSON.stringify({ lastIndex: nextIndex, at: new Date().toISOString() }),
    );
    return {
      index: nextIndex,
      text: WELCOME_QUOTES[nextIndex]?.text || "",
    };
  } catch {
    localStorage.setItem(
      key,
      JSON.stringify({
        lastIndex: fallbackIndex,
        at: new Date().toISOString(),
      }),
    );
    return {
      index: fallbackIndex,
      text: WELCOME_QUOTES[fallbackIndex]?.text || "",
    };
  }
}

function findSalesmanUser(mobile, password) {
  const cleanMobile = normalizeMobile(mobile);
  return SALESMAN_USERS.find(
    (u) =>
      u.mobile === cleanMobile && String(u.password) === String(password || ""),
  );
}

function loadSalesmanSession() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(SALESMAN_AUTH_KEY) || "null",
    );
    const cleanMobile = normalizeMobile(parsed?.mobile);
    if (!cleanMobile) return null;
    const user = SALESMAN_USERS.find((u) => u.mobile === cleanMobile);
    if (!user) return null;
    return { mobile: user.mobile, name: user.name };
  } catch {
    return null;
  }
}

function loadCurrentSection() {
  try {
    const saved = localStorage.getItem(SALESMAN_SECTION_KEY);
    return saved && SECTIONS.some((s) => s.id === saved) ? saved : "dashboard";
  } catch {
    return "dashboard";
  }
}

function saveCurrentSection(section) {
  try {
    localStorage.setItem(SALESMAN_SECTION_KEY, section);
  } catch {
    // Ignore localStorage errors
  }
}

function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      assignments: parsed.assignments || {},
      statuses: parsed.statuses || {},
      payments: parsed.payments || {},
      reasons: parsed.reasons || {},
      returns: parsed.returns || {},
    };
  } catch {
    return {
      assignments: {},
      statuses: {},
      payments: {},
      reasons: {},
      returns: {},
    };
  }
}

function loadSectionFilters() {
  const defaults = {
    invoices: { preset: "all", from: "", to: "" },
    supplied: { preset: "all", from: "", to: "" },
    assign: { preset: "all", from: "", to: "" },
    supply: { date: "" },
    returns: { preset: "all", from: "", to: "" },
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(SECTION_FILTER_KEY) || "{}");
    return {
      invoices: { ...defaults.invoices, ...(parsed.invoices || {}) },
      supplied: { ...defaults.supplied, ...(parsed.supplied || {}) },
      assign: { ...defaults.assign, ...(parsed.assign || {}) },
      supply: { ...defaults.supply, ...(parsed.supply || {}) },
      returns: { ...defaults.returns, ...(parsed.returns || {}) },
    };
  } catch {
    return defaults;
  }
}

function orderInsert(assignments, ids, targetId, targetPos) {
  const sorted = [...ids]
    .sort((a, b) => num(assignments[a], 9999) - num(assignments[b], 9999))
    .filter((id) => id !== targetId);
  const pos = Math.max(0, Math.min(sorted.length, num(targetPos, 1) - 1));
  sorted.splice(pos, 0, targetId);
  const out = {};
  sorted.forEach((id, i) => {
    out[id] = i + 1;
  });
  return out;
}

export default function Salesman() {
  const isMobile = useMediaQuery("(max-width:900px)");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authSession, setAuthSession] = useState(loadSalesmanSession);
  const [authMobile, setAuthMobile] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showWelcomePanel, setShowWelcomePanel] = useState(true);
  const [welcomeQuotes, setWelcomeQuotes] = useState(null);
  const [section, setSection] = useState(() => {
    const session = loadSalesmanSession();
    return session ? loadCurrentSection() : "dashboard";
  });
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [itemsByInvoice, setItemsByInvoice] = useState({});
  const [store, setStore] = useState(loadStore);
  const [sectionFilters, setSectionFilters] = useState(loadSectionFilters);
  const [reportType, setReportType] = useState("sales_collection");
  const [reportDateFilter, setReportDateFilter] = useState("today");
  const [reportSortOrder, setReportSortOrder] = useState("desc");
  const [reportFromDate, setReportFromDate] = useState("");
  const [reportToDate, setReportToDate] = useState("");

  const [payment, setPayment] = useState({
    amount: "",
    method: "cash",
    note: "",
  });
  const [reasonType, setReasonType] = useState("shop_closed");
  const [reasonNote, setReasonNote] = useState("");
  const [reassignNo, setReassignNo] = useState("");
  const [showNotSuppliedReason, setShowNotSuppliedReason] = useState(false);
  const [showSupplyItems, setShowSupplyItems] = useState(false);
  const [assignEditMode, setAssignEditMode] = useState(false);
  const [assignDrafts, setAssignDrafts] = useState({});
  const [supplyShopId, setSupplyShopId] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);
  const [sharePreviewType, setSharePreviewType] = useState("supplied");
  const [sharePreviewEditMode, setSharePreviewEditMode] = useState(false);
  const [sharePreviewMessage, setSharePreviewMessage] = useState("");

  const statusOf = (id) => store.statuses[id] || "pending";
  const orderOf = (id) => num(store.assignments[id], 9999);
  const paymentsOf = (id) => store.payments[id] || [];
  const returnsOf = (id) => store.returns[id] || {};

  useEffect(() => {
    if (authSession) {
      localStorage.setItem(SALESMAN_AUTH_KEY, JSON.stringify(authSession));
    } else {
      localStorage.removeItem(SALESMAN_AUTH_KEY);
    }
  }, [authSession]);

  useEffect(() => {
    if (authSession) {
      saveCurrentSection(section);
    }
  }, [authSession, section]);

  useEffect(() => {
    if (!authSession) {
      setWelcomeQuotes(null);
      return;
    }
    // setShowWelcomePanel(true);
    // setWelcomeQuotes(loadWelcomeQuoteForSalesman(authSession.mobile));
  }, [authSession]);

  const [welcomeCountdown, setWelcomeCountdown] = useState(10);

  useEffect(() => {
    if (welcomeQuotes && showWelcomePanel) {
      setWelcomeCountdown(10);
      const timer = setTimeout(() => {
        setShowWelcomePanel(false);
      }, 10000); // 10 seconds

      const countdownTimer = setInterval(() => {
        setWelcomeCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownTimer);
      };
    }
  }, [welcomeQuotes, showWelcomePanel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    localStorage.setItem(SECTION_FILTER_KEY, JSON.stringify(sectionFilters));
  }, [sectionFilters]);

  async function refreshData() {
    try {
      setLoading(true);
      const { data: invs, error: e1 } = await supabase
        .from("invoices")
        .select("*")
        .order("invoice_date", { ascending: true });
      if (e1) throw e1;
      const invoiceList = Array.isArray(invs) ? invs : [];
      setInvoices(invoiceList);
      const ids = invoiceList.map((x) => x.id);
      if (!ids.length) return;

      const { data: items, error: e2 } = await supabase
        .from("invoice_items")
        .select("*")
        .in("invoice_id", ids);
      if (e2) throw e2;
      const map = {};
      (items || []).forEach((it) => {
        if (!map[it.invoice_id]) map[it.invoice_id] = [];
        map[it.invoice_id].push(it);
      });
      setItemsByInvoice(map);
    } catch (error) {
      toast.error(error?.message || "Salesman load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authSession) return;
    refreshData();
  }, [authSession]);

  useEffect(() => {
    if (!invoices.length) return;
    setStore((prev) => {
      const next = { ...prev.assignments };
      let changed = false;
      const sorted = [...invoices].sort((a, b) =>
        String(a.invoice_no || "").localeCompare(String(b.invoice_no || "")),
      );
      sorted.forEach((inv, idx) => {
        if (next[inv.id] == null) {
          next[inv.id] = idx + 1;
          changed = true;
        }
      });
      return changed ? { ...prev, assignments: next } : prev;
    });
  }, [invoices]);

  const orderedInvoices = [...invoices].sort(
    (a, b) => orderOf(a.id) - orderOf(b.id),
  );
  const invoiceDateTs = (inv) => {
    const rawDate = new Date(inv.invoice_date || inv.created_at || Date.now());
    const localDate = new Date(
      rawDate.getFullYear(),
      rawDate.getMonth(),
      rawDate.getDate(),
    );
    return localDate.getTime();
  };
  const setSectionFilter = (key, patch) => {
    setSectionFilters((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch },
    }));
  };
  const isSectionCustomMissing = (key) => {
    const f = sectionFilters[key] || {};
    return f.preset === "custom" && (!f.from || !f.to);
  };
  const isInvoiceInDateFilter = (key, inv) => {
    const ts = invoiceDateTs(inv);
    if (!Number.isFinite(ts)) return false;
    if (key === "supply") {
      const selected = sectionFilters.supply?.date;
      if (!selected) return true;
      const start = fromDateInput(selected, false);
      const end = fromDateInput(selected, true);
      if (!start || !end) return true;
      const d = new Date(ts);
      return d >= start && d <= end;
    }
    const f = sectionFilters[key] || {};
    if (!f.preset || f.preset === "all") return true;
    if (f.preset === "today") {
      const start = toStartOfDay(new Date());
      const end = toEndOfDay(new Date());
      const d = new Date(ts);
      return d >= start && d <= end;
    }
    if (f.preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const start = toStartOfDay(y);
      const end = toEndOfDay(y);
      const d = new Date(ts);
      return d >= start && d <= end;
    }
    if (f.preset === "this_week") {
      const start = startOfWeek(new Date());
      const end = toEndOfDay(new Date());
      const d = new Date(ts);
      return d >= start && d <= end;
    }
    if (f.preset === "this_month") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = toEndOfDay(now);
      const d = new Date(ts);
      return d >= start && d <= end;
    }
    if (f.preset === "custom") {
      const a = fromDateInput(f.from, false);
      const b = fromDateInput(f.to, true);
      if (!a || !b) return false;
      const start = a <= b ? a : b;
      const end = a <= b ? b : a;
      const d = new Date(ts);
      return d >= start && d <= end;
    }
    return true;
  };

  const filteredInvoices = orderedInvoices.filter((inv) =>
    isInvoiceInDateFilter("invoices", inv),
  );
  const suppliedAll = orderedInvoices.filter(
    (inv) => statusOf(inv.id) === "supplied",
  );
  const filteredSupplied = suppliedAll.filter((inv) =>
    isInvoiceInDateFilter("supplied", inv),
  );
  const filteredAssignInvoices = orderedInvoices.filter((inv) =>
    isInvoiceInDateFilter("assign", inv),
  );
  const pendingAll = orderedInvoices.filter(
    (inv) => statusOf(inv.id) === "pending",
  );
  const pending = pendingAll.filter((inv) =>
    isInvoiceInDateFilter("supply", inv),
  );
  const current =
    pending.find((inv) => inv.id === supplyShopId) || pending[0] || null;
  const currentIndex = current
    ? pending.findIndex((inv) => inv.id === current.id)
    : -1;
  const prevShop = currentIndex > 0 ? pending[currentIndex - 1] : null;
  const nextShop =
    currentIndex >= 0 && currentIndex < pending.length - 1
      ? pending[currentIndex + 1]
      : null;

  useEffect(() => {
    if (!pending.length) {
      setSupplyShopId(null);
      return;
    }
    setSupplyShopId((prev) =>
      pending.some((inv) => inv.id === prev) ? prev : pending[0].id,
    );
  }, [pending]);

  function startAssignEdit() {
    const drafts = {};
    orderedInvoices.forEach((inv) => {
      drafts[inv.id] = orderOf(inv.id);
    });
    setAssignDrafts(drafts);
    setAssignEditMode(true);
  }

  function confirmAssignSheet() {
    if (!assignEditMode) return;
    const sortedIds = [...orderedInvoices]
      .sort((a, b) => {
        const av = num(assignDrafts[a.id], orderOf(a.id));
        const bv = num(assignDrafts[b.id], orderOf(b.id));
        if (av !== bv) return av - bv;
        return orderOf(a.id) - orderOf(b.id);
      })
      .map((inv) => inv.id);
    const assignments = {};
    sortedIds.forEach((id, idx) => {
      assignments[id] = idx + 1;
    });
    setStore((prev) => ({
      ...prev,
      assignments: { ...prev.assignments, ...assignments },
    }));
    setAssignEditMode(false);
    setAssignDrafts({});
    toast.success("Supply order updated");
  }

  useEffect(() => {
    setPayment({ amount: "", method: "cash", note: "" });
    setReasonType("shop_closed");
    setReasonNote("");
    setReassignNo("");
    setShowNotSuppliedReason(false);
    setShowSupplyItems(false);
    setShowPaymentForm(false);
    setSharePreviewOpen(false);
    setSharePreviewType("supplied");
    setSharePreviewEditMode(false);
    setSharePreviewMessage("");
  }, [current?.id]);

  function calc(inv) {
    const items = itemsByInvoice[inv.id] || [];
    const returns = returnsOf(inv.id);
    const invoiceAmount =
      num(inv.total_amount) ||
      items.reduce((s, it) => s + num(it.qty) * num(it.price), 0);
    const returnAmount = items.reduce((s, it) => {
      const r = returns[it.id];
      if (!r) return s;
      const orig = num(it.qty);
      const q = r.removed ? 0 : Math.max(0, num(r.qty, orig));
      return s + Math.max(0, orig - q) * num(it.price);
    }, 0);
    const received = paymentsOf(inv.id).reduce((s, p) => s + num(p.amount), 0);
    const balance = Math.max(0, invoiceAmount - returnAmount - received);
    const methods = [...new Set(paymentsOf(inv.id).map((p) => p.method))].join(
      ", ",
    );
    return { invoiceAmount, returnAmount, received, balance, methods };
  }

  function addPayment(invoiceId) {
    const amount = num(payment.amount);
    if (amount <= 0) return toast.error("Enter amount");
    setStore((prev) => ({
      ...prev,
      payments: {
        ...prev.payments,
        [invoiceId]: [
          ...(prev.payments[invoiceId] || []),
          {
            id: `${Date.now()}-${Math.random()}`,
            amount,
            method: payment.method,
            note: payment.note,
            at: new Date().toISOString(),
          },
        ],
      },
    }));
    setPayment((p) => ({ ...p, amount: "", note: "" }));
  }

  function sendWhatsapp(inv, forcedStatus, overrideMessage = "") {
    const f = calc(inv);
    const status = forcedStatus || statusOf(inv.id);
    const msg =
      overrideMessage ||
      [
        `Shop: ${inv.customer_name || "-"}`,
        `Invoice No: ${inv.invoice_no || "-"}`,
        `Invoice Amount: ${money(f.invoiceAmount)}`,
        `Collected Amount: ${money(f.received)}`,
        `Payment: ${f.methods || "-"}`,
        `Status: ${status}`,
      ].join("\n");
    const phone = normalizePhone(WA_TARGET);
    if (!phone) {
      toast.error("Invalid WhatsApp number");
      return;
    }
    const text = encodeURIComponent(msg);
    const primaryUrl = `https://wa.me/${phone}?text=${text}`;
    const fallbackUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
    const popup = window.open(primaryUrl, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = fallbackUrl;
  }

  function getPaymentBreakdown(inv) {
    const label = {
      cash: "Cash",
      cheque: "Cheque",
      upi: "Google Pay",
      account_transfer: "Account Transfer",
      credit_sales: "Credit Sales",
    };
    const grouped = {};
    paymentsOf(inv.id).forEach((p) => {
      const key = String(p.method || "cash");
      grouped[key] = (grouped[key] || 0) + num(p.amount);
    });
    const parts = Object.entries(grouped)
      .filter(([, amount]) => num(amount) > 0)
      .map(
        ([method, amount]) =>
          `Rs ${money(amount)} by ${label[method] || method}`,
      );
    return parts.length ? parts.join(", ") : "Rs 0";
  }

  function getReturnLines(inv) {
    return getReturnItemDetails(inv).map(
      (it) => `${it.name} - Qty ${it.qty} - Rate ${money(it.rate)}`,
    );
  }

  function getReturnItemDetails(inv) {
    const items = itemsByInvoice[inv.id] || [];
    const returns = returnsOf(inv.id);
    return items
      .map((it) => {
        const r = returns[it.id];
        if (!r) return null;
        const orig = num(it.qty);
        const adj = r.removed ? 0 : Math.max(0, num(r.qty, orig));
        const returnedQty = Math.max(0, orig - adj);
        if (returnedQty <= 0) return null;
        return {
          itemId: it.id,
          sourceInvoiceId: inv.id,
          name: it.product_name || "-",
          qty: returnedQty,
          rate: num(it.price),
          maxQty: orig,
        };
      })
      .filter(Boolean);
  }

  function confirmReturn(inv) {
    const lines = getReturnLines(inv);
    if (!lines.length) {
      toast.error("No return items added");
      return;
    }
    toast.success("Return confirmed");
  }

  function shareReturn(inv) {
    const f = calc(inv);
    const lines = getReturnLines(inv);
    if (!lines.length) {
      toast.error("No return items to share");
      return;
    }
    const msg = [
      "Sales Return",
      `Shop: ${inv.customer_name || "-"}`,
      `Invoice No: ${inv.invoice_no || "-"}`,
      `Return Amount: ${money(f.returnAmount)}`,
      "Items:",
      ...lines,
    ].join("\n");
    const phone = normalizePhone(WA_TARGET);
    if (!phone) {
      toast.error("Invalid WhatsApp number");
      return;
    }
    const text = encodeURIComponent(msg);
    const primaryUrl = `https://wa.me/${phone}?text=${text}`;
    const fallbackUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
    const popup = window.open(primaryUrl, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = fallbackUrl;
  }

  function markSuppliedAndShare() {
    if (!current) return;
    const nextName = nextShop?.customer_name || "No next supply";
    const baseMessage = `You successfully supplied ${current.customer_name || "-"} and collected ${getPaymentBreakdown(current)}.\nNext supply: ${nextName}.`;
    setSharePreviewType("supplied");
    setSharePreviewMessage(baseMessage);
    setSharePreviewEditMode(false);
    setSharePreviewOpen(true);
  }

  function openNotSuppliedPreview() {
    if (!current) return;
    const reasonText = String(reasonType || "-").replace(/_/g, " ");
    const noteText = reasonNote?.trim() ? reasonNote.trim() : "-";
    const nextName = nextShop?.customer_name || "No next supply";
    const baseMessage = [
      `${current.customer_name || "-"} marked as NOT SUPPLIED.`,
      `Reason: ${reasonText}`,
      `Note: ${noteText}`,
      `Next supply: ${nextName}.`,
    ].join("\n");
    setSharePreviewType("not_supplied");
    setSharePreviewMessage(baseMessage);
    setSharePreviewEditMode(false);
    setSharePreviewOpen(true);
  }

  function confirmSharePreview() {
    if (!current) return;
    if (sharePreviewType === "not_supplied") {
      setStore((prev) => ({
        ...prev,
        statuses: { ...prev.statuses, [current.id]: "not_supplied" },
        reasons: {
          ...prev.reasons,
          [current.id]: { reason: reasonType, note: reasonNote },
        },
      }));
      sendWhatsapp(current, "not_supplied", sharePreviewMessage);
      toast.success("Marked not supplied and shared");
      setShowNotSuppliedReason(false);
    } else {
      setStore((prev) => ({
        ...prev,
        statuses: { ...prev.statuses, [current.id]: "supplied" },
      }));
      sendWhatsapp(current, "supplied", sharePreviewMessage);
      toast.success("Marked supplied and shared");
    }
    setSharePreviewOpen(false);
    setSharePreviewType("supplied");
    setSharePreviewEditMode(false);
    if (nextShop) setSupplyShopId(nextShop.id);
    else if (prevShop) setSupplyShopId(prevShop.id);
  }

  const returnRows = orderedInvoices
    .map((inv) => ({
      inv,
      amt: calc(inv).returnAmount,
      items: getReturnItemDetails(inv),
    }))
    .filter((r) => r.amt > 0);
  const filteredReturnRows = returnRows.filter((r) =>
    isInvoiceInDateFilter("returns", r.inv),
  );

  function printReport({ title, rows, columns, landscape = false }) {
    const esc = (v) =>
      String(v ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const tr = rows
      .map(
        (r) =>
          `<tr>${columns
            .map(
              (c) =>
                `<td style="padding:6px;border:1px solid #d1d5db;text-align:${c.align || "left"}">${esc(r[c.key])}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");
    const html = `<html><head><style>
      @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 10mm; }
      body { font-family: Arial, sans-serif; color: #111827; }
      h3 { margin: 0 0 10px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f3f4f6; text-align: left; border: 1px solid #d1d5db; padding: 6px; }
    </style></head><body><h3>${esc(title)}</h3><table><tr>${columns.map((c) => `<th style="text-align:${c.align || "left"}">${esc(c.label)}</th>`).join("")}</tr>${tr}</table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  const sideMenu = (
    <Box sx={{ width: 250, p: 1.5 }}>
      <Typography fontWeight={800} mb={1.2} fontSize={18}>
        Salesman
      </Typography>
      <Stack spacing={0.8}>
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            variant={section === s.id ? "contained" : "text"}
            onClick={() => {
              setSection(s.id);
              setSidebarOpen(false);
            }}
            sx={{
              justifyContent: "flex-start",
              borderRadius: 2,
              py: 1,
              fontWeight: section === s.id ? 700 : 500,
            }}
          >
            {s.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );

  const salesRows = orderedInvoices.map((inv) => {
    const f = calc(inv);
    const rawDate = new Date(inv.invoice_date || inv.created_at || Date.now());
    const localDate = new Date(
      rawDate.getFullYear(),
      rawDate.getMonth(),
      rawDate.getDate(),
    );
    const dateTs = localDate.getTime();
    return {
      date: dateFmt(rawDate),
      date_ts: Number.isFinite(dateTs) ? dateTs : NaN,
      invoice_no: inv.invoice_no || "-",
      customer_name: inv.customer_name || "-",
      invoice_amount: f.invoiceAmount,
      return_amount: f.returnAmount,
      balance: f.balance,
      received_amount: f.received,
      payment_method: f.methods,
      balance_credit: f.balance,
    };
  });

  const paymentRows = orderedInvoices.flatMap((inv) =>
    paymentsOf(inv.id).map((p) => {
      const rawDate = new Date(
        p.at || inv.invoice_date || inv.created_at || Date.now(),
      );
      const localDate = new Date(
        rawDate.getFullYear(),
        rawDate.getMonth(),
        rawDate.getDate(),
      );
      const dateTs = localDate.getTime();
      const amount = num(p.amount);
      const method = String(p.method || "").toLowerCase();
      return {
        date: dateFmt(rawDate),
        date_ts: Number.isFinite(dateTs) ? dateTs : NaN,
        invoice_no: inv.invoice_no || "-",
        customer_name: inv.customer_name || "-",
        amount,
        method: p.method,
        note: p.note,
        cash_amount: method === "cash" ? amount : 0,
        cheque_amount: method === "cheque" ? amount : 0,
        upi_amount: method === "upi" ? amount : 0,
        account_transfer_amount: method === "account_transfer" ? amount : 0,
      };
    }),
  );
  const salesReturnRows = orderedInvoices
    .map((inv) => {
      const f = calc(inv);
      if (f.returnAmount <= 0) return null;
      const rawDate = new Date(
        inv.invoice_date || inv.created_at || Date.now(),
      );
      const localDate = new Date(
        rawDate.getFullYear(),
        rawDate.getMonth(),
        rawDate.getDate(),
      );
      const dateTs = localDate.getTime();
      return {
        date: dateFmt(localDate),
        date_ts: Number.isFinite(dateTs) ? dateTs : NaN,
        invoice_no: inv.invoice_no || "-",
        customer_name: inv.customer_name || "-",
        items: getReturnLines(inv).join(", ") || "-",
        return_amount: f.returnAmount,
      };
    })
    .filter(Boolean);
  const now = new Date();
  const reportCustomMissing =
    reportDateFilter === "custom" && (!reportFromDate || !reportToDate);
  let reportStart = null;
  let reportEnd = null;
  if (reportDateFilter === "today") {
    reportStart = toStartOfDay(now);
    reportEnd = toEndOfDay(now);
  } else if (reportDateFilter === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    reportStart = toStartOfDay(y);
    reportEnd = toEndOfDay(y);
  } else if (reportDateFilter === "this_week") {
    reportStart = startOfWeek(now);
    reportEnd = toEndOfDay(now);
  } else if (reportDateFilter === "this_month") {
    reportStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    reportEnd = toEndOfDay(now);
  } else if (reportDateFilter === "custom" && !reportCustomMissing) {
    const a = fromDateInput(reportFromDate, false);
    const b = fromDateInput(reportToDate, true);
    if (a && b) {
      reportStart = a <= b ? a : b;
      reportEnd = a <= b ? b : a;
    }
  }
  const inReportRange = (dateTs) => {
    if (reportCustomMissing) return false;
    if (!Number.isFinite(dateTs)) return false;
    const d = new Date(dateTs);
    if (reportStart && d < reportStart) return false;
    if (reportEnd && d > reportEnd) return false;
    return true;
  };
  const sortDir = reportSortOrder === "asc" ? 1 : -1;
  const reportSalesRows = [...salesRows]
    .filter((r) => inReportRange(r.date_ts))
    .sort((a, b) => (a.date_ts - b.date_ts) * sortDir);
  const reportPaymentRows = [...paymentRows]
    .filter((r) => inReportRange(r.date_ts))
    .sort((a, b) => (a.date_ts - b.date_ts) * sortDir);
  const reportSalesReturnRows = [...salesReturnRows]
    .filter((r) => inReportRange(r.date_ts))
    .sort((a, b) => (a.date_ts - b.date_ts) * sortDir);
  const reportSalesTotals = reportSalesRows.reduce(
    (acc, r) => ({
      invoice: acc.invoice + num(r.invoice_amount),
      returned: acc.returned + num(r.return_amount),
      received: acc.received + num(r.received_amount),
      balance: acc.balance + num(r.balance),
    }),
    { invoice: 0, returned: 0, received: 0, balance: 0 },
  );
  const reportPaymentTotals = reportPaymentRows.reduce(
    (acc, r) => ({
      total: acc.total + num(r.amount),
      cash: acc.cash + num(r.cash_amount),
      cheque: acc.cheque + num(r.cheque_amount),
      upi: acc.upi + num(r.upi_amount),
      accountTransfer: acc.accountTransfer + num(r.account_transfer_amount),
    }),
    { total: 0, cash: 0, cheque: 0, upi: 0, accountTransfer: 0 },
  );
  const reportSalesReturnTotal = reportSalesReturnRows.reduce(
    (s, r) => s + num(r.return_amount),
    0,
  );
  const reportFilterLabel =
    REPORT_DATE_FILTERS.find((x) => x.id === reportDateFilter)?.label ||
    "Today";
  const isPaymentReport = reportType === "payment";
  const isSalesOnlyReport = reportType === "sales";
  const isSalesReturnReport = reportType === "sales_return";
  const invoiceCount = filteredInvoices.length;
  const totalSalesAmount = filteredInvoices.reduce(
    (sum, inv) => sum + calc(inv).invoiceAmount,
    0,
  );
  const currentMetrics = current ? calc(current) : null;
  const supplyProgress =
    currentIndex >= 0 && pending.length
      ? ((currentIndex + 1) / pending.length) * 100
      : 0;
  const latestPayments = current
    ? [...paymentsOf(current.id)].slice(-3).reverse()
    : [];
  const dashboardMetrics = {
    invoiceCount: orderedInvoices.length,
    suppliedCount: suppliedAll.length,
    pendingCount: pendingAll.length,
    salesAmount: orderedInvoices.reduce(
      (s, inv) => s + calc(inv).invoiceAmount,
      0,
    ),
    collectedAmount: orderedInvoices.reduce(
      (s, inv) => s + calc(inv).received,
      0,
    ),
    balanceAmount: orderedInvoices.reduce((s, inv) => s + calc(inv).balance, 0),
  };

  const handleShareReportViaWhatsapp = () => {
    if (reportCustomMissing) {
      toast.error("Select custom from and to dates");
      return;
    }

    // First download the PDF
    handleDownloadReport();

    // Then open WhatsApp with summary
    const reportTitle = isPaymentReport
      ? `Payment Report (${reportFilterLabel})`
      : isSalesReturnReport
        ? `Sales Return Report (${reportFilterLabel})`
        : reportType === "sales"
          ? `Sales Report (${reportFilterLabel})`
          : `Sales & Collection Report (${reportFilterLabel})`;

    const summaryText = isPaymentReport
      ? `📊 *${reportTitle}*\n\n📈 Summary:\n• Total Rows: ${reportPaymentRows.length}\n• Total Amount: ₹${money(reportPaymentTotals.total)}\n• Cash: ₹${money(reportPaymentTotals.cash)}\n• Cheque: ₹${money(reportPaymentTotals.cheque)}\n• UPI: ₹${money(reportPaymentTotals.upi)}\n• Account Transfer: ₹${money(reportPaymentTotals.accountTransfer)}\n\n📄 PDF report downloaded. Please attach it to this message.`
      : isSalesReturnReport
        ? `📊 *${reportTitle}*\n\n📈 Summary:\n• Total Rows: ${reportSalesReturnRows.length}\n• Return Total: ₹${money(reportSalesReturnTotal)}\n\n📄 PDF report downloaded. Please attach it to this message.`
        : `📊 *${reportTitle}*\n\n📈 Summary:\n• Total Rows: ${reportSalesRows.length}\n• Invoice Amount: ₹${money(reportSalesTotals.invoice)}\n• Return Amount: ₹${money(reportSalesTotals.returned)}\n• Collected Amount: ₹${money(reportSalesTotals.received)}\n• Balance Amount: ₹${money(reportSalesTotals.balance)}\n\n📄 PDF report downloaded. Please attach it to this message.`;

    const phone = normalizePhone(WA_TARGET);
    if (!phone) {
      toast.error("Invalid WhatsApp number");
      return;
    }
    const text = encodeURIComponent(summaryText);
    const primaryUrl = `https://wa.me/${phone}?text=${text}`;
    const fallbackUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
    const popup = window.open(primaryUrl, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = fallbackUrl;
    toast.success(
      "PDF downloaded and WhatsApp opened - please attach the PDF to your message",
    );
  };

  const handleDownloadReport = () => {
    if (reportCustomMissing) {
      toast.error("Select custom from and to dates");
      return;
    }

    if (isPaymentReport) {
      printReport({
        title: `Payment Report (${reportFilterLabel})`,
        landscape: false,
        columns: [
          { key: "date", label: "Date" },
          { key: "invoice_no", label: "Invoice No" },
          { key: "customer_name", label: "Customer" },
          ...PAYMENT_METHOD_COLUMNS.map((m) => ({
            key: m.key,
            label: m.label,
            align: "right",
          })),
          { key: "total_amount", label: "Total", align: "right" },
          { key: "note", label: "Note" },
        ],
        rows: reportPaymentRows.map((r) => ({
          date: r.date,
          invoice_no: r.invoice_no,
          customer_name: r.customer_name,
          cash_amount: money(r.cash_amount),
          cheque_amount: money(r.cheque_amount),
          upi_amount: money(r.upi_amount),
          account_transfer_amount: money(r.account_transfer_amount),
          total_amount: money(r.amount),
          note: r.note || "-",
        })),
      });
      return;
    }

    if (isSalesReturnReport) {
      printReport({
        title: `Sales Return Report (${reportFilterLabel})`,
        landscape: false,
        columns: [
          { key: "date", label: "Date" },
          { key: "invoice_no", label: "Invoice No" },
          { key: "customer_name", label: "Customer" },
          { key: "items", label: "Items" },
          { key: "return_amount", label: "Return Amount", align: "right" },
        ],
        rows: reportSalesReturnRows.map((r) => ({
          date: r.date,
          invoice_no: r.invoice_no,
          customer_name: r.customer_name,
          items: r.items,
          return_amount: money(r.return_amount),
        })),
      });
      return;
    }

    printReport({
      title:
        reportType === "sales"
          ? `Sales Report (${reportFilterLabel})`
          : `Sales & Collection Report (${reportFilterLabel})`,
      landscape: reportType === "sales_collection",
      columns:
        reportType === "sales"
          ? [
              { key: "date", label: "Date" },
              { key: "invoice_no", label: "Invoice No" },
              { key: "customer_name", label: "Customer" },
              { key: "invoice_amount", label: "Invoice", align: "right" },
              { key: "return_amount", label: "Return", align: "right" },
              { key: "balance", label: "Balance", align: "right" },
            ]
          : [
              { key: "date", label: "Date" },
              { key: "invoice_no", label: "Invoice No" },
              { key: "customer_name", label: "Customer" },
              { key: "invoice_amount", label: "Invoice", align: "right" },
              { key: "return_amount", label: "Return", align: "right" },
              { key: "received_amount", label: "Collected", align: "right" },
              { key: "balance", label: "Balance", align: "right" },
              { key: "payment_method", label: "Payment Method" },
            ],
      rows: reportSalesRows.map((r) => ({
        date: r.date,
        invoice_no: r.invoice_no,
        customer_name: r.customer_name,
        invoice_amount: money(r.invoice_amount),
        return_amount: money(r.return_amount),
        received_amount: money(r.received_amount),
        balance: money(r.balance),
        payment_method: r.payment_method || "-",
      })),
    });
  };

  function handleSalesmanLogin(e) {
    e?.preventDefault?.();
    const user = findSalesmanUser(authMobile, authPassword);
    if (!user) {
      toast.error("Invalid mobile number or password");
      return;
    }
    setAuthSession({ mobile: user.mobile, name: user.name });
    setAuthPassword("");
    setSection("dashboard");
    toast.success(`Welcome ${user.name}`);
  }

  function handleSalesmanLogout() {
    setAuthSession(null);
    setAuthMobile("");
    setAuthPassword("");
    setSidebarOpen(false);
    setShowWelcomePanel(true);
    setWelcomeQuotes(null);
    try {
      localStorage.removeItem(SALESMAN_SECTION_KEY);
    } catch {
      // Ignore localStorage errors
    }
    toast.success("Logged out");
  }

  if (!authSession) {
    return (
      <Box maxWidth={480} mx="auto" sx={{ p: { xs: 1.2, md: 2.5 }, pb: 4 }}>
        <Card
          sx={{
            p: { xs: 1.4, md: 2 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(120deg, #f8fafc 0%, #e0f2fe 55%, #dbeafe 100%)",
          }}
        >
          <Typography fontWeight={800} fontSize={{ xs: 20, md: 22 }} mb={0.4}>
            Salesman Login
          </Typography>
          <Typography color="text.secondary" fontSize={13} mb={1.5}>
            Mobile number and password use cheythu login cheyyuka
          </Typography>
          <Stack component="form" spacing={1.2} onSubmit={handleSalesmanLogin}>
            <TextField
              size="small"
              label="Mobile Number"
              value={authMobile}
              onChange={(e) => setAuthMobile(normalizeMobile(e.target.value))}
              inputProps={{
                maxLength: 10,
                inputMode: "numeric",
                pattern: "[0-9]*",
              }}
            />
            <TextField
              size="small"
              type="password"
              label="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
            <Button type="submit" variant="contained">
              Login
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  if (showWelcomePanel && welcomeQuotes) {
    return (
      <Box maxWidth={900} mx="auto" sx={{ p: { xs: 1.2, md: 2.5 }, pb: 4 }}>
        <Card
          sx={{
            p: { xs: 1.4, md: 2 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(120deg, #f8fafc 0%, #ecfeff 50%, #dbeafe 100%)",
          }}
        >
          <Typography fontWeight={900} fontSize={{ xs: 21, md: 26 }} mb={0.4}>
            Welcome {authSession.name}
          </Typography>
          <Typography color="text.secondary" fontSize={13} mb={1.4}>
            Refresh cheyyumbol puthiya quote kaanum • Auto-close in{" "}
            {welcomeCountdown}s
          </Typography>

          <Card
            variant="outlined"
            sx={{
              p: { xs: 1.2, md: 1.5 },
              borderRadius: 2.2,
              borderColor: "primary.100",
              background: "#ffffffcc",
            }}
          >
            <Typography fontSize={16} lineHeight={1.7}>
              {welcomeQuotes?.text || "-"}
            </Typography>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1.5}>
            <Button
              variant="contained"
              onClick={() => {
                setShowWelcomePanel(false);
              }}
            >
              Continue to{" "}
              {SECTIONS.find((s) => s.id === section)?.label || "Dashboard"}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleSalesmanLogout}
            >
              Logout
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box maxWidth={1600} mx="auto" sx={{ p: { xs: 1.25, md: 2.5 }, pb: 4 }}>
      <Card
        sx={{
          mb: 2,
          p: { xs: 1.25, md: 2 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(120deg, #f8fafc 0%, #e0f2fe 52%, #dbeafe 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          alignItems={{ md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography fontWeight={800} fontSize={{ xs: 18, md: 21 }}>
              Salesman Supply Panel
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              Welcome, {authSession.name} | Section:{" "}
              {SECTIONS.find((s) => s.id === section)?.label}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<MenuIcon />}
                onClick={() => setSidebarOpen(true)}
              >
                Menu
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleSalesmanLogout}
            >
              Logout
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        alignItems="flex-start"
      >
        {!isMobile && (
          <Card
            sx={{ width: 250, borderRadius: 3, position: "sticky", top: 16 }}
          >
            {sideMenu}
          </Card>
        )}
        <Box flex={1} minWidth={0}>
          {loading ? (
            <Card sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography>Loading data...</Typography>
            </Card>
          ) : section === "dashboard" ? (
            <DashboardSection
              metrics={dashboardMetrics}
              quickFilters={SECTION_DATE_PRESETS}
              onOpenSection={setSection}
            />
          ) : section === "invoices" ? (
            <InvoicesSection
              sectionDatePresets={SECTION_DATE_PRESETS}
              filter={sectionFilters.invoices}
              showCustomWarning={isSectionCustomMissing("invoices")}
              onChangePreset={(preset) =>
                setSectionFilter("invoices", {
                  preset,
                  ...(preset !== "custom" ? { from: "", to: "" } : {}),
                })
              }
              onChangeFrom={(from) => setSectionFilter("invoices", { from })}
              onChangeTo={(to) => setSectionFilter("invoices", { to })}
              invoiceCount={invoiceCount}
              totalSalesAmount={totalSalesAmount}
              pendingCount={pendingAll.length}
              rows={filteredInvoices}
              orderOf={orderOf}
              statusOf={statusOf}
            />
          ) : section === "supplied" ? (
            <SuppliedSection
              sectionDatePresets={SECTION_DATE_PRESETS}
              filter={sectionFilters.supplied}
              showCustomWarning={isSectionCustomMissing("supplied")}
              onChangePreset={(preset) =>
                setSectionFilter("supplied", {
                  preset,
                  ...(preset !== "custom" ? { from: "", to: "" } : {}),
                })
              }
              onChangeFrom={(from) => setSectionFilter("supplied", { from })}
              onChangeTo={(to) => setSectionFilter("supplied", { to })}
              rows={filteredSupplied}
              orderOf={orderOf}
              statusOf={statusOf}
            />
          ) : section === "assign" ? (
            <AssignSection
              isMobile={isMobile}
              sectionDatePresets={SECTION_DATE_PRESETS}
              filter={sectionFilters.assign}
              showCustomWarning={isSectionCustomMissing("assign")}
              onChangePreset={(preset) =>
                setSectionFilter("assign", {
                  preset,
                  ...(preset !== "custom" ? { from: "", to: "" } : {}),
                })
              }
              onChangeFrom={(from) => setSectionFilter("assign", { from })}
              onChangeTo={(to) => setSectionFilter("assign", { to })}
              assignEditMode={assignEditMode}
              rows={filteredAssignInvoices}
              orderOf={orderOf}
              statusOf={statusOf}
              assignDrafts={assignDrafts}
              onStartEdit={startAssignEdit}
              onConfirmEdit={confirmAssignSheet}
              onChangeAssignDraft={(id, value) =>
                setAssignDrafts((prev) => ({ ...prev, [id]: value }))
              }
            />
          ) : section === "supply" ? (
            <SupplySection
              isMobile={isMobile}
              supplyDate={sectionFilters.supply?.date || ""}
              onChangeSupplyDate={(date) =>
                setSectionFilter("supply", { date })
              }
              onClearSupplyDate={() => setSectionFilter("supply", { date: "" })}
              current={current}
              currentMetrics={currentMetrics}
              orderOf={orderOf}
              currentIndex={currentIndex}
              pendingCount={pending.length}
              supplyProgress={supplyProgress}
              prevShop={prevShop}
              nextShop={nextShop}
              onGoPrev={() => prevShop && setSupplyShopId(prevShop.id)}
              onGoNext={() => nextShop && setSupplyShopId(nextShop.id)}
              showSupplyItems={showSupplyItems}
              onToggleSupplyItems={() => setShowSupplyItems((v) => !v)}
              itemsByInvoice={itemsByInvoice}
              returnsOf={returnsOf}
              onToggleReturnItem={(invoiceId, it) => {
                const existing = returnsOf(invoiceId)[it.id];
                setStore((prev) => {
                  const c = { ...(prev.returns[invoiceId] || {}) };
                  if (existing) delete c[it.id];
                  else c[it.id] = { qty: num(it.qty), removed: false };
                  return {
                    ...prev,
                    returns: { ...prev.returns, [invoiceId]: c },
                  };
                });
              }}
              onChangeReturnQty={(invoiceId, itemId, value) =>
                setStore((prev) => ({
                  ...prev,
                  returns: {
                    ...prev.returns,
                    [invoiceId]: {
                      ...(prev.returns[invoiceId] || {}),
                      [itemId]: {
                        ...(prev.returns[invoiceId] || {})[itemId],
                        qty: num(value),
                      },
                    },
                  },
                }))
              }
              onConfirmReturn={() => current && confirmReturn(current)}
              onShareReturn={() => current && shareReturn(current)}
              showPaymentForm={showPaymentForm}
              onTogglePaymentForm={() => setShowPaymentForm((v) => !v)}
              payment={payment}
              onSetPayment={setPayment}
              onAddPayment={() => current && addPayment(current.id)}
              latestPayments={latestPayments}
              onMarkSuppliedAndShare={markSuppliedAndShare}
              sharePreviewOpen={sharePreviewOpen}
              sharePreviewType={sharePreviewType}
              sharePreviewEditMode={sharePreviewEditMode}
              sharePreviewMessage={sharePreviewMessage}
              onEditSharePreview={() => setSharePreviewEditMode((v) => !v)}
              onChangeSharePreviewMessage={setSharePreviewMessage}
              onConfirmSharePreview={confirmSharePreview}
              onCancelSharePreview={() => {
                setSharePreviewOpen(false);
                setSharePreviewType("supplied");
                setSharePreviewEditMode(false);
              }}
              onToggleNotSupplied={() => setShowNotSuppliedReason((v) => !v)}
              showNotSuppliedReason={showNotSuppliedReason}
              reasonType={reasonType}
              onSetReasonType={setReasonType}
              reasonNote={reasonNote}
              onSetReasonNote={setReasonNote}
              onConfirmNotSupplied={openNotSuppliedPreview}
              reassignNo={reassignNo}
              onSetReassignNo={setReassignNo}
              onReassign={() => {
                if (!current) return;
                setStore((prev) => ({
                  ...prev,
                  assignments: orderInsert(
                    prev.assignments,
                    orderedInvoices.map((x) => x.id),
                    current.id,
                    reassignNo,
                  ),
                  statuses: { ...prev.statuses, [current.id]: "pending" },
                }));
                toast.success("Reassigned");
              }}
              reasonOptions={REASONS}
            />
          ) : section === "reports" ? (
            <ReportsSection
              isMobile={isMobile}
              reportType={reportType}
              setReportType={setReportType}
              reportDateFilter={reportDateFilter}
              setReportDateFilter={setReportDateFilter}
              reportSortOrder={reportSortOrder}
              setReportSortOrder={setReportSortOrder}
              reportFromDate={reportFromDate}
              setReportFromDate={setReportFromDate}
              reportToDate={reportToDate}
              setReportToDate={setReportToDate}
              reportDateFilters={REPORT_DATE_FILTERS}
              reportFilterLabel={reportFilterLabel}
              reportCustomMissing={reportCustomMissing}
              isPaymentReport={isPaymentReport}
              isSalesOnlyReport={isSalesOnlyReport}
              isSalesReturnReport={isSalesReturnReport}
              reportSalesRows={reportSalesRows}
              reportPaymentRows={reportPaymentRows}
              reportSalesReturnRows={reportSalesReturnRows}
              reportSalesTotals={reportSalesTotals}
              reportPaymentTotals={reportPaymentTotals}
              reportSalesReturnTotal={reportSalesReturnTotal}
              onDownloadPdf={handleDownloadReport}
              onShareWhatsapp={handleShareReportViaWhatsapp}
            />
          ) : (
            <ReturnsSection
              isMobile={isMobile}
              sectionDatePresets={SECTION_DATE_PRESETS}
              filter={sectionFilters.returns}
              showCustomWarning={isSectionCustomMissing("returns")}
              onChangePreset={(preset) =>
                setSectionFilter("returns", {
                  preset,
                  ...(preset !== "custom" ? { from: "", to: "" } : {}),
                })
              }
              onChangeFrom={(from) => setSectionFilter("returns", { from })}
              onChangeTo={(to) => setSectionFilter("returns", { to })}
              rows={filteredReturnRows}
              orderedInvoices={orderedInvoices}
              invoiceItemsByInvoice={itemsByInvoice}
              waTarget={WA_TARGET}
            />
          )}
        </Box>
      </Stack>

      {isMobile && (
        <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          {sideMenu}
        </Drawer>
      )}
    </Box>
  );
}
