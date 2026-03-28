export const getSlug = (pathname) => {
  if (!pathname) return "";
  const segments = pathname.split("/");
  return segments[segments.length - 1];
};

export const isEmptyObject = (obj) => {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
};
