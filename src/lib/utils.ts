export const getResizedImageUrl = (url: string | null | undefined, width: number) => {
  if (!url) return '';
  if (url.startsWith('/api/images/')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
  }
  return url;
};
