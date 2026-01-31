import { useState } from "react";
import * as XLSX from "xlsx";
import { apiPost } from "../api/api";

export default function BulkImport({ onBack }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorRows, setErrorRows] = useState([]);

  /* ================= FILE SELECT ================= */
  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    parseExcel(f);
  }

  /* ================= EXCEL PARSE ================= */
  function parseExcel(file) {
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const normalized = json.map((r, index) => normalizeRow(r, index + 2));
      setRows(normalized);
    };

    reader.readAsBinaryString(file);
  }

  /* ================= NORMALIZE ================= */
  function normalizeRow(row, rowNumber) {
    const name =
      row["Item name"] ||
      row["Product"] ||
      row["Name"] ||
      row["item_name"] ||
      "";

    const category =
      row["Category"] || row["Group"] || row["category"] || "General";

    const price = Number(row["Rate"] || row["Sale price"] || 0);
    const mrp = Number(row["MRP"] || 0) || null;
    const stock = Number(row["Stock"] || row["Qty"] || 0);

    const unitName = row["Unit"] || "Base Unit";

    const valid = name && price > 0;

    return {
      rowNumber,
      valid,
      name: String(name).trim(),
      category_name: String(category).trim(),
      price,
      mrp,
      stock,
      units: [{ name: unitName, multiplier: 1 }],
      availability: stock > 0,
    };
  }

  /* ================= REMOVE ROW ================= */
  function removeRow(i) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  /* ================= BULK SAVE ================= */
  async function handleImport() {
    if (!rows.length) return alert("No data to import");

    setLoading(true);
    setErrorRows([]);

    try {
      const validRows = rows.filter((r) => r.valid);

      const res = await apiPost("/api/products/bulk", {
        products: validRows,
      });

      alert(`Imported ${res.success} products ✅`);
      onBack();
    } catch (err) {
      console.error(err);
      alert("Bulk import failed ❌");
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */
  return (
    <div style={page}>
      <div style={topBar}>
        <h2>📦 Bulk Product Import</h2>
        <button onClick={onBack} style={backBtn}>
          ← Back
        </button>
      </div>

      {/* UPLOAD */}
      <div style={card}>
        <h4>1️⃣ Upload Excel File</h4>
        <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
        <p style={hint}>✔ Vyapar Excel supported | Max 5000 rows</p>
      </div>

      {/* PREVIEW */}
      {rows.length > 0 && (
        <div style={card}>
          <h4>2️⃣ Preview ({rows.length} rows)</h4>

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    style={{ background: r.valid ? "#fff" : "#fee2e2" }}
                  >
                    <td>{r.rowNumber}</td>
                    <td>{r.name}</td>
                    <td>{r.category_name}</td>
                    <td>₹{r.price}</td>
                    <td>{r.stock}</td>
                    <td>{r.valid ? "✅ OK" : "❌ Invalid"}</td>
                    <td>
                      <button onClick={() => removeRow(i)}>❌</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button style={importBtn} disabled={loading} onClick={handleImport}>
            {loading ? "Importing..." : "🚀 Import Products"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const page = { padding: 24 };
const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const backBtn = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
};
const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 14,
  marginTop: 16,
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
};
const hint = { fontSize: 13, color: "#6b7280" };
const tableWrap = { overflowX: "auto", marginTop: 12 };
const table = {
  width: "100%",
  borderCollapse: "collapse",
};
const importBtn = {
  marginTop: 14,
  padding: 14,
  width: "100%",
  borderRadius: 12,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
};
