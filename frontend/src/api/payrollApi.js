import { api } from "./client";

export const payrollApi = {
  listSalaryRules: () => api.get("/payroll/salary-rules/"),
  createSalaryRule: (data) => api.post("/payroll/salary-rules/", data),

  listSalaryStructures: () => api.get("/payroll/salary-structures/"),
  createSalaryStructure: (data) => api.post("/payroll/salary-structures/", data),

  listPayruns: () => api.get("/payroll/payruns/"),
  getPayrun: (id) => api.get(`/payroll/payruns/${id}/`),
  createPayrun: (data) => api.post("/payroll/payruns/", data),
  selectEmployees: (id, employeeIds) =>
    api.post(`/payroll/payruns/${id}/select_employees/`, { employee_ids: employeeIds }),
  computePayrun: (id) => api.post(`/payroll/payruns/${id}/compute/`, {}),
  sendPayslips: (id) => api.post(`/payroll/payruns/${id}/send_payslips/`, {}),
  generateMonthlyPayruns: () => api.post("/payroll/payruns/generate_monthly/", {}),

  listPayslips: () => api.get("/payroll/payslips/"),
  sendPayslip: (id) => api.post(`/payroll/payslips/${id}/send/`, {}),
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
