'use client'
// firebase/app init handled by @/utils/firebaseApp
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import firebase from "firebase/compat/app"
import { getAuth } from "firebase/auth";
import toast from 'react-hot-toast';
import { createStickyNote, t } from '.';
import { getFcmToken } from '@/redux/reuducer/settingSlice';
import firebaseApp from './firebaseApp';

const isDev = process.env.NODE_ENV === 'development';

const FirebaseData = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: process.env.NEXT_PUBLIC_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
    });
  }

  let auth = null;
  const getAuthentication = () => {
    if (!auth) {
      auth = getAuth(firebaseApp);
    }
    return auth;
  };

  const authentication = typeof window !== 'undefined' ? getAuthentication() : null;

  const messagingInstance = async () => {
    // Skip messaging in development mode
    if (isDev) {
      return null;
    }
    try {
      const isSupportedBrowser = await isSupported();
      if (isSupportedBrowser) {
        return getMessaging(firebaseApp);
      } else {
        // Abo omar told from mw to hidden it
        // do it to hidden the sticky note that show in the bottom of the page
        // it was like this :Chat and Notification features are not supported on this browser. For a better user experience, please use our mobile application.
        // createStickyNote();
        return null;
      }
    } catch (err) {
      console.error('Error checking messaging support:', err);
      return null;
    }
  };
  const fetchToken = async (setFcmToken) => {
    // Skip FCM token fetching in development mode
    if (isDev) {
      console.log('[Dev] Skipping FCM token fetch - push notifications disabled in development');
      return;
    }
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messaging = await messagingInstance();
        if (!messaging) {
          console.error('Messaging not supported.');
          return;
        }
        // ✅ Only auto-fetch token if permission was already granted (returning user).
        // Never call Notification.requestPermission() on page load — Lighthouse flags it
        // and users distrust unprompted permission dialogs.
        const currentPermission = Notification.permission;
        if (currentPermission === 'granted') {
          getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          })
            .then((currentToken) => {
              if (currentToken) {
                getFcmToken(currentToken);
                setFcmToken(currentToken);
              } else {
                console.log('No FCM token available');
              }
            })
            .catch((err) => {
              console.error('Error retrieving token:', err);
              if (err.message.includes('no active Service Worker')) {
                registerServiceWorker(setFcmToken);
              }
            });
        } else if (currentPermission === 'default') {
          // Permission not yet asked — don't prompt on page load.
          // Call requestNotificationPermission() from a user gesture (e.g. button click).
          console.log('Notification permission not yet requested — waiting for user gesture.');
        }
      }
    } catch (err) {
      console.error('Error fetching notification token:', err);
    }
  };

  /**
   * ✅ Call this from a user gesture (button click, toggle, etc.) to request permission.
   * Example: <button onClick={() => requestNotificationPermission(setFcmToken)}>Enable Notifications</button>
   */
  const requestNotificationPermission = async (setFcmToken) => {
    if (isDev) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await fetchToken(setFcmToken);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const registerServiceWorker = (setFcmToken) => {
    // Skip service worker registration in development mode
    if (isDev) {
      console.log('[Dev] Skipping service worker registration - disabled in development');
      return;
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registration successful with scope: ', registration.scope);
          // After successful registration, try to fetch the token again
          if (setFcmToken) {
            fetchToken(setFcmToken);
          }
        })
        .catch((err) => {
          console.log('Service Worker registration failed: ', err);
        });
    }
  };

  const onMessageListener = async () => {
    // Skip message listener in development mode
    if (isDev) {
      // Return a never-resolving promise to avoid errors
      return new Promise(() => {});
    }
    const messaging = await messagingInstance();
    if (messaging) {
      return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      });
    } else {
      console.error('Messaging not supported.');
      return null;
    }
  };
  const signOut = () => {
    return getAuthentication().signOut();
  };
  return { firebase, authentication: getAuthentication, fetchToken, requestNotificationPermission, onMessageListener, signOut }
}

export default FirebaseData;
