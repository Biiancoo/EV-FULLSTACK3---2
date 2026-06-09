import { loginRequest, registerRequest } from "../api/authApi";

// --- Lógica de negocio: validaciones antes de llamar al API ---

export async function login({ credential, password }) {
  const cleanCredential = credential.trim();
  const cleanPassword = password.trim();

  if (!cleanCredential || !cleanPassword) {
    throw new Error("Ingrese usuario y contraseña");
  }

  return loginRequest({ credential: cleanCredential, password: cleanPassword });
}

export async function register({ username, email, password }) {
  if (!username.trim() || !email.trim() || !password.trim()) {
    throw new Error("Complete todos los campos");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  return registerRequest({ username: username.trim(), email: email.trim(), password });
}

// --- Manejo de sesión en localStorage ---

export function saveLoginSession(loginResponse) {
  if (!loginResponse?.token) {
    throw new Error("El backend no entregó token");
  }
  localStorage.setItem("token", loginResponse.token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      username: loginResponse.username,
      role: loginResponse.role,
      tokenType: loginResponse.tokenType,
      expiresInMs: loginResponse.expiresInMs,
    })
  );
}

export function getSaveToken() {
  return localStorage.getItem("token");
}

export function getSaveUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function getAuthorizationHeader() {
  const token = getSaveToken();
  const user = getSaveUser();
  if (!token) return null;
  const tokenType = user?.tokenType || "Bearer";
  return `${tokenType} ${token}`;
}

export function getRequiredAuthorizationHeader() {
  const header = getAuthorizationHeader();
  if (!header) throw new Error("No hay sesión activa");
  return header;
}

export function clearLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
