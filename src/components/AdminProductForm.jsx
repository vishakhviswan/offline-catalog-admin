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
} from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

import { apiPost, apiPut } from "../api/api";
import { uploadProductImage } from "../utils/uploadProductImage";

/* ================= UNIT PRESETS ================= */
const UNIT_PRESETS = [
  { name: "pcs", multiplier: 1 },
  { name: "kg", multiplier: 1 },
  { name: "gram", multiplier: 0.001 },
  { name: "liter", multiplier: 1 },
  { name: "ml", multiplier: 0.001 },
  { name: "meter", multiplier: 1 },
  { name: "sqft", multiplier: 1 },
  { name: "sqm", multiplier: 1 },
  { name: "dozen", multiplier: 12 },
  { name: "box", multiplier: 1 },
  { name: "packet", multiplier: 1 },
];

/* ================= HELPERS ================= */
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
  products = [],
  onSaved,
  onCancel,
}) {
  /* ================= STATE ================= */
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [units, setUnits] = useState([
    { name: "pcs", multiplier: 1, isCustom: false },
  ]);

  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= EDIT MODE ================= */
  useEffect(() => {
    if (!editingProduct) return;

    setName(editingProduct.name || "");
    setCategoryId(editingProduct.category_id || "");
    setPrice(editingProduct.price ?? "");
    setStock(editingProduct.stock ?? "");

    if (editingProduct.units?.length) {
      setUnits(
        editingProduct.units.map((u) => ({
          name: u.name,
          multiplier: u.multiplier,
          isCustom: !UNIT_PRESETS.some((p) => p.name === u.name),
        })),
      );
    }

    setPreview(editingProduct.images?.[0] || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editingProduct]);

  /* ================= IMAGE ================= */
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    toast.success("Image selected");
  }

  /* ================= SAVE ================= */
  async function saveProduct(e) {
    e.preventDefault();

    if (!name.trim()) return toast.error("Product name ആവശ്യമാണ്");
    if (!price || Number(price) <= 0) return toast.error("Valid price നൽകണം");

    const normalized = name.trim().toLowerCase();
    const duplicate = products.find(
      (p) =>
        p.name?.trim().toLowerCase() === normalized &&
        p.id !== editingProduct?.id,
    );
    if (duplicate) return toast.error("ഈ product name ഇതിനകം ഉണ്ട്");

    const validUnits = units.filter((u) => u.name && u.multiplier > 0);
    if (!validUnits.length) return toast.error("At least one unit ആവശ്യമാണ്");

    setLoading(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        try {
          imageUrl = await uploadProductImage(imageFile);
          toast.success("Image uploaded");
        } catch {
          toast.error("Image upload failed");
        }
      }

      const payload = {
        name: name.trim(),
        category_id: categoryId || null,
        price: Number(price),
        stock: stock ? Number(stock) : 0,
        availability: Number(stock) > 0,
        units: validUnits.map(({ name, multiplier }) => ({
          name,
          multiplier,
        })),
        images: imageUrl ? [imageUrl] : editingProduct?.images || [],
      };

      editingProduct
        ? await apiPut(`/api/products/${editingProduct.id}`, payload)
        : await apiPost("/api/products", payload);

      toast.success(editingProduct ? "Product updated ✅" : "Product added ✅");
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error("Save failed ❌");
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */
  return (
    <Card sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <form onSubmit={saveProduct}>
        {/* TOP */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Product Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <Select
            value={categoryId}
            displayEmpty
            onChange={(e) => setCategoryId(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Category (optional)</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>

          <Box
            onClick={() => document.getElementById("imgInput").click()}
            sx={{
              width: { xs: "100%", md: 90 },
              height: { xs: 120, md: 90 },
              border: "2px dashed #cbd5e1",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Typography fontSize={13} color="text.secondary">
                Image
              </Typography>
            )}
            <input hidden id="imgInput" type="file" onChange={handleFile} />
          </Box>
        </Stack>

        {/* UNITS */}
        <Typography mt={3} fontWeight={600}>
          Units
        </Typography>

        <Stack spacing={1.5} mt={1}>
          {units.map((u, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            >
              <Select
                size="small"
                value={u.isCustom ? "__custom__" : u.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const copy = [...units];
                  if (val === "__custom__") {
                    copy[i] = { name: "", multiplier: 1, isCustom: true };
                  } else {
                    const found = UNIT_PRESETS.find((p) => p.name === val);
                    copy[i] = { ...found, isCustom: false };
                  }
                  setUnits(copy);
                }}
                sx={{ minWidth: 110 }}
              >
                {UNIT_PRESETS.map((p) => (
                  <MenuItem key={p.name} value={p.name}>
                    {p.name}
                  </MenuItem>
                ))}
                <MenuItem value="__custom__">Custom…</MenuItem>
              </Select>

              {u.isCustom && (
                <TextField
                  size="small"
                  placeholder="Unit"
                  value={u.name}
                  onChange={(e) => {
                    const copy = [...units];
                    copy[i].name = e.target.value;
                    setUnits(copy);
                  }}
                  sx={{ width: 120 }}
                />
              )}

              <TextField
                size="small"
                type="number"
                value={u.multiplier}
                onChange={(e) => {
                  const copy = [...units];
                  copy[i].multiplier = Number(e.target.value);
                  setUnits(copy);
                }}
                sx={{ width: 90 }}
              />

              <IconButton onClick={() => setUnits(rotateUnit(units, i))}>
                <AutorenewIcon fontSize="small" />
              </IconButton>

              <IconButton
                color="error"
                disabled={units.length === 1}
                onClick={() => setUnits(units.filter((_, idx) => idx !== i))}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              setUnits([
                ...units,
                { name: "pcs", multiplier: 1, isCustom: false },
              ])
            }
          >
            Add Unit
          </Button>
        </Stack>

        {/* PRICE */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mt={3}>
          <TextField
            label="Price *"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            fullWidth
          />
          <TextField
            label="Stock (optional)"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            fullWidth
          />
        </Stack>

        {/* ACTIONS */}
        <Stack direction="row" spacing={2} mt={4}>
          <Button fullWidth variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editingProduct
                ? "Update Product"
                : "Save Product"}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
