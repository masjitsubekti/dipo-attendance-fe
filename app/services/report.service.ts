import { useApi } from "~/composables/useApi";

const reportService = () => {
  const api = useApi();

  async function getEmployeeRecap(params: { personId: number | string; month?: number; year?: number; institutionId?: number | string }) {
    return api.get("/report/employee-recap", {
      params,
    });
  }

  return {
    getEmployeeRecap,
  };
};

export default reportService;
