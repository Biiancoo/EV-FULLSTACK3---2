import { useState } from "react";
import { login, register, saveLoginSession } from "../service/authService";

function LoginPage({ handleLoginSucces }) {
  const [mode, setMode] = useState("login");
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  function switchMode(m) {
    setMode(m);
    setMessage({ text: "", type: "" });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);
    try {
      const response = await login({ credential, password });
      saveLoginSession(response);
      handleLoginSucces();
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);
    try {
      await register({ username, email, password });
      setMessage({ text: "Cuenta creada. Ya puedes iniciar sesión.", type: "success" });
      switchMode("login");
      setCredential(username);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">📦</span>
          <h1>SmartLogix</h1>
          <p>Sistema de Logística Inteligente</p>
        </div>

        <div className="login-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>
            Iniciar Sesión
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>
            Registrarse
          </button>
        </div>

        {message.text && (
          <p className={`login-msg login-msg--${message.type}`}>{message.text}</p>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Usuario o Email
              <input
                type="text"
                placeholder="usuario o correo@email.com"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <label>
              Nombre de usuario
              <input
                type="text"
                placeholder="mi_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                placeholder="correo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                placeholder="mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
