'use client'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import firebaseApp from './firebaseApp';
import { getFcmToken } from '@/redux/reuducer/settingSlice';

const isDev = process.env.NODE_ENV === 'development';

/**
 * ✅ Modular Firebase Optimization:
 * Removed the legacy "compat" SDK which was triggering the auth/iframe.js eagerly early.
 * This modern V9+ structure ensures zero Firebase initialization work occurs during LCP.
 */
const FirebaseData = () => {
  let authInstance = null;
  const getAuthentication = () => {
    if (!authInstance) {
      authInstance = getAuth(firebaseApp);
    }
    return authInstance;
  };

  const messagingInstance = async () => {
    if (isDev) return null;
    try {
      if (await isSupported()) {
        return getMessaging(firebaseApp);
      }
      return null;
    } catch (err) {
      console.error('Error checking messaging support:', err);
      return null;
    }
  };

  const fetchToken = async (setFcmTokenCallback) => {
    if (isDev) return;
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messaging = await messagingInstance();
        if (!messaging) return;
        
        const currentPermission = Notification.permission;
        if (currentPermission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          });
          if (currentToken) {
            getFcmToken(currentToken);
            setFcmTokenCallback(currentToken);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching notification token:', err);
    }
  };

  const requestNotificationPermission = async (setFcmTokenCallback) => {
    if (isDev) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await fetchToken(setFcmTokenCallback);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const onMessageListener = async () => {
    if (isDev) return new Promise(() => {});
    const messaging = await messagingInstance();
    if (messaging) {
      return new Promise((resolve) => {
        onMessage(messaging, (payload) => resolve(payload));
      });
    }
    return null;
  };

  const signOut = async () => {
    try {
      const auth = getAuthentication();
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('SignOut error:', e);
    }
  };

  return { 
    authentication: getAuthentication, 
    fetchToken, 
    requestNotificationPermission, 
    onMessageListener, 
    signOut 
  }
}

export default FirebaseData;
