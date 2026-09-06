import { api } from "./client";

export const notificationsApi = {
  list: () => api.get("/notifications/notifications/"),
  unreadCount: () => api.get("/notifications/notifications/unread_count/"),
  markRead: (id) => api.post(`/notifications/notifications/${id}/mark_read/`, {}),
};
