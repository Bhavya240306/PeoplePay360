import { api } from "./client";

export const coreApi = {
  listEmployees: () => api.get("/employees/"),
  getEmployee: (id) => api.get(`/employees/${id}/`),
  createEmployee: (data) => api.post("/employees/", data),
  updateEmployee: (id, data) => api.patch(`/employees/${id}/`, data),

  listContracts: (employeeId) =>
    api.get(employeeId ? `/contracts/?employee=${employeeId}` : "/contracts/"),
  createContract: (data) => api.post("/contracts/", data),
  updateContract: (id, data) => api.patch(`/contracts/${id}/`, data),

  listAttendance: (employeeId) =>
    api.get(employeeId ? `/attendance/?employee=${employeeId}` : "/attendance/"),
  createAttendance: (data) => api.post("/attendance/", data),
  updateAttendance: (id, data) => api.patch(`/attendance/${id}/`, data),

  listSchedules: (employeeId) =>
    api.get(employeeId ? `/schedules/?employee=${employeeId}` : "/schedules/"),
  createSchedule: (data) => api.post("/schedules/", data),
  updateSchedule: (id, data) => api.patch(`/schedules/${id}/`, data),

  // Self-service (Employee-facing) endpoints
  getMySchedule: () => api.get("/schedules/mine/"),
  getMyContract: () => api.get("/contracts/mine/"),
  getMyAttendance: () => api.get("/attendance/mine/"),
  getMyAttendanceSummary: (month) =>
    api.get(month ? `/attendance/summary/?month=${month}` : "/attendance/summary/"),
  getMyQrCodeBlob: () => api.getBlob("/attendance/my-qr-code/"),
};
