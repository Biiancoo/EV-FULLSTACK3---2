import { httpRequest } from "./httpClient";

// GET /api/orders
export function getOrdersRequest(auth) {
  return httpRequest("/api/orders", { headers: { Authorization: auth } });
}

// GET /api/orders/{orderNumber}
export function getOrderByNumberRequest(orderNumber, auth) {
  return httpRequest(`/api/orders/${orderNumber}`, { headers: { Authorization: auth } });
}

// POST /api/orders
export function createOrderRequest(data, auth) {
  return httpRequest("/api/orders", {
    method: "POST",
    headers: { Authorization: auth },
    body: JSON.stringify(data),
  });
}
