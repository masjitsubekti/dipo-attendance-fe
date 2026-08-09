export const appConfig = {
  head: {
    title: "RA Management System",
    titleTemplate: '%s | RA Management System',
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: "RA Management System" },
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
    // Inline script to prevent flash of light theme
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
          })();
        `,
        type: 'text/javascript',
      },
    ],
  },
};
