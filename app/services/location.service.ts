import { useApi } from "~/composables/useApi";

const locationService = () => {
  const url = "/master/location";
  const api = useApi();

  async function retrieve(req: any) {
    return api.get(url, { params: req });
  }

  async function retrieveAll(req?: any) {
    return api.get(`${url}/all`, { params: req });
  }

  async function retrieveById(id: any) {
    return api.get(`${url}/${id}`);
  }

  async function save(req: any) {
    return req.id ? update(req) : create(req);
  }

  async function create(req: any) {
    return api.post(url, req);
  }

  async function update(req: any) {
    return api.put(`${url}/${req.id}`, req);
  }

  async function destroy(id: any) {
    return api.delete(`${url}/${id}`);
  }

  return { retrieve, retrieveAll, retrieveById, save, create, update, destroy };
};

export default locationService;
