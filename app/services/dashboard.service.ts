import { useApi } from "~/composables/useApi";

const dashboardService = () => {
  const url = "/dashboard";
  const api = useApi();

  async function retrieveExecutiveSummary(req?: any) {
    return api.get(`${url}/executive-summary`, {
      params: req,
    });
  }

  async function retrieveTopLateEmployees(req?: any) {
    return api.get(`${url}/top-late-employees`, {
      params: req,
    });
  }

  return {
    retrieveExecutiveSummary,
    retrieveTopLateEmployees,
  };
};

export default dashboardService;
