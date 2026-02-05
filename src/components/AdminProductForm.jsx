import { useEffect, useMemo, useState } from "react";
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
  Chip,
} from "@mui/material";

import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";

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
  { name: "dozen", multiplier: 12 },
  { name: "box", multiplier: 1 },
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

  const [units, setUnits] = useState([{ name: "pcs", multiplier: 1 }]);

  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  /* ================= EDIT MODE ================= */
  useEffect(() => {
    if (!editingProduct) return;

    setName(editingProduct.name || "");
    setCategoryId(editingProduct.category_id || "");
    setPrice(editingProduct.price ?? "");
    setStock(editingProduct.stock ?? "");
    setUnits(
      editingProduct.units?.length
        ? editingProduct.units
        : [{ name: "pcs", multiplier: 1 }],
    );
    setPreview(editingProduct.images?.[0] || "");
    setTouched(false);
  }, [editingProduct]);

  /* ================= VALIDATION ================= */
  const nameError = touched && !name.trim();
  const priceError = touched && (!price || Number(price) <= 0);

  const duplicateName = useMemo(() => {
    const normalized = name.trim().toLowerCase();
    return products.find(
      (p) =>
        p.name?.trim().toLowerCase() === normalized &&
        p.id !== editingProduct?.id,
    );
  }, [name, products, editingProduct]);

  /* ================= IMAGE ================= */
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setTouched(true);
    toast.success("Image selected");
  }

  /* ================= SAVE ================= */
  async function saveProduct(e) {
    e.preventDefault();
    setTouched(true);

    if (nameError || priceError) {
      toast.error("Required fields check ചെയ്യൂ");
      return;
    }

    if (duplicateName) {
      toast.error("ഈ product name ഇതിനകം ഉണ്ട്");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const payload = {
        name: name.trim(),
        category_id: categoryId || null,
        price: Number(price),
        stock: stock ? Number(stock) : 0,
        availability: Number(stock) > 0,
        units: units.map(({ name, multiplier }) => ({ name, multiplier })),
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
    <Box pb={10}>
      {/* IMAGE HERO */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography fontWeight={700} mb={1}>
          Product Image
        </Typography>

        <Box
          onClick={() => document.getElementById("imgInput").click()}
          sx={{
            aspectRatio: "1/1",
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
            <Stack alignItems="center" spacing={1}>
              <ImageIcon color="primary" />
              <Typography fontSize={13} color="text.secondary">
                1080 × 1080 recommended
              </Typography>
            </Stack>
          )}
          <input
            hidden
            id="imgInput"
            type="file"
            accept="image/*"
            onChange={handleFile}
          />
        </Box>
      </Card>

      {/* BASIC INFO */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Product Name *"
            value={name}
            error={nameError}
            helperText={nameError && "Product name required"}
            onChange={(e) => {
              setName(e.target.value);
              setTouched(true);
            }}
            fullWidth
          />

          {duplicateName && (
            <Chip
              color="warning"
              label={`Similar product exists: ${duplicateName.name}`}
            />
          )}

          <Select
            value={categoryId}
            displayEmpty
            onChange={(e) => {
              setCategoryId(e.target.value);
              setTouched(true);
            }}
          >
            <MenuItem value="">Category (optional)</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Price *"
              type="number"
              value={price}
              error={priceError}
              helperText={priceError && "Valid price required"}
              onChange={(e) => {
                setPrice(e.target.value);
                setTouched(true);
              }}
              fullWidth
            />
            <TextField
              label="Stock"
              type="number"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                setTouched(true);
              }}
              fullWidth
            />
          </Stack>
        </Stack>
      </Card>

      {/* UNITS */}
      <Card sx={{ p: 3, mt: 3 }}>
        <Typography fontWeight={700} mb={1}>
          Units (display order matters)
        </Typography>

        <Stack spacing={1.5}>
          {units.map((u, i) => (
            <Card key={i} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Select
                  size="small"
                  value={u.name}
                  onChange={(e) => {
                    const copy = [...units];
                    const found = UNIT_PRESETS.find(
                      (p) => p.name === e.target.value,
                    );
                    copy[i] = found || copy[i];
                    setUnits(copy);
                    setTouched(true);
                  }}
                  sx={{ minWidth: 100 }}
                >
                  {UNIT_PRESETS.map((p) => (
                    <MenuItem key={p.name} value={p.name}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>

                <TextField
                  size="small"
                  type="number"
                  value={u.multiplier}
                  onChange={(e) => {
                    const copy = [...units];
                    copy[i].multiplier = Number(e.target.value);
                    setUnits(copy);
                    setTouched(true);
                  }}
                  sx={{ width: 90 }}
                />

                {i === 0 && <Chip size="small" label="PRIMARY" />}

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
              </Stack>
            </Card>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setUnits([...units, { name: "pcs", multiplier: 1 }]);
              setTouched(true);
            }}
          >
            Add Unit
          </Button>
        </Stack>
      </Card>

      {/* STICKY ACTION BAR */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid #e5e7eb",
          bgcolor: "#fff",
          p: 2,
          zIndex: 1200,
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
            {loading
              ? "Saving..."
              : editingProduct
                ? "Update Product"
                : "Save Product"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
