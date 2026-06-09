import { httpRequest } from "./httpClient";

// GET /api/shipments
export function getShipmentRequest(auth) {
  return httpRequest("/api/shipments", { headers: { Authorization: auth } });
}

// GET /api/shipments/{trackingCode}
export function getShipmentByTrackingRequest(trackingCode, auth) {
  return httpRequest(`/api/shipments/${trackingCode}`, { headers: { Authorization: auth } });
}

// POST /api/shipments
export function createShipmentRequest(data, auth) {
  return httpRequest("/api/shipments", {
    method: "POST",
    headers: { Authorization: auth },
    body: JSON.stringify(data),
  });
}

// PATCH /api/shipments/{trackingCode}/status?value=STATUS
export function updateShipmentStatusRequest(trackingCode, value, auth) {
  return httpRequest(`/api/shipments/${trackingCode}/status?value=${value}`, {
    method: "PATCH",
    headers: { Authorization: auth },
  });
}
