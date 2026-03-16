"use client";
import enTranslation from "./locale/en.json";
import arTranslation from "./locale/ar.json";
import { store } from "../redux/store";

export const t = (label) => {
  if (store.getState().CurrentLanguage?.language?.code === "ar") {
    return arTranslation[label];
  } else {
    return enTranslation[label];
  }
};
