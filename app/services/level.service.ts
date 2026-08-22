import { useApi } from "~/composables/useApi";

const levelService = () => {
  const url = "/master/level";
  const api = useApi();

  async function retrieveAll() {
    return api.get(`${url}/all`);
  }

  return {
    retrieveAll,
  };
};

export default levelService;
