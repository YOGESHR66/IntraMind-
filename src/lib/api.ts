function cloneBody(body: any): any {
  if (body instanceof FormData) {
    const clone = new FormData();
    body.forEach((val, key) => {
      if (val instanceof File) {
        clone.append(key, val, val.name);
      } else {
        clone.append(key, val);
      }
    });
    return clone;
  }
  return body;
}

export async function fetchApi(url: string, options: RequestInit = {}): Promise<Response> {
  const isFormData = options.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (!isFormData) {
    defaultHeaders['Accept'] = 'application/json';
  }

  const baseOptions: RequestInit = {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  let attempts = 0;
  // File uploads should retry at most 2 times to avoid connection congestion
  const maxAttempts = isFormData ? 2 : 6;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const currentOptions = {
        ...baseOptions,
        body: cloneBody(options.body),
      };
      const res = await fetch(url, currentOptions);
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/html')) {
        let text = '';
        try {
          const clonedRes = res.clone();
          text = await clonedRes.text();
        } catch {
          text = '';
        }

        if (
          text.includes('Cookie check') ||
          text.includes('__ais_cookie') ||
          text.includes('<!doctype') ||
          text.includes('<html') ||
          text.includes('color-scheme')
        ) {
          // Cloud Run reverse proxy challenge page. Wait briefly for cookie setup & retry.
          await new Promise((r) => setTimeout(r, 200 * attempts));
          continue;
        }
      }

      return res;
    } catch (err) {
      // Connection errors, e.g. server restarting or proxy delay
      if (attempts >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 300 * attempts));
    }
  }

  return fetch(url, { ...baseOptions, body: cloneBody(options.body) });
}

