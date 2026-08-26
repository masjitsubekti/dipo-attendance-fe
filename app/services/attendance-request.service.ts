import { useApi } from "~/composables/useApi";

const attendanceRequestService = () => {
  const url = "/attendance-request";
  const api = useApi();

  async function retrieve(req: any) {
    return api.get(url, {
      params: req,
    });
  }

  async function retrieveById(id: any) {
    return api.get(`${url}/${id}`);
  }

  function buildPayload(req: any, file?: File | null) {
    if (!file) return req;
    const formData = new FormData();
    Object.keys(req).forEach((key) => {
      if (req[key] !== null && req[key] !== undefined) {
        formData.append(key, req[key]);
      }
    });
    formData.append("file", file);
    return formData;
  }

  async function save(req: any, file?: File | null) {
    if (req.id) {
      return update(req, file);
    } else {
      return create(req, file);
    }
  }

  async function create(req: any, file?: File | null) {
    const payload = buildPayload(req, file);
    return api.post(url, payload);
  }

  async function update(req: any, file?: File | null) {
    const payload = buildPayload(req, file);
    return api.put(`${url}/${req.id}`, payload);
  }

  async function updateStatus(id: any, status: string, approvalNote?: string) {
    return api.put(`${url}/${id}/status`, { status, approvalNote });
  }

  async function destroy(id: any) {
    return api.delete(`${url}/${id}`);
  }

  return {
    retrieve,
    retrieveById,
    save,
    create,
    update,
    updateStatus,
    destroy,
  };
};

export default attendanceRequestService;
