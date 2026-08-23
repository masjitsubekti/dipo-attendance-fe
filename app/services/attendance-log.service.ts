import { useApi } from "~/composables/useApi";

const attendanceLogService = () => {
    const url = "/attendance/logs";
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

export default attendanceLogService;
