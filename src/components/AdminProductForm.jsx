import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  TextField,
  Select,
  MenuItem,
  Typography,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";

import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";

import { apiGet, apiPost, apiPut } from "../api/api";
import { uploadProductImage } from "../utils/uploadProductImage";
import { useSettings } from "../context/SettingsContext";

/* ================= UNIT PRESETS ================= */
const UNIT_PRESETS = [
  { name: "pcs", multiplier: 1 },
  { name: "kg", multiplier: 1 },
  { name: "liter", multiplier: 1 },
  { name: "dozen", multiplier: 12 },
  { name: "box", multiplier: 1 },
];

function rotateUnit(list, index) {
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  index === list.length - 1
    ? copy.unshift(item)
    : copy.splice(index + 1, 0, item);
  return copy;
}

export default function AdminProductForm({
  editingProduct,
  categories = [],
  onSaved,
  onCancel,
}) {
  const { settings } = useSettings();

  /* ================= STATE ================= */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");

  const [purchaseRate, setPurchaseRate] = useState("");
  const [margin, setMargin] = useState("");
  const [salesRate, setSalesRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");

  const [units, setUnits] = useState([{ name: "pcs", multiplier: 1 }]);

  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);

  /* ================= LOAD VENDORS ================= */
  useEffect(() => {
    async function loadVendors() {
      try {
        const data = await apiGet("/api/vendors");
        setVendors(data || []);
      } catch {
        toast.error("Failed to load vendors");
      }
    }
    loadVendors();
  }, []);

  /* ================= EDIT MODE ================= */
  useEffect(() => {
    if (!editingProduct) return;

    setName(editingProduct.name || "");
    setDescription(editingProduct.description || "");
    setCategoryId(editingProduct.category_id || "");
    setVendorId(editingProduct.vendor_id || "");

    setPurchaseRate(editingProduct.purchase_rate || "");
    setMargin(editingProduct.margin_percentage || "");
    setSalesRate(editingProduct.price || "");
    setMrp(editingProduct.mrp || "");
    setStock(editingProduct.stock || "");

    setUnits(
      editingProduct.units?.length
        ? editingProduct.units
        : [{ name: "pcs", multiplier: 1 }],
    );

    setPreview(editingProduct.images?.[0] || "");
  }, [editingProduct]);

  /* ================= AUTO CALC ================= */
  function handlePurchaseChange(val) {
    setPurchaseRate(val);
    if (margin) {
      const s = Number(val) * (1 + Number(margin) / 100);
      setSalesRate(s.toFixed(2));
    }
  }

  function handleMarginChange(val) {
    setMargin(val);
    if (purchaseRate) {
      const s = Number(purchaseRate) * (1 + Number(val) / 100);
      setSalesRate(s.toFixed(2));
    }
  }

  function handleSalesChange(val) {
    setSalesRate(val);
    if (purchaseRate && Number(purchaseRate) > 0) {
      const m =
        ((Number(val) - Number(purchaseRate)) / Number(purchaseRate)) * 100;
      setMargin(m.toFixed(2));
    }
  }

  /* ================= SAVE ================= */
  async function saveProduct(e) {
    e.preventDefault();

    if (!name.trim()) return toast.error("Product name required");
    if (!salesRate) return toast.error("Sales rate required");

    setLoading(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const payload = {
        name: name.trim(),
        description,
        category_id: categoryId || null,
        vendor_id: vendorId || null,
        purchase_rate: Number(purchaseRate) || 0,
        margin_percentage: Number(margin) || 0,
        price: Number(salesRate),
        mrp: Number(mrp) || null,
        stock: Number(stock) || 0,
        availability: Number(stock) > 0,
        units,
        images: imageUrl ? [imageUrl] : editingProduct?.images || [],
      };

      if (editingProduct) {
        await apiPut(`/api/products/${editingProduct.id}`, payload);
      } else {
        await apiPost("/api/products", payload);
      }

      toast.success("Saved successfully ✅");
      onSaved?.();
    } catch {
      toast.error("Save failed ❌");
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <Box pb={12}>
      {/* IMAGE */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography fontWeight={700} mb={1}>
          Product Image (1080×1080)
        </Typography>

        <Box
          onClick={() => document.getElementById("imgInput").click()}
          sx={{
            width: 240,
            height: 240,
            border: "2px dashed",
            borderColor: "primary.light",
            borderRadius: 3,
            overflow: "hidden",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f8fafc",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Stack alignItems="center">
              <ImageIcon color="primary" />
              <Typography fontSize={12}>Click to upload</Typography>
            </Stack>
          )}
          <input
            hidden
            id="imgInput"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setImageFile(file);
              setPreview(URL.createObjectURL(file));
            }}
          />
        </Box>
      </Card>

      {/* BASIC INFO */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <TextField
            label="Description"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <Select
              fullWidth
              value={categoryId}
              displayEmpty
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <MenuItem value="">Select Category</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>

            <Select
              fullWidth
              value={vendorId}
              displayEmpty
              onChange={(e) => setVendorId(e.target.value)}
            >
              <MenuItem value="">Preferred Vendor</MenuItem>
              {vendors.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.name}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Purchase Rate"
              type="number"
              value={purchaseRate}
              onChange={(e) => handlePurchaseChange(e.target.value)}
              fullWidth
            />

            <TextField
              label="Margin (%)"
              type="number"
              value={margin}
              onChange={(e) => handleMarginChange(e.target.value)}
              fullWidth
            />

            <TextField
              label="Sales Rate"
              type="number"
              value={salesRate}
              onChange={(e) => handleSalesChange(e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="MRP"
              type="number"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              fullWidth
            />

            {settings?.product_features?.enable_stock && (
              <TextField
                label="Stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                fullWidth
              />
            )}
          </Stack>
        </Stack>
      </Card>

      {/* ================= UNITS SECTION ================= */}
      <Card sx={{ p: 3, mt: 3 }}>
        <Typography fontWeight={700} mb={2}>
          Units
        </Typography>

        <Stack spacing={1.5}>
          {units.map((u, i) => (
            <Stack direction="row" spacing={1} key={i} alignItems="center">
              <Select
                value={u.name}
                onChange={(e) => {
                  const copy = [...units];
                  const found = UNIT_PRESETS.find(
                    (p) => p.name === e.target.value,
                  );
                  copy[i] = found || copy[i];
                  setUnits(copy);
                }}
                sx={{ width: 120 }}
              >
                {UNIT_PRESETS.map((p) => (
                  <MenuItem key={p.name} value={p.name}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                type="number"
                size="small"
                label="Multiplier"
                value={u.multiplier}
                onChange={(e) => {
                  const copy = [...units];
                  copy[i].multiplier = Number(e.target.value);
                  setUnits(copy);
                }}
                sx={{ width: 120 }}
              />

              <IconButton onClick={() => setUnits(rotateUnit(units, i))}>
                <AutorenewIcon />
              </IconButton>

              <IconButton
                color="error"
                disabled={units.length === 1}
                onClick={() => setUnits(units.filter((_, idx) => idx !== i))}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() => setUnits([...units, { name: "pcs", multiplier: 1 }])}
          >
            Add Unit
          </Button>
        </Stack>
      </Card>

      {/* ACTION BAR */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "#fff",
          borderTop: "1px solid #e5e7eb",
          p: 2,
        }}
      >
        <Stack direction="row" spacing={2}>
          <Button fullWidth variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={saveProduct}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
