import { defineStore } from "pinia";
import { useApi } from "~/composables/useApi";
import { useSwal } from "~/composables/useSwal";

export interface Role {
    id: string;
    name: string;
    description: string;
}

export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    roleId: string;
    status: string;
    role: Role | string;
    avatar?: string;
    organizationId?: number | null;
    institutionId?: number | null;
    personId?: number | null;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    menus?: Array<any>;
    permissions?: Array<any>;
    isAuthenticated: boolean;
    loading: boolean;
    isLoggingOut: boolean;
}

export const useAuthStore = defineStore("auth", {
    state: (): AuthState => ({
        user: null,
        token: null,
        menus: [],
        permissions: [],
        isAuthenticated: false,
        loading: false,
        isLoggingOut: false,
    }),

    getters: {
        getUser: (state) => state.user,
        getToken: (state) => state.token,
        getMenus: (state) => state.menus,
        getPermissions: (state) => state.permissions,
        isLoggedIn: (state) => state.isAuthenticated && !!state.token,
        getUserRole: (state) => {
            if (state.user?.role && typeof state.user.role === 'object') {
                // @ts-ignore
                return state.user.role.name || "guest";
            }
            return state.user?.role || "guest";
        },
        getMainPageLink: (state): string => {
            if (state.menus && state.menus.length > 0) {
                for (const menu of state.menus) {
                    if (menu.mainPage && menu.link) return menu.link;
                    if (menu.children) {
                        for (const child of menu.children) {
                            if (child.mainPage && child.link) return child.link;
                        }
                    }
                }
            }
            return "/dashboard";
        },
    },

    actions: {
        async login(username: string, password: string) {
            this.loading = true;
            try {
                const api = useApi();
                const res: any = await api.post("/user/login", {
                    username,
                    password
                });


                const data = res.data || res;
                const accessToken = data.token?.accessToken || data.token;
                const userData = data.user;

                if (accessToken && userData) {
                    // const { $firebase } = useNuxtApp() as any;

                    const config = useRuntimeConfig();

                    // Set maxAge for role security to 1 year
                    const maxAge = userData.roleId === "HA03"
                        ? 60 * 60 * 24 * 365
                        : Number(config.public.tokenMaxAge) || 60 * 60 * 24 * 7;

                    const tokenCookie = useCookie(config.public.tokenKey, {
                        maxAge: maxAge,
                        path: "/",
                        sameSite: "lax" as const,
                    });
                    tokenCookie.value = accessToken;

                    this.token = accessToken;
                    this.user = userData;
                    this.isAuthenticated = true;

                    if (this.user?.roleId) {
                        await this.loadAuthMenu({ roleId: this.user.roleId });
                    }
                    
                    if (typeof window !== "undefined") {
                        navigateTo(this.getMainPageLink || "/dashboard", { external: true });
                    }
                }
            } catch (error: any) {
                this.logout();
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async logout() {
            if (this.isLoggingOut) return;
            this.isLoggingOut = true;

            const config = useRuntimeConfig();
            const router = useRouter();
            const tokenCookie = useCookie(config.public.tokenKey);

            tokenCookie.value = null;
            this.user = null;
            this.token = null;
            this.isAuthenticated = false;
            this.menus = [];
            this.permissions = [];
            this.isLoggingOut = false;
            router.push("/login");
        },

        setUser(user: User) {
            this.user = user;
        },

        setToken(token: string) {
            const config = useRuntimeConfig();

            const maxAge = this.user?.roleId === "HA03"
                ? 60 * 60 * 24 * 365
                : Number(config.public.tokenMaxAge) || 60 * 60 * 24 * 7;

            const tokenCookie = useCookie(config.public.tokenKey, {
                maxAge: maxAge,
                path: "/",
                sameSite: "lax" as const,
            });
            tokenCookie.value = token;

            this.token = token;
            this.isAuthenticated = true;
        },

        syncFromCookies() {
            const config = useRuntimeConfig();
            const tokenCookie = useCookie(config.public.tokenKey);
            if (tokenCookie.value && !this.token) {
                this.token = tokenCookie.value;
                this.isAuthenticated = true;
            }
        },

        async checkAuth() {
            const config = useRuntimeConfig();
            const tokenCookie = useCookie(config.public.tokenKey);
            if (tokenCookie.value && !this.token) {
                this.token = tokenCookie.value;
                this.isAuthenticated = true;
            }

            if (!this.token) {
                return false;
            }
            return this.isAuthenticated;
        },

        async loadAuthMenu(payload: any) {
            let permissions: any = [];
            const api = useApi();
            await api.get("/menu-role", {
                params: {
                    roleId: payload.roleId,
                    commodityId: payload.commodityId,
                },
            })
                .then((res: any) => {
                    const data = res.data || [];
                    this.menus = data;
                    data.forEach((el: any) => {
                        if (el.permissionList) {
                            el.permissionList.forEach((els: any) => {
                                permissions.push(els);
                            });
                        }

                        if (el.children) {
                            el.children.forEach((el2: any) => {
                                if (el2.permissionList) {
                                    el2.permissionList.forEach((els2: any) => {
                                        permissions.push(els2);
                                    });
                                }
                            });
                        }
                    });

                    this.permissions = permissions;
                })
                .catch((err) => {
                    if (err.data) {
                        useSwal().toast(err.data.message, 'error');
                    }
                    return err;
                });
        },
    },

    persist: {
        key: "auth",
        storage: typeof window !== "undefined" ? localStorage : undefined,
        pick: ["user", "isAuthenticated", "menus", "permissions"],
    },
});
