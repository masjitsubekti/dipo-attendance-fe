export const appConfig = {
  head: {
    title: "Presensi Sekolah",
    titleTemplate: "%s | Presensi Sekolah",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { name: "description", content: "Aplikasi Presensi Sekolah" },
      { name: "theme-color", content: "#2563eb" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Presensi" },
      { name: "application-name", content: "Presensi" },
    ],
    link: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    // Inline script to prevent flash of light theme and register PWA Service Worker
    script: [
      {
        innerHTML: `
          (function() {
            try {
              var config = JSON.parse(localStorage.getItem('app-config') || '{}');
              var theme = config.theme || 'light';
              var isDark = false;
              
              if (theme === 'dark') {
                isDark = true;
              } else if (theme === 'system') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              }
              
              if (isDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}

            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          })();
        `,
        type: 'text/javascript',
      },
    ],
  },
};
