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
  IconButton,
  Drawer,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  useMediaQuery,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ImageIcon from "@mui/icons-material/Image";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { apiGet, apiDelete } from "../api/api";
import AdminProductForm from "../components/AdminProductForm";

export default function Products() {
  /* ================= STATE ================= */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [imageFilter, setImageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Bulk
  const [selected, setSelected] = useState([]);

  const isMobile = useMediaQuery("(max-width:768px)");
  const effectiveView = isMobile ? "list" : viewMode;

  /* ================= LOAD ================= */
  async function loadProducts() {
    try {
      setLoading(true);
      const data = await apiGet("/api/products");
      setProducts(data || []);
      setSelected([]);
    } catch {
      toast.error("Products load failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await apiGet("/api/categories");
      setCategories(data || []);
    } catch {
      toast.error("Categories load failed");
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  /* ================= FILTERED ================= */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search) {
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (categoryFilter) {
      list = list.filter((p) => p.category_id === categoryFilter);
    }

    if (imageFilter === "with") {
      list = list.filter((p) => p.images?.length);
    }

    if (imageFilter === "without") {
      list = list.filter((p) => !p.images?.length);
    }

    list.sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "stock") return (a.stock || 0) - (b.stock || 0);
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [products, search, categoryFilter, imageFilter, sortBy]);

  /* ================= DELETE ================= */
  function confirmDelete(id, name) {
    toast(
      (t) => (
        <Box>
          <Typography fontWeight={600} mb={1}>
            "{name}" delete ചെയ്യണോ?
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              color="error"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await apiDelete(`/api/products/${id}`);
                  toast.success("Product deleted ✅");
                  loadProducts();
                } catch {
                  toast.error("Delete failed ❌");
                }
              }}
            >
              Delete
            </Button>
            <Button onClick={() => toast.dismiss(t.id)}>Cancel</Button>
          </Stack>
        </Box>
      ),
      { duration: 6000 },
    );
  }

  function bulkDelete() {
    toast(
      (t) => (
        <Box>
          <Typography fontWeight={600} mb={1}>
            {selected.length} products delete ചെയ്യണോ?
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              color="error"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  for (const id of selected) {
                    await apiDelete(`/api/products/${id}`);
                  }
                  toast.success("Products deleted ✅");
                  setSelected([]);
                  loadProducts();
                } catch {
                  toast.error("Bulk delete failed ❌");
                }
              }}
            >
              Delete
            </Button>
            <Button onClick={() => toast.dismiss(t.id)}>Cancel</Button>
          </Stack>
        </Box>
      ),
      { duration: 7000 },
    );
  }

  /* ================= UI ================= */
  return (
    <Box maxWidth={1300} mx="auto">
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Products ({products.length})
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Manage your catalog
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <IconButton onClick={loadProducts}>
            <RefreshIcon />
          </IconButton>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => {
              setEditingProduct(null);
              setDrawerOpen(true);
            }}
          >
            Add Product
          </Button>
        </Stack>
      </Stack>

      {/* FILTER BAR */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <Select
            value={categoryFilter}
            displayEmpty
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>

          <ToggleButtonGroup
            value={imageFilter}
            exclusive
            onChange={(e, v) => v && setImageFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="with">
              <ImageIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="without">
              <ImageNotSupportedIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="stock">Stock</MenuItem>
          </Select>

          {!isMobile && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, v) => v && setViewMode(v)}
            >
              <ToggleButton value="list">
                <ViewListIcon />
              </ToggleButton>
              <ToggleButton value="grid">
                <ViewModuleIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Card>

      {/* BULK BAR */}
      {selected.length > 0 && (
        <Card sx={{ p: 1.5, mb: 2, bgcolor: "#fff7ed" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography fontWeight={600}>{selected.length} selected</Typography>
            <Button
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={bulkDelete}
            >
              Delete
            </Button>
          </Stack>
        </Card>
      )}

      {/* LIST / GRID */}
      {loading ? (
        <Typography textAlign="center" py={4}>
          Loading…
        </Typography>
      ) : filteredProducts.length === 0 ? (
        <Typography textAlign="center" py={4} color="text.secondary">
          No products found
        </Typography>
      ) : effectiveView === "list" ? (
        <Card>
          {filteredProducts.map((p) => (
            <Box
              key={p.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 1.5,
                borderBottom: "1px solid #eee",
              }}
            >
              <Checkbox
                checked={selected.includes(p.id)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, p.id]
                      : selected.filter((id) => id !== p.id),
                  )
                }
              />

              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "#f1f5f9",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt=""
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography fontSize={11} color="text.secondary">
                    No Image
                  </Typography>
                )}
              </Box>

              <Box flex={1}>
                <Typography fontWeight={600}>{p.name}</Typography>
                <Typography fontSize={12} color="text.secondary">
                  ₹{p.price} | Stock {p.stock ?? 0}
                </Typography>
              </Box>

              <Button
                size="small"
                onClick={() => {
                  setEditingProduct(p);
                  setDrawerOpen(true);
                }}
              >
                Edit
              </Button>

              <IconButton
                color="error"
                onClick={() => confirmDelete(p.id, p.name)}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          ))}
        </Card>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fill,minmax(220px,1fr))"
          gap={2}
        >
          {filteredProducts.map((p) => (
            <Card key={p.id} sx={{ p: 1.5 }}>
              <Box
                sx={{
                  height: 140,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt=""
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography fontSize={13} color="text.secondary">
                    No Image
                  </Typography>
                )}
              </Box>

              <Typography mt={1} fontWeight={600}>
                {p.name}
              </Typography>
              <Typography fontSize={13}>₹{p.price}</Typography>

              <Stack direction="row" spacing={1} mt={1}>
                <Button
                  size="small"
                  fullWidth
                  onClick={() => {
                    setEditingProduct(p);
                    setDrawerOpen(true);
                  }}
                >
                  Edit
                </Button>
                <IconButton
                  color="error"
                  onClick={() => confirmDelete(p.id, p.name)}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            </Card>
          ))}
        </Box>
      )}

      {/* DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingProduct(null);
        }}
        PaperProps={{ sx: { width: { xs: "100%", md: 520 } } }}
      >
        <Box p={2}>
          <AdminProductForm
            editingProduct={editingProduct}
            categories={categories}
            products={products}
            onSaved={() => {
              setDrawerOpen(false);
              loadProducts();
            }}
            onCancel={() => setDrawerOpen(false)}
          />
        </Box>
      </Drawer>
    </Box>
  );
}
