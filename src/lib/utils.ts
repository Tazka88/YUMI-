export const getResizedImageUrl = (url: string | null | undefined, width: number) => {
  if (!url) return '';
  if (url.startsWith('/api/images/')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
  }
  return url;
};

const fetchCache = new Map<string, Promise<any>>();

export const fetchWithCache = (url: string, options?: RequestInit) => {
  const cacheKey = url;
  
  if (!fetchCache.has(cacheKey)) {
    // Strip signal to prevent one component from aborting a shared request
    const fetchOptions = { ...options };
    delete fetchOptions.signal;
    
    const promise = fetch(url, fetchOptions).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    }).catch(err => {
      fetchCache.delete(cacheKey);
      throw err;
    });
    fetchCache.set(cacheKey, promise);
  }
  
  return new Promise((resolve, reject) => {
    if (options?.signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }
    
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    options?.signal?.addEventListener('abort', onAbort);
    
    fetchCache.get(cacheKey)!
      .then(resolve)
      .catch(reject)
      .finally(() => {
        options?.signal?.removeEventListener('abort', onAbort);
      });
  });
};
