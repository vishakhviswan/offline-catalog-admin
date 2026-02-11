import { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  Divider,
  IconButton,
  Grid,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import toast from "react-hot-toast";
import { apiGet, apiPut } from "../api/api";

/* ================= UNIT PRESETS ================= */
const UNIT_PRESETS = [
  { name: "pcs", multiplier: 1 },
  { name: "kg", multiplier: 1 },
  { name: "liter", multiplier: 1 },
  { name: "dozen", multiplier: 12 },
  { name: "box", multiplier: 1 },
];

export default function BulkEditEditor({
  open,
  productIds = [],
  fields = [],
  categories = [],
  vendors = [],
  onClose,
  onUpdated,
}) {
  const [products, setProducts] = useState([]);
  const [changed, setChanged] = useState({});
  const [loading, setLoading] = useState(false);

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!open || productIds.length === 0) return;

    async function load() {
      try {
        const all = await apiGet("/api/products");
        const selected = all.filter((p) => productIds.includes(p.id));
        setProducts(selected);
      } catch {
        toast.error("Failed to load products");
      }
    }

    load();
  }, [open, productIds]);

  /* ================= UPDATE FIELD ================= */
  function updateField(id, key, value) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    );

    setChanged((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  }

  /* ================= AUTO CALC ================= */
  function handlePurchaseChange(id, val) {
    const purchase = Number(val);
    const product = products.find((p) => p.id === id);
    const margin = Number(product?.margin_percentage || 0);
    const sales = purchase * (1 + margin / 100);

    updateField(id, "purchase_rate", purchase);
    updateField(id, "price", Number(sales.toFixed(2)));
  }

  function handleMarginChange(id, val) {
    const margin = Number(val);
    const product = products.find((p) => p.id === id);
    const purchase = Number(product?.purchase_rate || 0);
    const sales = purchase * (1 + margin / 100);

    updateField(id, "margin_percentage", margin);
    updateField(id, "price", Number(sales.toFixed(2)));
  }

  function handleSalesChange(id, val) {
    const sales = Number(val);
    const product = products.find((p) => p.id === id);
    const purchase = Number(product?.purchase_rate || 0);

    const margin = purchase > 0 ? ((sales - purchase) / purchase) * 100 : 0;

    updateField(id, "price", sales);
    updateField(id, "margin_percentage", Number(margin.toFixed(2)));
  }

  /* ================= SAVE ================= */
  async function handleSave() {
    if (Object.keys(changed).length === 0) {
      toast.error("No changes made");
      return;
    }

    setLoading(true);

    try {
      for (const id of Object.keys(changed)) {
        await apiPut(`/api/products/${id}`, changed[id]);
      }

      toast.success("Bulk update successful ✅");
      onUpdated?.();
    } catch {
      toast.error("Bulk update failed ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 720, md: 960 },
        },
      }}
    >
      <Box p={{ xs: 2, sm: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={3}>
          Bulk Edit ({products.length} items)
        </Typography>

        <Stack spacing={4}>
          {products.map((p, index) => (
            <Box
              key={p.id}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography fontWeight={600} mb={2}>
                {p.name}
              </Typography>

              <Grid container spacing={2}>
                {/* NAME */}
                {fields.includes("name") && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={p.name}
                      onChange={(e) =>
                        updateField(p.id, "name", e.target.value)
                      }
                    />
                  </Grid>
                )}

                {/* CATEGORY */}
                {fields.includes("category") && (
                  <Grid item xs={12} sm={6}>
                    <Select
                      fullWidth
                      value={p.category_id || ""}
                      displayEmpty
                      onChange={(e) =>
                        updateField(p.id, "category_id", e.target.value)
                      }
                    >
                      <MenuItem value="">Category</MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                )}

                {/* VENDOR */}
                {fields.includes("vendor") && (
                  <Grid item xs={12} sm={6}>
                    <Select
                      fullWidth
                      value={p.vendor_id || ""}
                      displayEmpty
                      onChange={(e) =>
                        updateField(p.id, "vendor_id", e.target.value)
                      }
                    >
                      <MenuItem value="">Vendor</MenuItem>
                      {vendors.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                )}

                {/* STOCK */}
                {fields.includes("stock") && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Stock"
                      type="number"
                      value={p.stock || ""}
                      onChange={(e) =>
                        updateField(p.id, "stock", Number(e.target.value))
                      }
                    />
                  </Grid>
                )}

                {/* PRICING */}
                {fields.includes("pricing") && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Purchase"
                        type="number"
                        value={p.purchase_rate || ""}
                        onChange={(e) =>
                          handlePurchaseChange(p.id, e.target.value)
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Margin %"
                        type="number"
                        value={p.margin_percentage || ""}
                        onChange={(e) =>
                          handleMarginChange(p.id, e.target.value)
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Sales"
                        type="number"
                        value={p.price || ""}
                        onChange={(e) =>
                          handleSalesChange(p.id, e.target.value)
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="MRP"
                        type="number"
                        value={p.mrp || ""}
                        onChange={(e) =>
                          updateField(p.id, "mrp", Number(e.target.value))
                        }
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          ))}
        </Stack>

        {/* ACTION BAR */}
        <Box mt={4} pt={3} borderTop="1px solid #e5e7eb">
          <Stack direction="row" spacing={2}>
            <Button fullWidth variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update All"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
