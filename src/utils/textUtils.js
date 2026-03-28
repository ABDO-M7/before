export const truncate = (text, maxLength) => {
  if (!text) return "";
  const stringText = String(text);
  if (stringText.length <= maxLength) return text;
  return stringText.slice(0, maxLength) + "...";
};
