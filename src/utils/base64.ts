export const encodeToBase64 = (str: string): string => {
  try {
    if (typeof window !== 'undefined') {
      return btoa(unescape(encodeURIComponent(str)));
    }
    return Buffer.from(str).toString('base64');
  } catch (error) {
    console.error('Error base64 encoding:', error);
    return '';
  }
};

export const decodeFromBase64 = (str: string): string => {
  try {
    if (typeof window !== 'undefined') {
      return decodeURIComponent(escape(atob(str)));
    }
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Error base64 decoding:', error);
    return '';
  }
};
