import { useAuthStore } from "~/stores/auth";
import { useSwal } from "./useSwal";
import { useToast } from "./useToast";

export function useApi() {
    const authStore = useAuthStore();
    const router = useRouter();
    const toast = useToast();

    const config = useRuntimeConfig();
    const tokenCookie = useCookie(config.public.tokenKey);

    const api = $fetch.create({
        baseURL: "/api",
        headers: {
            Accept: "application/json",
        },
        onRequest({ options }) {
            const headers = new Headers(options.headers);
            const token = tokenCookie.value || authStore.token;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }

            options.headers = headers;
        },
        async onResponseError({ response, options, error }: any) {
            if (options?.ignoreError) return;

            const status = response?.status || 0;
            const errMsg = response?._data?.error || response?._data?.message || error?.message || "Unable to connect to server";

            if (status === 401) {
                authStore.logout();
            } else if (status === 403) {
                toast.error("Access Denied", "You don't have permission.");
            } else if (status === 422) {
                toast.warning("Validation Error", errMsg);
            } else if (status >= 500 || status === 0) {
                useSwal().toast(errMsg, "error");
            } else {
                toast.error("Error", errMsg);
            }
        },
    });

    return {
        get: <T>(url: string, opts?: any) => api<T>(url, { method: "GET", ...opts }),
        post: <T>(url: string, body?: any, opts?: any) => api<T>(url, { method: "POST", body, ...opts }),
        put: <T>(url: string, body?: any, opts?: any) => api<T>(url, { method: "PUT", body, ...opts }),
        delete: <T>(url: string, opts?: any) => api<T>(url, { method: "DELETE", ...opts }),
        fetch: api
    };
}

export function useApiFetch<T>(endpoint: string) {
    const authStore = useAuthStore();
    const config = useRuntimeConfig();
    const tokenCookie = useCookie(config.public.tokenKey);

    return useFetch<T>(endpoint, {
        baseURL: "/api",
        onRequest({ options }) {
            const token = tokenCookie.value || authStore.token;
            if (token) {
                options.headers.set("Authorization", `Bearer ${token}`);
            }
        }
    });
}
