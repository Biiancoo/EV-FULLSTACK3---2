import { askChatbotRequest } from "../api/chatbotApi";
import { getRequiredAuthorizationHeader } from "./authService";

export function askChatbot(question) {
  return askChatbotRequest(question, getRequiredAuthorizationHeader());
}
