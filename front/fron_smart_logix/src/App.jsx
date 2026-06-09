import { useEffect, useState } from "react";
import "./App.css";
import LoginPage from "./pages/Login";
import ShipmentsPage from "./pages/Shipments";
import OrderPage from "./pages/Order";
import InventoryPage from "./pages/Inventory";
import { clearLogin, getSaveToken, getSaveUser } from "./service/authService";

const PRIVATE_ROUTER = [
  { key: "shipment", label: "📦 Envíos", hash: "#/shipment" },
  { key: "order", label: "🛒 Órdenes", hash: "#/order" },
  { key: "inventory", label: "🗃️ Inventario", hash: "#/inventory" },
];

function getRouteFromHash() {
  return window.location.hash.replace("#/", "") || "shipment";
}

function App() {
  const [isLogin, setIsLogin] = useState(Boolean(getSaveToken()));
  const [current, setCurrent] = useState(getRouteFromHash());

  useEffect(() => {
    function onHashChange() {
      setCurrent(getRouteFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function handleLoginSucces() {
    setIsLogin(true);
    window.location.hash = "#/shipment";
  }

  function handleLogout() {
    clearLogin();
    setIsLogin(false);
  }

  function renderPage() {
    if (current === "shipment") return <ShipmentsPage />;
    if (current === "order") return <OrderPage />;
    if (current === "inventory") return <InventoryPage />;
    return <p className="loading">Ruta no encontrada</p>;
  }

  if (!isLogin) {
    return <LoginPage handleLoginSucces={handleLoginSucces} />;
  }

  const user = getSaveUser();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>📦</span>
          <span>SmartLogix</span>
        </div>

        <nav className="sidebar-nav">
          {PRIVATE_ROUTER.map((route) => (
            <a
              key={route.key}
              href={route.hash}
              className={`nav-link ${current === route.key ? "active" : ""}`}
            >
              {route.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-role">{user?.role || "USER"}</span>
            <span className="user-name">{user?.username}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      <main className="app-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
