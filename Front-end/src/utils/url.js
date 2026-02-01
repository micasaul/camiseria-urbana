export const getImageUrl = (url) => {
  if (!url) return null;

  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('blob:')) {
    return url;
  }

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337';

  return `${backendUrl}${url}`;
};
