import {
  getShipmentRequest,
  getShipmentByTrackingRequest,
  createShipmentRequest,
  updateShipmentStatusRequest,
} from "../api/shipmentApi";
import { getRequiredAuthorizationHeader } from "./authService";

export function getShipment() {
  return getShipmentRequest(getRequiredAuthorizationHeader());
}

export function getShipmentByTracking(trackingCode) {
  return getShipmentByTrackingRequest(trackingCode, getRequiredAuthorizationHeader());
}

export function createShipment(data) {
  return createShipmentRequest(data, getRequiredAuthorizationHeader());
}

export function updateShipmentStatus(trackingCode, value) {
  return updateShipmentStatusRequest(trackingCode, value, getRequiredAuthorizationHeader());
}
