import { useSwal } from "~/composables/useSwal";
import { useAuthStore } from "~/stores/auth";

// Track if menus have been loaded in this session
let menusLoadedThisSession = false;

export default defineNuxtRouteMiddleware(async (to, from) => {
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
    // Use Promise.race timeout (3s) so middleware is never blocked if API/BE is down
    if (authStore.user?.roleId && !menusLoadedThisSession) {
        try {
            await Promise.race([
                authStore.loadAuthMenu({
                    roleId: authStore.user.roleId,
                }),
                new Promise((resolve) => setTimeout(resolve, 3000)),
            ]);
        } catch (e) {
            // ignore error if API is down
        }
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
    const requiredPermission = to.meta.permission as string | string[] | undefined;

    if (requiredPermission) {
        const permissions = authStore.permissions || [];
        if (permissions.length === 0 && !menusLoadedThisSession) {
            // Allow first navigation after login - permissions will be checked on next navigation
            return;
        }

        let hasPermission = false;
        if (Array.isArray(requiredPermission)) {
            hasPermission = requiredPermission.some((p) => permissions.includes(p));
        } else {
            hasPermission = permissions.includes(requiredPermission);
        }

        if (!hasPermission) {
            useSwal().toast("Anda tidak memiliki akses ke halaman ini", 'error');

            // Detect if navigation is a jump path (direct URL entry / refresh) vs in-app navigation (button click)
            const isJumpPath = !from || !from.name || from.matched.length === 0;

            if (isJumpPath) {
                // Direct URL jump path without permission -> Auto Logout
                return navigateTo("/logout");
            } else {
                // In-app button click without permission -> Redirect to previous page or "/", NO logout
                const fallbackUrl = (from.path && from.path !== to.path) ? from.path : "/";
                return navigateTo(fallbackUrl);
            }
        }
    }
});

