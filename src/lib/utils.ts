export const getResizedImageUrl = (url: string | null | undefined, width: number) => {
  if (!url) return '';
  if (url.startsWith('/api/images/')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
  }
  return url;
};

const fetchCache = new Map<string, { promise: Promise<any>, timestamp: number }>();

export const fetchWithCache = async (url: string, options?: RequestInit & { retries?: number }) => {
  const cacheKey = url;
  const now = Date.now();
  const CACHE_TTL = 30000; // 30 seconds TTL
  const maxRetries = options?.retries ?? 2;
  
  const cached = fetchCache.get(cacheKey);
  if (!cached || (now - cached.timestamp > CACHE_TTL)) {
    // Strip signal to prevent one component from aborting a shared request
    const fetchOptions: any = { ...options };
    delete fetchOptions.skipCache; 
    delete fetchOptions.signal;
    delete fetchOptions.retries;
    
    const executeFetch = async (attempt: number = 0): Promise<any> => {
      try {
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'No error body');
          throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
        }
        return await res.json();
      } catch (err: any) {
        if (attempt < maxRetries && err.name !== 'AbortError') {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeFetch(attempt + 1);
        }
        fetchCache.delete(cacheKey);
        throw err;
      }
    };

    fetchCache.set(cacheKey, { promise: executeFetch(), timestamp: now });
  }
  
  return new Promise((resolve, reject) => {
    if (options?.signal?.aborted) {
      return reject(new DOMException('The user aborted a request.', 'AbortError'));
    }
    
    const onAbort = () => reject(new DOMException('The user aborted a request.', 'AbortError'));
    options?.signal?.addEventListener('abort', onAbort);
    
    fetchCache.get(cacheKey)!.promise
      .then(resolve)
      .catch(err => {
        if (err.name === 'AbortError') {
          reject(new DOMException('The user aborted a request.', 'AbortError'));
        } else {
          // Add context to the error
          if (err instanceof Error && !err.message.includes(url)) {
            err.message = `${err.message} (fetching ${url})`;
          }
          reject(err);
        }
      })
      .finally(() => {
        options?.signal?.removeEventListener('abort', onAbort);
      });
  });
};
