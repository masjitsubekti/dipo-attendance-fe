import { useApi } from "~/composables/useApi";

const dashboardService = () => {
  const url = "/dashboard";
  const api = useApi();

  async function retrieveWorkArea(req: any) {
    return api.get(`${url}/work-area`, {
      params: req,
    });
  }

  async function retrieveWorkAreaPublic(req: any, customHeaders: any = {}) {
    return api.get(`${url}/work-area`, {
      params: req,
      headers: customHeaders,
    });
  }

  async function retrieveMapArea(req: any) {
    return api.get(`${url}/map-area`, {
      params: req,
    });
  }

  async function retrieveMapAreaPublic(req: any, customHeaders: any = {}) {
    return api.get(`${url}/map-area`, {
      params: req,
      headers: customHeaders,
    });
  }

  async function retrieveSummary(req: any) {
    return api.get(`${url}/summary`, {
      params: req,
    });
  }

  async function retrieveMetricDetails(req: any) {
    return api.get(`${url}/metric-details`, {
      params: req,
    });
  }

  async function retrieveChartDetails(req: any) {
    return api.get(`${url}/chart-details`, {
      params: req,
    });
  }

  async function retrieveARAging(req: any) {
    return api.get(`${url}/ar-aging`, {
      params: req,
    });
  }

  async function retrieveOutstandingInvoices(req: any) {
    return api.get(`${url}/outstanding-invoices`, {
      params: req,
    });
  }

  async function retrievePeakHours(req: any) {
    return api.get(`${url}/peak-hours`, {
      params: req,
    });
  }

  async function retrievePersonnelComposition(req: any) {
    return api.get(`${url}/personnel-composition`, {
      params: req,
    });
  }

  async function retrievePersonnelCompositionPublic(req: any, customHeaders: any = {}) {
    return api.get(`${url}/personnel-composition`, {
      params: req,
      headers: customHeaders,
    });
  }

  async function retrievePersonnelDept(req: any) {
    return api.get(`${url}/personnel-dept-active`, {
      params: req,
    });
  }

  async function retrievePersonnelSection(req: any) {
    return api.get(`${url}/personnel-section-active`, {
      params: req,
    });
  }

  async function retrieveGateMonitoring(req: any) {
    return api.get(`${url}/gate-monitoring`, {
      params: req,
    });
  }

  return {
    retrieveWorkArea,
    retrieveWorkAreaPublic,
    retrieveMapArea,
    retrieveMapAreaPublic,
    retrieveSummary,
    retrieveMetricDetails,
    retrieveChartDetails,
    retrieveARAging,
    retrieveOutstandingInvoices,
    retrievePeakHours,
    retrievePersonnelComposition,
    retrievePersonnelCompositionPublic,
    retrievePersonnelDept,
    retrievePersonnelSection,
    retrieveGateMonitoring,
  };
};

export default dashboardService;
