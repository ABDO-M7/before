import { store } from "../redux/store";

export const placeholderImage = (e) => {
  if (e.target.dataset.fallback) return;
  e.target.dataset.fallback = '1';

  let settings = store.getState()?.Settings?.data?.data;
  const placeholderLogo = settings?.placeholder_image;

  if (placeholderLogo) {
    e.target.src = placeholderLogo;
  }
};
