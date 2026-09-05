import { api } from "./client";

// Every function here maps 1:1 to a real, already-tested endpoint in
// payroll/urls.py. Nothing here is speculative.

export const payrollApi = {
  // Salary Rules
  listSalaryRules: () => api.get("/payroll/salary-rules/"),
  createSalaryRule: (data) => api.post("/payroll/salary-rules/", data),
  updateSalaryRule: (id, data) => api.patch(`/payroll/salary-rules/${id}/`, data),
  deleteSalaryRule: (id) => api.delete(`/payroll/salary-rules/${id}/`),

  // Salary Structures
  listSalaryStructures: () => api.get("/payroll/salary-structures/"),
  createSalaryStructure: (data) => api.post("/payroll/salary-structures/", data),
  updateSalaryStructure: (id, data) => api.patch(`/payroll/salary-structures/${id}/`, data),

  // Payruns
  listPayruns: () => api.get("/payroll/payruns/"),
  getPayrun: (id) => api.get(`/payroll/payruns/${id}/`),
  createPayrun: (data) => api.post("/payroll/payruns/", data),
  selectEmployees: (id, employeeIds) =>
    api.post(`/payroll/payruns/${id}/select_employees/`, { employee_ids: employeeIds }),
  computePayrun: (id) => api.post(`/payroll/payruns/${id}/compute/`, {}),
  sendPayslips: (id) => api.post(`/payroll/payruns/${id}/send_payslips/`, {}),

  // Payslips
  listPayslips: () => api.get("/payroll/payslips/"),
  getPayslip: (id) => api.get(`/payroll/payslips/${id}/`),
  downloadPayslipPdf: async (id) => {
    const blob = await api.getBlob(`/payroll/payslips/${id}/pdf/`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip_${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

// core.Employee — needed for the wizard's employee-select step.
export const coreApi = {
  listEmployees: () => api.get("/employees/"),
};
