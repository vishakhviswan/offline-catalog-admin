import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Card,
  IconButton,
  Drawer,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  useMediaQuery,
  Skeleton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { apiGet, apiDelete } from "../api/api";
import AdminProductForm from "../components/AdminProductForm";
import BulkEditModal from "../components/BulkEditModal";
import BulkEditEditor from "../components/BulkEditEditor";

export default function Products() {
  /* ================= DATA ================= */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
   const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= UI ================= */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  /* ================= FILTER STATE ================= */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [imageFilter, setImageFilter] = useState("all"); // all | with | without
  const [stockFilter, setStockFilter] = useState("all"); // all | in | out

  const [selected, setSelected] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const isMobile = useMediaQuery("(max-width:768px)");
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkEditorOpen, setBulkEditorOpen] = useState(false);
  const [bulkFields, setBulkFields] = useState([]);
 

  /* ================= LOAD ================= */
  async function loadProducts() {
    try {
      setLoading(true);
      setProducts((await apiGet("/api/products")) || []);
      setSelected([]);
    } catch {
      toast.error("Products load failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    setCategories((await apiGet("/api/categories")) || []);
  }

  async function loadVendors() {
    try {
      setVendors((await apiGet("/api/vendors")) || []);
    } catch {
      toast.error("Vendors load failed");
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadVendors();
  }, []);

  /* ================= FILTER LOGIC ================= */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search)
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()),
      );

    if (category) list = list.filter((p) => p.category_id === category);

    if (imageFilter === "with") list = list.filter((p) => p.images?.length);

    if (imageFilter === "without") list = list.filter((p) => !p.images?.length);

    if (stockFilter === "in")
      list = list.filter((p) => Number(p.stock || 0) > 0);

    if (stockFilter === "out")
      list = list.filter((p) => Number(p.stock || 0) === 0);

    return list;
  }, [products, search, category, imageFilter, stockFilter]);

  /* ================= DRAWER NAV ================= */
  const currentIndex = filteredProducts.findIndex(
    (p) => p.id === editingProduct?.id,
  );
  const prevProduct = filteredProducts[currentIndex - 1];
  const nextProduct = filteredProducts[currentIndex + 1];

  /* ================= DELETE ================= */
  function confirmDelete(id, name) {
    toast((t) => (
      <Box>
        <Typography fontWeight={700} mb={1}>
          "{name}" delete cheyyano?
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            color="error"
            onClick={async () => {
              toast.dismiss(t.id);
              await apiDelete(`/api/products/${id}`);
              toast.success("Deleted");
              loadProducts();
            }}
          >
            Delete
          </Button>
          <Button onClick={() => toast.dismiss(t.id)}>Cancel</Button>
        </Stack>
      </Box>
    ));
  }

  /* ================= ACTIVE FILTER CHIPS ================= */
  const filterChips = [
    search && { label: `Search: ${search}`, onDelete: () => setSearch("") },
    category && {
      label: "Category",
      onDelete: () => setCategory(""),
    },
    imageFilter !== "all" && {
      label: `Image: ${imageFilter}`,
      onDelete: () => setImageFilter("all"),
    },
    stockFilter !== "all" && {
      label: `Stock: ${stockFilter}`,
      onDelete: () => setStockFilter("all"),
    },
  ].filter(Boolean);

  /* ================= UI ================= */
  return (
    <Box maxWidth={1400} mx="auto">
      {/* ===== STICKY TOP BAR ===== */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          p: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <IconButton onClick={() => setFilterOpen(true)}>
            <FilterListIcon />
          </IconButton>

          <IconButton onClick={loadProducts}>
            <RefreshIcon />
          </IconButton>

          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => {
              setFormLoading(true);
              setEditingProduct(null);
              setDrawerOpen(true);
              setTimeout(() => {
                setFormLoading(false);
              }, 80);
            }}
          >
            Add
          </Button>
          <Button
            variant="outlined"
            disabled={selected.length === 0}
            onClick={() => {
              if (selected.length === 0) {
                toast.error("Select at least one Product");
                return;
              }
              setBulkModalOpen(true);
            }}
          >
            Bulk Edit
          </Button>
        </Stack>

        {/* Applied Filters */}
        {filterChips.length > 0 && (
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            {filterChips.map((c, i) => (
              <Chip key={i} label={c.label} onDelete={c.onDelete} />
            ))}
          </Stack>
        )}
      </Box>

      {/* ===== PRODUCT LIST ===== */}
      {loading ? (
        <Typography textAlign="center" py={4}>
          Loading…
        </Typography>
      ) : filteredProducts.length === 0 ? (
        <Typography textAlign="center" py={4} color="text.secondary">
          No products found
        </Typography>
      ) : (
        <Card sx={{ borderRadius: 0 }}>
          {filteredProducts.map((p) => (
            <Box
              key={p.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.2,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                bgcolor:
                  editingProduct?.id === p.id ? "#f0fdfa" : "transparent",
              }}
            >
              <Checkbox
                checked={selected.includes(p.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, p.id]
                      : selected.filter((id) => id !== p.id),
                  )
                }
              />

              <Box sx={{ width: 42, height: 42, bgcolor: "#f1f5f9" }}>
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
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
                  setFormLoading(true);
                  setDrawerOpen(true);

                  setTimeout(() => {
                    setEditingProduct(p);
                    setFormLoading(false);
                  }, 80);
                }}
              >
                Edit
              </Button>

              <IconButton
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(p.id, p.name);
                }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          ))}
        </Card>
      )}

      {/* ===== FILTER MODAL ===== */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} fullWidth>
        <DialogTitle>Filters</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Select
              value={category}
              displayEmpty
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={imageFilter}
              onChange={(e) => setImageFilter(e.target.value)}
            >
              <MenuItem value="all">All images</MenuItem>
              <MenuItem value="with">With image</MenuItem>
              <MenuItem value="without">Without image</MenuItem>
            </Select>

            <Select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <MenuItem value="all">All stock</MenuItem>
              <MenuItem value="in">In stock</MenuItem>
              <MenuItem value="out">Out of stock</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCategory("");
              setImageFilter("all");
              setStockFilter("all");
            }}
          >
            Reset
          </Button>
          <Button variant="contained" onClick={() => setFilterOpen(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== DRAWER ===== */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        keepMounted
        transitionDuration={250}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", md: 520 } } }}
      >
        {/* TOP NAV BAR */}
        {editingProduct && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            p={1}
            borderBottom="1px solid #e5e7eb"
          >
            <IconButton
              disabled={!prevProduct}
              onClick={() => {
                setFormLoading(true);
                setTimeout(() => {
                  setEditingProduct(prevProduct);
                  setFormLoading(false);
                }, 80);
              }}
            >
              <ChevronLeftIcon />
            </IconButton>

            <Typography fontWeight={700} noWrap>
              {editingProduct.name}
            </Typography>

            <IconButton
              disabled={!nextProduct}
              onClick={() => {
                setFormLoading(true);
                setTimeout(() => {
                  setEditingProduct(nextProduct);
                  setFormLoading(false);
                }, 80);
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        )}

        {/* CONTENT */}
        <Box p={2}>
          {formLoading ? (
            <Box
              height="70vh"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Stack spacing={2}>
                <Skeleton variant="rectangular" height={200} />
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={120} />
                <Skeleton height={50} />
              </Stack>
            </Box>
          ) : (
            <AdminProductForm
              key={editingProduct?.id || "new"}
              editingProduct={editingProduct}
              categories={categories}
              products={products}
              onSaved={() => loadProducts()}
              onCancel={() => setDrawerOpen(false)}
            />
          )}
        </Box>
      </Drawer>

      <BulkEditEditor
        open={bulkEditorOpen}
        productIds={selected}
        fields={bulkFields}
        categories={categories}
        vendors={vendors}
        onClose={() => setBulkEditorOpen(false)}
        onUpdated={() => {
          setBulkEditorOpen(false);
          loadProducts();
          setSelected([]);
        }}
      />
      <BulkEditModal
        open={bulkModalOpen}
        selectedCount={selected.length}
        onClose={() => setBulkModalOpen(false)}
        onContinue={(fields) => {
          setBulkModalOpen(false);
          setBulkFields(fields);
          setBulkEditorOpen(true);
          console.log("Selected fields:", fields);
          // Next: open bulk editor page
        }}
      />
    </Box>
  );
}
