import { httpRequest } from "./httpClient";

// GET /api/inventory/items
export function getInventoryRequest(auth) {
  return httpRequest("/api/inventory/items", { headers: { Authorization: auth } });
}

// GET /api/inventory/items/{sku}
export function getInventoryItemRequest(sku, auth) {
  return httpRequest(`/api/inventory/items/${sku}`, { headers: { Authorization: auth } });
}

// POST /api/inventory/items
export function createInventoryItemRequest(data, auth) {
  return httpRequest("/api/inventory/items", {
    method: "POST",
    headers: { Authorization: auth },
    body: JSON.stringify(data),
  });
}

// GET /api/inventory/items/{sku}/availability?quantity=N
export function checkAvailabilityRequest(sku, quantity, auth) {
  return httpRequest(`/api/inventory/items/${sku}/availability?quantity=${quantity}`, {
    headers: { Authorization: auth },
  });
}

// POST /api/inventory/items/{sku}/reserve?quantity=N
export function reserveItemRequest(sku, quantity, auth) {
  return httpRequest(`/api/inventory/items/${sku}/reserve?quantity=${quantity}`, {
    method: "POST",
    headers: { Authorization: auth },
  });
}

// POST /api/inventory/items/{sku}/release?quantity=N
export function releaseItemRequest(sku, quantity, auth) {
  return httpRequest(`/api/inventory/items/${sku}/release?quantity=${quantity}`, {
    method: "POST",
    headers: { Authorization: auth },
  });
}

// POST /api/inventory/items/{sku}/dispatch?quantity=N
export function dispatchItemRequest(sku, quantity, auth) {
  return httpRequest(`/api/inventory/items/${sku}/dispatch?quantity=${quantity}`, {
    method: "POST",
    headers: { Authorization: auth },
  });
}
