import { useAuthStore } from "~/stores/auth";
import { useSwal } from "./useSwal";

export const usePermission = () => {
    const authStore = useAuthStore();

    // Check if user has specific permission (for UI show/hide)
    const hasPermission = (key: string): boolean => {
        const permissions = authStore.permissions || [];
        if (permissions.length === 0) return false;
        return permissions.includes(key);
    };

    // Check and redirect if no permission (for action validation)
    const checkPermission = (key: string) => {
        if (!hasPermission(key)) {
            useSwal().toast("Anda tidak memiliki akses untuk halaman ini", 'error');
            return navigateTo("/logout");
        }
        return true;
    };

    // Check multiple permissions (any of them)
    const hasAnyPermission = (keys: string[]): boolean => {
        return keys.some(key => hasPermission(key));
    };

    // Check multiple permissions (all of them)
    const hasAllPermissions = (keys: string[]): boolean => {
        return keys.every(key => hasPermission(key));
    };

    // Check if user can modify an item based on institution scoping and optional permission key
    const canModifyItem = (item: any, permissionKey?: string): boolean => {
        if (permissionKey && !hasPermission(permissionKey)) return false;
        if (!authStore.user?.institutionId) return true;
        if (!item) return false;
        const itemInstitutionId = typeof item === 'object' ? item.institutionId : item;
        return itemInstitutionId === authStore.user.institutionId;
    };

    return {
        hasPermission,
        checkPermission,
        hasAnyPermission,
        hasAllPermissions,
        canModifyItem,
    };
};