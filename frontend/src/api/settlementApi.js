import { api } from "./client";

export const settlementApi = {
  list: () => api.get("/settlement/settlements/"),
};
