import { useApi } from "~/composables/useApi";

const attendanceManualService = () => {
  const url = "/attendance-manual";
  const api = useApi();

  async function retrieve(req: any) {
    return api.get(url, {
      params: req,
    });
  }

  async function retrieveById(id: any) {
    return api.get(`${url}/${id}`);
  }

  async function save(req: any) {
    if (req.id) {
      return update(req);
    } else {
      return create(req);
    }
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

  async function bulkDestroy(ids: any[]) {
    return api.post(`${url}/bulk-delete`, { ids });
  }

  return {
    retrieve,
    retrieveById,
    save,
    create,
    update,
    destroy,
    bulkDestroy,
  };
};

export default attendanceManualService;
