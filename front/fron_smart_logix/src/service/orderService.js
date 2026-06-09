import {
  getOrdersRequest,
  getOrderByNumberRequest,
  createOrderRequest,
} from "../api/orderApi";
import { getRequiredAuthorizationHeader } from "./authService";

export function getOrders() {
  return getOrdersRequest(getRequiredAuthorizationHeader());
}

export function getOrderByNumber(orderNumber) {
  return getOrderByNumberRequest(orderNumber, getRequiredAuthorizationHeader());
}

export function createOrder(data) {
  return createOrderRequest(data, getRequiredAuthorizationHeader());
}
