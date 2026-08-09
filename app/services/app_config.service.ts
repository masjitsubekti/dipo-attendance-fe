import { useApi } from "~/composables/useApi";

const appConfigService = () => {
  const url = "/app-config";
  const api = useApi();

  async function retrieveById(id: any) {
    return api.get(`${url}/${id}`);
  }

  async function getPublicAppConfig(id: any) {
    return api.get(`${url}/public/${id}`);
  }

  async function uploadFile(req: any) {
    return api.post(`${url}/upload`, req);
  }

  async function update(req: any) {
    return api.put(`${url}/${req.id}`, req);
  }

  return {
    retrieveById,
    getPublicAppConfig,
    update,
    uploadFile,
  };
};

export default appConfigService;
