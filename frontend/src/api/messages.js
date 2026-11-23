import { get, patch, post } from "./http";

export function getConversations() {
  return get("/messages");
}

export function getHistory(internshipId, userId) {
  return get(`/messages/history?internshipId=${internshipId}&userId=${userId}`);
}

export function sendMessage(payload) {
  return post("/messages", payload);
}

export function markConversationRead(internshipId, userId) {
  return patch("/messages/read", { internshipId, userId });
}