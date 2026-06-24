import { useEffect, useState } from "react";
import {
  getInventory,
  createInventoryItem,
  checkAvailability,
  reserveItem,
  releaseItem,
  dispatchItem,
  getRecommendations,
} from "../service/inventoryService";

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Crear
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ sku: "", productName: "", warehouseCode: "", initialQuantity: 0, reorderLevel: 0 });
  const [formMsg, setFormMsg] = useState({ text: "", type: "" });
  const [formLoading, setFormLoading] = useState(false);

  // Operaciones
  const [opSku, setOpSku] = useState("");
  const [opQty, setOpQty] = useState(1);
  const [opMsg, setOpMsg] = useState({ text: "", type: "" });

  // Recomendaciones
  const [showRecs, setShowRecs] = useState(false);
  const [recs, setRecs] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [recSource, setRecSource] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setInventory(await getInventory());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations() {
    setRecLoading(true);
    setRecError("");
    try {
      const data = await getRecommendations();
      setRecs(data);
      if (data.length > 0 && data[0].source) {
        setRecSource(data[0].source);
      } else {
        setRecSource("");
      }
    } catch (e) {
      setRecError(e.message);
    } finally {
      setRecLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.sku.trim() || !form.productName.trim() || !form.warehouseCode.trim()) {
      setFormMsg({ text: "SKU, nombre y bodega son obligatorios", type: "error" });
      return;
    }
    setFormLoading(true);
    setFormMsg({ text: "", type: "" });
    try {
      await createInventoryItem({ ...form, initialQuantity: Number(form.initialQuantity), reorderLevel: Number(form.reorderLevel) });
      setShowCreate(false);
      setForm({ sku: "", productName: "", warehouseCode: "", initialQuantity: 0, reorderLevel: 0 });
      load();
    } catch (e) {
      setFormMsg({ text: e.message, type: "error" });
    } finally {
      setFormLoading(false);
    }
  }

  async function doOp(action) {
    if (!opSku.trim()) { setOpMsg({ text: "Ingrese un SKU", type: "error" }); return; }
    setOpMsg({ text: "", type: "" });
    try {
      let result;
      if (action === "check") {
        result = await checkAvailability(opSku, opQty);
        setOpMsg({ text: `Disponible: ${result.available ? "Si" : "No"} — Stock: ${result.availableQuantity}`, type: "info" });
        return;
      }
      if (action === "reserve") result = await reserveItem(opSku, opQty);
      if (action === "release") result = await releaseItem(opSku, opQty);
      if (action === "dispatch") result = await dispatchItem(opSku, opQty);
      setOpMsg({ text: `${result.productName}: disponible ${result.availableQuantity} uds`, type: "success" });
      load();
    } catch (e) {
      setOpMsg({ text: e.message, type: "error" });
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h2>Inventario</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn-secondary"
            onClick={() => {
              setShowRecs(!showRecs);
              if (!showRecs) loadRecommendations();
            }}
          >
            {showRecs ? "Cerrar Analisis" : "Recomendaciones"}
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancelar" : "+ Nuevo Item"}
          </button>
        </div>
      </div>

      {/* Panel de operaciones */}
      <div className="op-panel">
        <h3>Operaciones sobre Stock</h3>
        <div className="form-grid">
          <label>
            SKU
            <input value={opSku} onChange={(e) => setOpSku(e.target.value)} placeholder="SKU-001" />
          </label>
          <label>
            Cantidad
            <input type="number" min="1" value={opQty} onChange={(e) => setOpQty(Number(e.target.value))} />
          </label>
        </div>
        <div className="op-buttons">
          <button className="btn-secondary" onClick={() => doOp("check")}>Verificar disponibilidad</button>
          <button className="btn-secondary" onClick={() => doOp("reserve")}>Reservar</button>
          <button className="btn-secondary" onClick={() => doOp("release")}>Liberar</button>
          <button className="btn-danger" onClick={() => doOp("dispatch")}>Despachar</button>
        </div>
        {opMsg.text && <p className={`msg msg--${opMsg.type}`}>{opMsg.text}</p>}
      </div>

      {showRecs && (
        <div className="op-panel" style={{ background: "#1a1a2e", border: "1px solid #3a3a5e" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ color: "#a78bfa" }}>Analisis Inteligente de Inventario</h3>
            {recSource && (
              <span className={`badge badge--${recSource.toLowerCase()}`}>
                {recSource === "GEMINI" ? "IA Gemini" : "Reglas locales"}
              </span>
            )}
          </div>
          {recLoading && <p className="loading">Analizando inventario...</p>}
          {recError && <p className="msg msg--error">{recError}</p>}
          {!recLoading && !recError && recs.length === 0 && (
            <p className="msg msg--info">No hay recomendaciones disponibles.</p>
          )}
          {!recLoading && !recError && recs.length > 0 && (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prioridad</th>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Bodega</th>
                    <th>Stock Actual</th>
                    <th>Reservado</th>
                    <th>Reorden</th>
                    <th>Recomendado</th>
                    <th>Razon</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.map((r) => (
                    <tr key={r.sku} className={
                      r.urgency === "CRITICAL" ? "row-danger" :
                      r.urgency === "HIGH" ? "row-warn" :
                      r.urgency === "MEDIUM" ? "row-info" : ""
                    }>
                      <td>
                        <span className={`badge badge--${r.urgency.toLowerCase()}`}>
                          {r.urgency === "CRITICAL" ? "CRITICO" :
                           r.urgency === "HIGH" ? "ALTO" :
                           r.urgency === "MEDIUM" ? "MEDIO" : "BAJO"}
                        </span>
                      </td>
                      <td><code>{r.sku}</code></td>
                      <td>{r.productName}</td>
                      <td>{r.warehouseCode}</td>
                      <td>{r.currentStock}</td>
                      <td>{r.reservedStock}</td>
                      <td>{r.reorderLevel}</td>
                      <td style={{ fontWeight: "bold", color: "#a78bfa" }}>{r.recommendedQuantity}</td>
                      <td style={{ fontSize: "0.85rem", maxWidth: "280px" }}>{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Formulario crear */}
      {showCreate && (
        <form onSubmit={handleCreate} className="form-card">
          <h3>Nuevo Item de Inventario</h3>
          {formMsg.text && <p className={`msg msg--${formMsg.type}`}>{formMsg.text}</p>}
          <div className="form-grid">
            <label>SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" /></label>
            <label>Nombre del Producto<input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Producto A" /></label>
            <label>Codigo de Bodega<input value={form.warehouseCode} onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })} placeholder="BODEGA-01" /></label>
            <label>Cantidad Inicial<input type="number" min="0" value={form.initialQuantity} onChange={(e) => setForm({ ...form, initialQuantity: e.target.value })} /></label>
            <label>Nivel de Reorden<input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></label>
          </div>
          <button type="submit" className="btn-primary" disabled={formLoading}>
            {formLoading ? "Creando..." : "Crear Item"}
          </button>
        </form>
      )}

      {loading && <p className="loading">Cargando inventario...</p>}
      {error && <p className="msg msg--error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th><th>Producto</th><th>Bodega</th><th>Disponible</th><th>Reservado</th><th>Nivel Reorden</th><th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr><td colSpan="7" className="empty-row">No hay items en inventario</td></tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.sku} className={item.availableQuantity <= item.reorderLevel ? "row-warn" : ""}>
                    <td><code>{item.sku}</code></td>
                    <td>{item.productName}</td>
                    <td>{item.warehouseCode}</td>
                    <td>{item.availableQuantity}</td>
                    <td>{item.reservedQuantity}</td>
                    <td>{item.reorderLevel}</td>
                    <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("es-CL") : "—"}</td>
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

export default InventoryPage;