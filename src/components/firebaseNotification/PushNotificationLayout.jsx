"use client"
import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { saveOfferData } from '@/redux/reuducer/offerSlice';
import { useDispatch } from 'react-redux';
import { setNotifications } from '@/redux/reuducer/globalStateSlice';

const isDev = process.env.NODE_ENV === 'development';

const PushNotificationLayout = ({ children, onNotificationReceived, setActiveTab, setChatMessages, setSelectedTabData, defaultSelected }) => {

  const dispatch = useDispatch()
  const [notification, setNotification] = useState('');
  const [fcmToken, setFcmToken] = useState('');
  const firebaseRef = useRef(null);
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isDev) return;
    // Defer Firebase init to avoid blocking the initial critical path (LCP/TBT).
    const initFirebase = () => {
      import('../../utils/Firebase').then((mod) => {
        const FirebaseData = mod.default;
        firebaseRef.current = FirebaseData();
        firebaseRef.current.fetchToken(setFcmToken);
      });
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(initFirebase, { timeout: 4000 });
    } else {
      setTimeout(initFirebase, 3000);
    }
  }, []);

  useEffect(() => {
    if (isDev || !firebaseRef.current) return;
    
    firebaseRef.current.onMessageListener()
      .then((payload) => {
        if (payload && payload.data) {
          setNotification(payload.data);
          if (Notification.permission === 'granted') {
            const notif = new Notification(payload.notification.title, {
              body: payload.notification.body,
            });
            const selectedTab = {
              amount: Number(payload?.data?.item_offer_amount),
              id: Number(payload?.data?.item_offer_id),
              unread_chat_count: payload?.data?.unread_count,
              created_at: payload?.data?.created_at,
              item: {
                price: Number(payload?.data?.item_price),
                image: payload?.data?.item_image,
                name: payload?.data?.item_name,
                review: null,
                status: 'approved',
              },
              user_blocked: false,
              item_id: Number(payload?.data?.item_id),
              ...(payload?.data?.user_type === 'Seller'
                ? {
                  seller: {
                    profile: payload?.data?.user_profile,
                    name: payload?.data?.user_name,
                    id: Number(payload?.data?.user_id),
                  },
                }
                : {
                  buyer: {
                    profile: payload?.data?.user_profile,
                    name: payload?.data?.user_name,
                    id: Number(payload?.data?.user_id),
                  },
                }),
              tab: payload?.data?.user_type === 'Seller' ? 'buying' : 'selling',
            };

            dispatch(setNotifications(selectedTab))

            notif.onclick = () => {
              if (payload.data.type === 'chat' || payload.data.type === 'offer') {
                if (setSelectedTabData) {
                  setSelectedTabData(selectedTab)
                }
                saveOfferData(selectedTab);
                if (pathname !== '/chat') {
                  router.push('/chat');
                }
              }
            };
          }

          if (typeof onNotificationReceived === 'function') {
            onNotificationReceived(payload.data);
          } else {
            console.error("onNotificationReceived is not a function");
          }

          if (defaultSelected?.id === Number(payload?.data?.item_offer_id)) {
            const newMessage = {
              message_type: payload.data?.message_type_temp,
              message: payload.data?.message,
              sender_id: Number(payload.data?.sender_id),
              created_at: payload.data?.created_at,
              audio: payload.data?.audio,
              file: payload.data?.file,
              id: Number(payload.data?.id),
              item_offer_id: Number(payload.data?.item_offer_id),
              updated_at: payload.data?.updated_at,
            };
            if (setChatMessages) {
              setChatMessages((prevMessages) => [newMessage, ...prevMessages]);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error handling foreground notification:', err);
      });
  }, [onNotificationReceived, fcmToken]);


  useEffect(() => {
    // Skip service worker registration in development mode
    if (isDev) return;
    
    if (fcmToken) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          })
          .catch((err) => {
            console.log('Service Worker registration failed: ', err);
          });
      }
    }
  }, [fcmToken]);

  useEffect(() => {
    if (setActiveTab && defaultSelected) {
      if (defaultSelected.tab === 'buying') {
        setActiveTab('buying')
      }
      else {
        setActiveTab('selling')
      }
    }
  }, [defaultSelected])

  return <>{children}</>;
}

export default PushNotificationLayout;