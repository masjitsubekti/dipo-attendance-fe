import { useApi } from "~/composables/useApi";

const logActivityService = () => {
    const url = "/activity-log?";
    const api = useApi();

    async function retrieve(req: any) {
        return api.get(url, {
            params: req,
        });
    }

    return {
        retrieve,
    };
};

export default logActivityService;
