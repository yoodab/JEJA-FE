import { getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";
import { messaging } from "../firebase";
import api from "./api";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

export async function requestForToken(): Promise<string | null> {
  if (!VAPID_KEY) {
    console.warn("VAPID_KEY is not set. Push notifications will not work.");
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Register Service Worker with config params
      const firebaseConfigParams = new URLSearchParams({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      }).toString();

      const serviceWorkerRegistration = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?${firebaseConfigParams}`
      );

      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration 
      });

      if (token) {
        console.log("FCM Token:", token);
        // Send token to backend
        await sendTokenToBackend(token);
        return token;
      }
    } else {
      console.log("Notification permission denied");
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
  }
  return null;
}

export async function sendTokenToBackend(token: string) {
  try {
    await api.post("/api/notifications/token", { token });
    console.log("Token sent to backend");
  } catch (error) {
    console.error("Failed to send token to backend", error);
  }
}

export interface NotificationSendRequest {
  targetType: 'USER' | 'SOONJANG' | 'ALL';
  targetMemberIds?: number[];
  title: string;
  body: string;
}

export async function sendAdminNotification(data: NotificationSendRequest) {
  await api.post("/api/notifications/admin/send", data);
}

export function onMessageListener() {
  return new Promise<MessagePayload>((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}
