import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import settingsReducer from "../reuducer/settingSlice";
import sliderReducer from '../reuducer/sliderSlice';
import categoryReducer from '../reuducer/categorySlice'
import userReducer from '../reuducer/userSlice';
import BreadcrumbPathReducer from '../reuducer/breadCrumbSlice'
import CurrentLanguageReducer from '../reuducer/languageSlice'
import locationReducer from '../reuducer/locationSlice';
import offerReducer from '../reuducer/offerSlice';
import searchReducer from "../reuducer/searchSlice"
import globalStateReducer from '../reuducer/globalStateSlice';
import filterReducer from '../reuducer/filterSlice'

// ✅ Create a noop storage for server-side rendering
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

// ✅ Dynamically import storage only on client side to avoid SSR issues
let storage;
if (typeof window !== 'undefined') {
  // Client-side: use localStorage
  storage = require('redux-persist/lib/storage').default;
} else {
  // Server-side: use noop storage
  storage = createNoopStorage();
}

// ✅ Optimize Redux persistence - only persist essential data
// This reduces localStorage size and improves performance
const persistConfig = {
  key: 'root',
  storage,
  manualPersisting: true,
  // Only persist essential slices to reduce localStorage size
  whitelist: [
    'Settings',        // System settings (needed for theme, etc.)
    'CurrentLanguage', // Current language preference
    'Location',        // User location preference
    'UserSignup',      // User authentication data
  ],
  // Don't persist these (they can be refetched):
  // - Slider (can be refetched)
  // - Category (can be refetched)
  // - BreadcrumbPath (temporary navigation state)
  // - OfferData (temporary)
  // - Search (temporary)
  // - GlobalState (temporary UI state)
  // - Filter (temporary filter state)
};


const rootReducer = combineReducers({
  Settings: settingsReducer,
  Slider: sliderReducer,
  Category: categoryReducer,
  UserSignup: userReducer,
  BreadcrumbPath: BreadcrumbPathReducer,
  CurrentLanguage: CurrentLanguageReducer,
  Location: locationReducer,
  OfferData: offerReducer,
  Search: searchReducer,
  GlobalState: globalStateReducer,
  Filter: filterReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware({
      serializableCheck: false,
    }),
  ],
});

export const persistor = persistStore(store);
