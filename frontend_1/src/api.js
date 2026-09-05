const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Token ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

// Endpoints Person 1 owns: Employee, Contract, Attendance, Working Schedule.
// Swap these for the real Django URLs when the backend is wired up — every
// screen falls back to sample data if these calls fail, so the UI stays
// demoable offline.
export const endpoints = {
  employees: () => api.get("/employees/"),
  employee: (id) => api.get(`/employees/${id}/`),
  createEmployee: (data) => api.post("/employees/", data),
  updateEmployee: (id, data) => api.patch(`/employees/${id}/`, data),

  contracts: (employeeId) =>
    api.get(`/contracts/${employeeId ? `?employee=${employeeId}` : ""}`),
  createContract: (data) => api.post("/contracts/", data),
  updateContract: (id, data) => api.patch(`/contracts/${id}/`, data),

  attendance: (employeeId) =>
    api.get(`/attendance/${employeeId ? `?employee=${employeeId}` : ""}`),
  createAttendance: (data) => api.post("/attendance/", data),
  updateAttendance: (id, data) => api.patch(`/attendance/${id}/`, data),

  schedules: () => api.get("/schedules/"),
  createSchedule: (data) => api.post("/schedules/", data),
  updateSchedule: (id, data) => api.patch(`/schedules/${id}/`, data),
};
