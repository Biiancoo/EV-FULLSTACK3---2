const API_URL_BASE = "http://localhost:8080";

/**
 * Cliente HTTP centralizado.
 * Todos los módulos api/ lo usan — ninguno llama fetch() directamente.
 * Así si cambia el backend (URL, headers globales) se cambia un solo lugar.
 */
export async function httpRequest(path, options = {}) {
  const response = await fetch(`${API_URL_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Error ${response.status}: ${response.statusText}`);
  }

  return data;
}

export { API_URL_BASE };
