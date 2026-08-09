import { useApi } from "~/composables/useApi";

const notificationService = () => {
    const url = "/notification";
    const api = useApi();

    async function retrieveByUser(req: any) {
        return api.get(`${url}/user`, {
            params: req,
        });
    }

    async function read(req: any) {
        return api.put(`${url}/read`, req);
    }

    return {
        retrieveByUser,
        read,
    };
};

export default notificationService;
