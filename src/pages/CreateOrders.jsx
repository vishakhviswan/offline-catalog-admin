import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";

export default function CreateOrders({ onBack, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiGet("/api/customers").then(setCustomers);
    apiGet("/api/products").then(setProducts);
  }, []);

  function addItem() {
    setItems([...items, { product_id: "", qty: 1, price: 0 }]);
  }

  function updateItem(index, key, value) {
    const copy = [...items];
    copy[index][key] = value;
    setItems(copy);
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  const grandTotal = items.reduce(
    (sum, i) => sum + Number(i.qty) * Number(i.price),
    0,
  );

  async function saveOrder() {
    if (!customerId || items.length === 0) {
      alert("Select customer & items");
      return;
    }

    await apiPost("/api/orders", {
      customer_id: customerId,
      items,
      total: grandTotal,
    });

    onSaved && onSaved();
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2>Create Order</h2>

      {/* CUSTOMER */}
      <div style={card}>
        <label style={label}>Customer</label>
        <select
          style={input}
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ITEMS */}
      <div style={card}>
        <h4>Items</h4>

        {items.map((item, index) => (
          <div key={index} style={row}>
            <select
              style={input}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                updateItem(index, "product_id", p.id);
                updateItem(index, "price", p.price);
              }}
            >
              <option>Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              style={input}
              value={item.qty}
              onChange={(e) => updateItem(index, "qty", e.target.value)}
            />

            <div style={{ width: 100, textAlign: "right" }}>
              ₹{(item.qty * item.price).toFixed(2)}
            </div>

            <button onClick={() => removeItem(index)}>❌</button>
          </div>
        ))}

        <button onClick={addItem} style={addBtn}>
          + Add Item
        </button>
      </div>

      {/* FOOTER */}
      <div style={footer}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          Total: ₹{grandTotal.toFixed(2)}
        </div>

        <div>
          <button onClick={onBack} style={cancelBtn}>
            Back
          </button>
          <button onClick={saveOrder} style={saveBtn}>
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== styles ===== */

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 14,
  marginBottom: 16,
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
};

const label = { fontWeight: 600, marginBottom: 6, display: "block" };

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  width: "100%",
};

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 100px auto",
  gap: 10,
  alignItems: "center",
  marginBottom: 10,
};

const addBtn = {
  marginTop: 10,
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#10b981",
  color: "#fff",
};

const footer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const saveBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  marginLeft: 8,
};

const cancelBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
};
