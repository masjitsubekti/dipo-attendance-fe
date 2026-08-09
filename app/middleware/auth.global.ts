import { useSwal } from "~/composables/useSwal";
import { useAuthStore } from "~/stores/auth";

// Track if menus have been loaded in this session
let menusLoadedThisSession = false;

export default defineNuxtRouteMiddleware(async (to) => {
    // Skip middleware on server-side to avoid hydration issues
    // Pinia persistence only works on client-side
    if (import.meta.server) {
        return;
    }

    const config = useRuntimeConfig();
    const authStore = useAuthStore();
    const tokenCookie = useCookie(config.public.tokenKey);

    // Sync token from cookies to store if not already synced
    if (tokenCookie.value && !authStore.token) {
        authStore.token = tokenCookie.value;
        authStore.isAuthenticated = true;
    }

    // If user is already authenticated and trying to access login, redirect to dashboard
    const hasToken = !!authStore.token || !!tokenCookie.value;
    const isAuthenticated = authStore.isAuthenticated && hasToken;

    if (isAuthenticated && to.path === "/login") {
        return navigateTo(authStore.getMainPageLink || "/", { external: true });
    }

    const publicRoutes = config.public.publicRoutes as string[];
    if (publicRoutes.includes(to.path)) {
        menusLoadedThisSession = false;
        return;
    }


    if (!isAuthenticated) {
        menusLoadedThisSession = false;
        return navigateTo("/login", { external: true });
    }

    // Load menus on first navigation of this session (after page refresh or login)
    // This ensures menus are always fresh from API
    if (authStore.user?.roleId && !menusLoadedThisSession) {
        await authStore.loadAuthMenu({
            roleId: authStore.user.roleId,
        });
        menusLoadedThisSession = true;
    }

    // Redirect root path to user's main page
    if (to.path === "/") {
        const mainPage = authStore.getMainPageLink;
        if (mainPage && mainPage !== "/") {
            return navigateTo(mainPage, { external: true });
        }
    }

    // ============ RBAC Permission Check ============
    // Check if route has permission requirement in meta
    const requiredPermission = to.meta.permission as string | undefined;

    if (requiredPermission) {
        const permissions = authStore.permissions || [];
        if (permissions.length === 0 && !menusLoadedThisSession) {
            // Allow first navigation after login - permissions will be checked on next navigation
            return;
        }

        const hasPermission = permissions.includes(requiredPermission);

        if (!hasPermission) {
            useSwal().toast("Anda tidak memiliki akses ke halaman ini", 'error');
            return navigateTo("/logout");
        }
    }
});

