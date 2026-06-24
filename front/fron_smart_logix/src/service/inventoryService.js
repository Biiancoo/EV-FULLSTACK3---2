import {
  getInventoryRequest,
  createInventoryItemRequest,
  checkAvailabilityRequest,
  reserveItemRequest,
  releaseItemRequest,
  dispatchItemRequest,
  getRecommendationsRequest,
} from "../api/inventoryApi";
import { getRequiredAuthorizationHeader } from "./authService";

export function getInventory() {
  return getInventoryRequest(getRequiredAuthorizationHeader());
}

export function createInventoryItem(data) {
  return createInventoryItemRequest(data, getRequiredAuthorizationHeader());
}

export function checkAvailability(sku, quantity) {
  return checkAvailabilityRequest(sku, quantity, getRequiredAuthorizationHeader());
}

export function reserveItem(sku, quantity) {
  return reserveItemRequest(sku, quantity, getRequiredAuthorizationHeader());
}

export function releaseItem(sku, quantity) {
  return releaseItemRequest(sku, quantity, getRequiredAuthorizationHeader());
}

export function dispatchItem(sku, quantity) {
  return dispatchItemRequest(sku, quantity, getRequiredAuthorizationHeader());
}

export function getRecommendations() {
  return getRecommendationsRequest(getRequiredAuthorizationHeader());
}
