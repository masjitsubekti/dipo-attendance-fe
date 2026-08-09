importScripts(
    "https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js",
);
importScripts(
    "https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js",
);

firebase.initializeApp({
    apiKey: "AIzaSyAlT9XHqqCYnArGBykrr6TpbbqM2lA6mvM",
    authDomain: "esurat-mojokerto.firebaseapp.com",
    projectId: "esurat-mojokerto",
    storageBucket: "esurat-mojokerto.firebasestorage.app",
    messagingSenderId: "693150369696",
    appId: "1:693150369696:web:f0c8f492e367c8a4dd46c5",
    measurementId: "G-Q2W8R0P2H2",
});

const messaging = firebase.messaging();

async function broadcastToClients(data) {
    const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
    });
    for (const client of clientsList) client.postMessage(data);
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

messaging.onBackgroundMessage(async (payload) => {
    const title =
        payload.notification?.title || payload.data?.title || "Notification";
    const body = payload.notification?.body || payload.data?.body || "";

    const tag = payload.data?.notifTag || `fcm-${Date.now()}`;

    await self.registration.showNotification(title, {
        body,
        icon: "/images/logo-mkn.webp",
        badge: "/images/logo-mkn.webp",
        vibrate: [200, 100, 200],
        tag,
        renotify: false,
        silent: true,
        data: payload.data || {},
    });

    await broadcastToClients({ type: "FCM_MESSAGE", payload });
    await broadcastToClients({ type: "PLAY_SOUND" });
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });

            const targetUrl = event.notification.data?.url || "/";
            for (const client of allClients) {
                if ("focus" in client) return client.focus();
            }
            return self.clients.openWindow(targetUrl);
        })(),
    );
});
