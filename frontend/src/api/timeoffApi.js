import { api } from "./client";

export const timeoffApi = {
  listTypes: () => api.get("/timeoff/timeoff-types/"),
  createType: (data) => api.post("/timeoff/timeoff-types/", data),

  listAllocations: () => api.get("/timeoff/allocations/"),
  createAllocation: (data) => api.post("/timeoff/allocations/", data),

  listRequests: () => api.get("/timeoff/timeoff-requests/"),
  createRequest: (data) => api.post("/timeoff/timeoff-requests/", data),
  approveRequest: (id) => api.post(`/timeoff/timeoff-requests/${id}/approve/`, {}),
  refuseRequest: (id) => api.post(`/timeoff/timeoff-requests/${id}/refuse/`, {}),
};
