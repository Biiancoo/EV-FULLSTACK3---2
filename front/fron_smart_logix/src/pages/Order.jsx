import { useEffect, useState } from "react";
import { getOrders, createOrder, getOrderByNumber } from "../service/orderService";

const STATUS_LABEL = {
  PENDING: "Pendiente", PROCESSING: "Procesando",
  SHIPPED: "Enviado", COMPLETED: "Completado", CANCELLED: "Cancelado",
};

function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Crear
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerName: "", customerEmail: "", shippingAddress: "",
    lines: [{ sku: "", quantity: 1, unitPrice: 0 }],
  });
  const [formMsg, setFormMsg] = useState({ text: "", type: "" });
  const [formLoading, setFormLoading] = useState(false);

  // Buscar
  const [searchNum, setSearchNum] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setOrders(await getOrders());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function addLine() {
    setForm({ ...form, lines: [...form.lines, { sku: "", quantity: 1, unitPrice: 0 }] });
  }

  function updateLine(i, field, value) {
    setForm({ ...form, lines: form.lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l) });
  }

  function removeLine(i) {
    setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerEmail.trim() || !form.shippingAddress.trim()) {
      setFormMsg({ text: "Complete nombre, email y dirección", type: "error" });
      return;
    }
    if (form.lines.some((l) => !l.sku.trim())) {
      setFormMsg({ text: "Todos los ítems necesitan un SKU", type: "error" });
      return;
    }
    setFormLoading(true);
    setFormMsg({ text: "", type: "" });
    try {
      await createOrder({
        ...form,
        lines: form.lines.map((l) => ({ sku: l.sku, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
      });
      setShowCreate(false);
      setForm({ customerName: "", customerEmail: "", shippingAddress: "", lines: [{ sku: "", quantity: 1, unitPrice: 0 }] });
      load();
    } catch (e) {
      setFormMsg({ text: e.message, type: "error" });
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchNum.trim()) return;
    setSearchError("");
    setSearchResult(null);
    try {
      setSearchResult(await getOrderByNumber(searchNum.trim()));
    } catch (e) {
      setSearchError(e.message);
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h2>🛒 Órdenes</h2>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancelar" : "+ Nueva Orden"}
        </button>
      </div>

      {/* Buscar */}
      <div className="search-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            placeholder="Buscar por número de orden..."
            value={searchNum}
            onChange={(e) => setSearchNum(e.target.value)}
          />
          <button type="submit" className="btn-secondary">Buscar</button>
          {searchResult && <button type="button" className="btn-clear" onClick={() => setSearchResult(null)}>✕ Limpiar</button>}
        </form>
        {searchError && <p className="msg msg--error">{searchError}</p>}
        {searchResult && (
          <div className="search-result">
            <strong>{searchResult.orderNumber}</strong> — {STATUS_LABEL[searchResult.status] || searchResult.status} — ${searchResult.totalAmount}
          </div>
        )}
      </div>

      {/* Formulario crear */}
      {showCreate && (
        <form onSubmit={handleCreate} className="form-card">
          <h3>Nueva Orden</h3>
          {formMsg.text && <p className={`msg msg--${formMsg.type}`}>{formMsg.text}</p>}
          <div className="form-grid">
            <label>Cliente<input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Juan Pérez" /></label>
            <label>Email<input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="cliente@email.com" /></label>
            <label>Dirección<input value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} placeholder="Av. Principal 123" /></label>
          </div>

          <div className="lines-section">
            <div className="lines-header">
              <h4>Líneas de Orden</h4>
              <button type="button" className="btn-secondary btn-sm" onClick={addLine}>+ Línea</button>
            </div>
            {form.lines.map((line, i) => (
              <div key={i} className="line-row">
                <label>SKU<input value={line.sku} onChange={(e) => updateLine(i, "sku", e.target.value)} placeholder="SKU-001" /></label>
                <label>Cant.<input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} /></label>
                <label>Precio<input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(i, "unitPrice", e.target.value)} /></label>
                {form.lines.length > 1 && (
                  <button type="button" className="btn-danger btn-sm line-remove" onClick={() => removeLine(i)}>✕</button>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={formLoading}>
            {formLoading ? "Creando..." : "Crear Orden"}
          </button>
        </form>
      )}

      {loading && <p className="loading">Cargando órdenes...</p>}
      {error && <p className="msg msg--error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>N° Orden</th><th>Estado</th><th>Total</th><th>Tracking</th><th>Creada</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="5" className="empty-row">No hay órdenes registradas</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.orderNumber}>
                    <td><code>{o.orderNumber}</code></td>
                    <td><span className={`badge badge-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                    <td>${o.totalAmount}</td>
                    <td>{o.trackingCode ? <code>{o.trackingCode}</code> : "—"}</td>
                    <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("es-CL") : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default OrderPage;
