import { get, patch, post } from "./http";

// Student submits a complaint
export function createComplaint(payload) {
  return post("/complaints", payload);
}

// Student views their complaints
export function getMyComplaints() {
  return get("/complaints/my");
}

// Admin views all complaints
export function getAllComplaints() {
  return get("/complaints");
}

// Admin updates complaint status and response
export function updateComplaint(id, payload) {
  return patch(`/complaints/${id}`, payload);
}