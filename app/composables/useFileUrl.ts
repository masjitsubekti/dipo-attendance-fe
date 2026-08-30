/**
 * Composable to resolve file URLs cleanly across Local & Cloud Storage (R2 / Supabase)
 */
export function useFileUrl() {
  const getFileUrl = (pathOrUrl: string | null | undefined): string => {
    if (!pathOrUrl) return "";

    // 1. If full URL (Supabase Public URL / Cloudflare R2 / data URL / blob), return directly
    if (
      pathOrUrl.startsWith("http://") ||
      pathOrUrl.startsWith("https://") ||
      pathOrUrl.startsWith("data:") ||
      pathOrUrl.startsWith("blob:")
    ) {
      return pathOrUrl;
    }

    // 2. If already starts with /api/v1/files or /api/files
    if (pathOrUrl.startsWith("/api/v1/files") || pathOrUrl.startsWith("/api/files")) {
      return pathOrUrl.replace("/api/v1/", "/api/");
    }

    // 3. Normalize path (strip leading slashes or 'uploads/')
    let cleanPath = pathOrUrl.trim().replace(/^\//, "");
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.substring("uploads/".length);
    }

    // 4. Return proxied API URL (handled by Nuxt devProxy / nitro proxy to backend)
    return `/api/files?path=${encodeURIComponent(cleanPath)}`;
  };

  return { getFileUrl };
}
