import { httpRequest } from "./httpClient";

// POST /api/chat/ask
export function askChatbotRequest(question, auth) {
  return httpRequest("/api/chat/ask", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}
