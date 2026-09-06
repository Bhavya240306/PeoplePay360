import { api } from "./client";

export const dashboardApi = {
  summary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/dashboard/summary/${qs ? `?${qs}` : ""}`);
  },
};
