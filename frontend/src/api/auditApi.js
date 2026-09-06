import { api } from "./client";

export const auditApi = {
  history: (modelName, recordId) =>
    api.get(`/audit/logs/?model_name=${modelName}&record_id=${recordId}`),
};
