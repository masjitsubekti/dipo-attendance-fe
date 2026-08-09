import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!process.client) return;

  const config: any = useRuntimeConfig();

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId,
  };

  const supported = await isSupported().catch(() => false);
  if (!supported || !("serviceWorker" in navigator)) {
    console.warn("FCM is not supported in this browser.");
    return;
  }

  const app = initializeApp(firebaseConfig);

  await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
  const swReg = await navigator.serviceWorker.ready;

  const messaging = getMessaging(app);

  const permission = useState<NotificationPermission>(
    "fcmPermission",
    () => Notification.permission
  );
  const token = useState<string | null>("fcmToken", () => null);
  const soundEnabled = useState<boolean>("fcmSoundEnabled", () => false);

  async function getFcmToken(): Promise<string | null> {
    try {
      return await requestNotificationPermission().then(async (res) => {
        if (res != "granted") {
          return null;
        }

        attachOneTimeUnlock();
        const t = await getToken(messaging, {
          vapidKey: config.public.firebaseVapidKey,
          serviceWorkerRegistration: swReg,
        });
        token.value = t ?? null;
        if (t) localStorage.setItem("fcmToken", t);
        return t ?? null;
      });
    } catch (err) {
      console.error("FCM getToken error:", err);
      return null;
    }
  }

  const SOUND_PREF_KEY = "fcmSoundPref";
  const audio = new Audio("/sounds/notification-sound.mp3");
  audio.preload = "auto";
  audio.load();
  function unlockAudioSync() {
    if (!process.client) return;

    type AudioCtor = new (...args: any[]) => AudioContext;
    const w = window as unknown as {
      __audioCtx?: AudioContext;
      AudioContext?: AudioCtor;
      webkitAudioContext?: AudioCtor;
    };

    const Ctor: AudioCtor | undefined = w.AudioContext ?? w.webkitAudioContext;
    if (Ctor) {
      try {
        w.__audioCtx ??= new Ctor();
        w.__audioCtx.resume?.().catch(() => {});
      } catch {}
    }

    try {
      const a = new Audio("/sounds/notification-sound.mp3");
      a.muted = true;
      const p = a.play();
      if (p && typeof (p as any).then === "function") {
        (p as Promise<void>)
          .then(() => {
            a.pause();
            a.currentTime = 0;
            a.muted = false;
          })
          .catch(() => {});
      }
    } catch {}
  }

  function attachOneTimeUnlock() {
    const once = () => {
      unlockAudioSync();
      localStorage.setItem(SOUND_PREF_KEY, "1");
      soundEnabled.value = true;
      window.removeEventListener("pointerdown", once, true);
      window.removeEventListener("keydown", once, true);
    };
    window.addEventListener("pointerdown", once, true);
    window.addEventListener("keydown", once, true);
  }

  async function requestNotificationPermission() {
    if (Notification.permission === "default") {
      return await Notification.requestPermission().then(async (p) => {
        permission.value = p;
        if (p === "granted") {
          return "granted";
        } else {
          return "denied";
        }
      });
    } else if (Notification.permission === "granted") {
      return "granted";
    }
  }

  const everEnabled = localStorage.getItem(SOUND_PREF_KEY) === "1";
  soundEnabled.value = everEnabled;
  if (everEnabled) attachOneTimeUnlock();

  type FcmEvt = {
    source: "foreground" | "service-worker";
    payload: any;
  };
  const listeners = new Set<(e: FcmEvt) => void>();

  const onFcmMessage = (cb: (e: FcmEvt) => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const emitFcm = (e: FcmEvt) => listeners.forEach((cb) => cb(e));

  onMessage(messaging, async (payload) => {
    console.log("payload : ", payload);

    const title =
      payload.notification?.title || payload.data?.title || "Notification";
    const body = payload.notification?.body || payload.data?.body || "";

    try {
      if (
        permission.value === "granted" &&
        document.visibilityState === "visible"
      ) {
        new Notification(title, {
          body: body || "",
          icon: "/Ajinomoto-Symbol-192x192.png",
          badge: "/Ajinomoto-Symbol-192x192.png",
          silent: true,
        });
      }
    } catch {}

    if (soundEnabled.value) {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (e) {
        console.warn(e);
      }
    }

    emitFcm({ source: "foreground", payload });
  });

  navigator.serviceWorker.addEventListener("message", async (evt) => {
    if (evt.data?.type === "PLAY_SOUND" && soundEnabled.value) {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (e) {
        console.warn("SW play failed:", e);
      }
    }
    if (evt.data?.type === "FCM_MESSAGE") {
      emitFcm({ source: "service-worker", payload: evt.data.payload });
    }
  });

  nuxtApp.provide("firebase", {
    app,
    messaging,
    getFcmToken,
    onFcmMessage,
    permission,
    soundEnabled,
  });
});
