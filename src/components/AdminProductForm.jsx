import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "../api/api";
import { uploadProductImage } from "../utils/uploadProductImage";

export default function AdminProductForm({
  editingProduct,
  categories,
  onSaved,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // ✅ Units always array
  const [units, setUnits] = useState([{ name: "pcs", multiplier: 1 }]);

  const [salesPrice, setSalesPrice] = useState("");
  const [hasMrp, setHasMrp] = useState(false);
  const [mrp, setMrp] = useState("");

  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState(0);

  /* ---------------- EDIT MODE ---------------- */
  useEffect(() => {
    if (!editingProduct) return;

    setName(editingProduct.name || "");
    setCategoryId(editingProduct.category_id || "");
    setSalesPrice(editingProduct.price || "");

    if (Array.isArray(editingProduct.units)) {
      setUnits(editingProduct.units);
    }

    if (editingProduct.mrp) {
      setHasMrp(true);
      setMrp(editingProduct.mrp);
    }

    if (editingProduct.discount_percentage) {
      setApplyDiscount(true);
      setDiscountPercent(editingProduct.discount_percentage);
    }
    setStock(editingProduct.stock ?? 0);
    setPreview(editingProduct.images?.[0] || "");
  }, [editingProduct]);

  /* ---------------- AUTO DISCOUNT ---------------- */
  useEffect(() => {
    if (!hasMrp) return;

    // No discount → sales price = MRP
    if (!applyDiscount || !discountPercent) {
      setDiscountAmount("");
      setSalesPrice(mrp ? Number(mrp) : "");
      return;
    }

    const discount = (Number(mrp) * Number(discountPercent)) / 100;
    const finalPrice = Number(mrp) - discount;

    setDiscountAmount(discount.toFixed(2));
    setSalesPrice(finalPrice.toFixed(2)); // ✅ AUTO UPDATE
  }, [mrp, discountPercent, hasMrp, applyDiscount]);

  /* ---------------- IMAGE ---------------- */
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  /* ---------------- SAVE ---------------- */
  async function saveProduct(e) {
    e.preventDefault();

    if (!name || !categoryId || !salesPrice) {
      alert("Please fill required fields");
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
        category_id: categoryId,
        units,
        price: Number(salesPrice),
        mrp: hasMrp ? Number(mrp) : null,
        discount_percentage:
          hasMrp && applyDiscount ? Number(discountPercent) : 0,
        stock: Number(stock),
        availability: Number(stock) > 0,
        images: imageUrl ? [imageUrl] : [],
      };

      if (editingProduct) {
        await apiPut(`/api/products/${editingProduct.id}`, payload);
      } else {
        await apiPost("/api/products", payload);
      }

      onSaved?.();
      alert("Product saved ✅");
    } catch (err) {
      console.error(err);
      alert("Save failed ❌");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <form onSubmit={saveProduct} style={card}>
      <h2 style={title}>{editingProduct ? "Edit Product" : "Add Product"}</h2>

      {/* BASIC */}
      <Section title="Basic Details">
        <Grid>
          <Field title="Product Name *">
            <input
              style={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field title="Category *">
            <select
              style={input}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field title="Units">
            {units.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input
                  style={input}
                  placeholder="Unit"
                  value={u.name}
                  onChange={(e) => {
                    const copy = [...units];
                    copy[i].name = e.target.value;
                    setUnits(copy);
                  }}
                />
                <input
                  style={input}
                  type="number"
                  placeholder="Multiplier"
                  value={u.multiplier}
                  onChange={(e) => {
                    const copy = [...units];
                    copy[i].multiplier = Number(e.target.value);
                    setUnits(copy);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              style={linkBtn}
              onClick={() => setUnits([...units, { name: "", multiplier: 1 }])}
            >
              ➕ Add Unit
            </button>
          </Field>

          <Field title="Sales Price *">
            <input
              type="number"
              style={{
                ...input,
                background: hasMrp ? "#f1f5f9" : "#fff",
                cursor: hasMrp ? "not-allowed" : "text",
              }}
              value={salesPrice}
              readOnly={hasMrp}
              onChange={(e) => setSalesPrice(e.target.value)}
            />
          </Field>
        </Grid>
        <Field title="Stock Quantity*">
          <input
            type="number"
            style={input}
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </Field>
      </Section>

      {/* IMAGE */}
      <Section title="Product Image">
        <input type="file" accept="image/*" onChange={handleFile} />
        {preview && <img src={preview} alt="" style={previewImg} />}
      </Section>

      {/* PRICING */}
      <Section title="Pricing">
        <Toggle title="Has MRP?" value={hasMrp} onChange={setHasMrp} />

        {hasMrp && (
          <>
            <Field title="MRP (₹)">
              <input
                type="number"
                style={input}
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
              />
            </Field>

            <Toggle
              title="Apply Discount?"
              value={applyDiscount}
              onChange={setApplyDiscount}
            />

            {applyDiscount && (
              <Grid>
                <Field title="Discount %">
                  <input
                    type="number"
                    style={input}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                </Field>
                <div
                  style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}
                >
                  Final Sales Price: ₹{salesPrice}
                </div>

                <Field title="Discount Amount (₹)">
                  <input style={input} value={discountAmount} readOnly />
                </Field>
              </Grid>
            )}
          </>
        )}
      </Section>

      {/* ACTIONS */}
      <div style={actions}>
        <button type="button" style={cancelBtn} onClick={onCancel}>
          Cancel
        </button>

        <button type="submit" style={saveBtn} disabled={loading}>
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

/* ================= SMALL COMPONENTS ================= */

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <h4 style={sectionTitle}>{title}</h4>
    <div style={sectionBox}>{children}</div>
  </div>
);

const Grid = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: 14,
    }}
  >
    {children}
  </div>
);

const Field = ({ title, children }) => (
  <div>
    <label style={label}>{title}</label>
    {children}
  </div>
);

const Toggle = ({ title, value, onChange }) => (
  <div style={toggleRow} onClick={() => onChange(!value)}>
    <span>{title}</span>
    <div
      style={{
        width: 42,
        height: 22,
        borderRadius: 20,
        background: value ? "#2563eb" : "#cbd5e1",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: value ? 22 : 2,
        }}
      />
    </div>
  </div>
);

/* ================= STYLES ================= */

const card = {
  maxWidth: 900,
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,.08)",
};
const title = { marginBottom: 20 };
const sectionTitle = { marginBottom: 10, fontSize: 16 };
const sectionBox = {
  background: "#f8fafc",
  padding: 18,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
};
const label = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  display: "block",
};
const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 15,
};
const toggleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
  cursor: "pointer",
};
const saveBtn = {
  flex: 1,
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#2563eb,#1e40af)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
};
const cancelBtn = {
  flex: 1,
  padding: 14,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontWeight: 600,
};
const actions = { display: "flex", gap: 12, marginTop: 20 };
const previewImg = {
  marginTop: 12,
  width: 120,
  height: 120,
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid #ddd",
};
const linkBtn = {
  background: "none",
  border: "none",
  color: "#2563eb",
  fontWeight: 600,
  cursor: "pointer",
};
