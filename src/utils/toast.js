// Lazy load react-hot-toast to prevent it from blocking the main thread

const loadToast = () => import("react-hot-toast").then((mod) => mod.default);

const toast = async (message, options) => {
  const t = await loadToast();
  return t(message, options);
};

toast.success = async (message, options) => {
  const t = await loadToast();
  return t.success(message, options);
};

toast.error = async (message, options) => {
  const t = await loadToast();
  return t.error(message, options);
};

toast.loading = async (message, options) => {
  const t = await loadToast();
  return t.loading(message, options);
};

toast.dismiss = async (toastId) => {
  const t = await loadToast();
  return t.dismiss(toastId);
};

toast.promise = async (promise, msgs, options) => {
  const t = await loadToast();
  return t.promise(promise, msgs, options);
};

export default toast;
