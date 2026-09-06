import { api } from "./client";

export const accountsApi = {
  listUsers: () => api.get("/accounts/users/"),
  createUser: (data) => api.post("/accounts/users/", data),
  me: () => api.get("/accounts/users/me/"),
};
