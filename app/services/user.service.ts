import { useApi } from "~/composables/useApi";

const userService = () => {
    const url = "/user";
    const api = useApi();

    async function retrieve(req: any) {
        return api.get(url, {
            params: req
        });
    }

    async function retrieveAll(req: any) {
        return api.get(`${url}/all`, {
            params: req
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

    async function updatePhoto(req: any) {
        return api.post(`${url}/update-foto`, req);
    }

    async function updateProfile(id: any, req: any) {
        return api.put(`${url}/profile/${id}`, req);
    }

    async function getProfile(id: any) {
        return api.get(`${url}/profile/${id}`);
    }

    async function resetPassword(req: any) {
        return api.put(`${url}/password/reset/${req.id}`, req);
    }

    async function sendResetLink(payload: any) {
        return api.post(`${url}/forgot-password`, payload);
    }

    async function resetPasswordSubmit(req: any) {
        return api.post(`${url}/reset-password`, req);
    }

    async function updatePassword(id: any, req: any, opts?: any) {
        return api.put(`${url}/password/${id}`, req, opts);
    }

    async function updateActiveStatus(req: any) {
        return api.put(`${url}/active-status/${req.id}`, req);
    }

    async function getCaptcha() {
        return api.get(`${url}/captcha`);
    }

    async function refreshCaptcha(id: string) {
        return api.get(`${url}/captcha/refresh/${id}`);
    }

    async function captchaImage(id: string) {
        return api.get(`${url}/captcha/image/${id}`);
    }

    return {
        retrieve,
        retrieveAll,
        retrieveById,
        save,
        create,
        update,
        destroy,
        updatePhoto,
        updateProfile,
        getProfile,
        resetPassword,
        sendResetLink,
        resetPasswordSubmit,
        updatePassword,
        updateActiveStatus,
        getCaptcha,
        refreshCaptcha,
        captchaImage
    };
}

export default userService;
