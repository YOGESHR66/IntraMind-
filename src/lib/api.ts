import { UploadProgressState, PDFDocument } from '../types';

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

export interface UploadResult {
  success: boolean;
  document?: PDFDocument;
  aborted?: boolean;
  error?: string;
  message?: string;
}

export async function uploadDocumentWithStreamingProgress(
  file: File,
  onProgress?: (progress: UploadProgressState) => void,
  signal?: AbortSignal
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  // Initial stage
  onProgress?.({
    stage: 'uploading',
    percent: 8,
    fileName: file.name,
    fileSize: file.size,
    detail: `Transmitting ${file.name} to IntraMind RAG Engine...`,
  });

  const res = await fetch('/api/upload?stream=true', {
    method: 'POST',
    body: formData,
    signal,
    headers: {
      'Accept': 'text/event-stream, application/x-ndjson',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!res.ok && res.status !== 499) {
    let errText = `Upload error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.error) errText = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errText);
  }

  if (!res.body) {
    throw new Error('Response stream not supported by browser');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalDoc: PDFDocument | undefined;
  let finalMsg = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const chunk of lines) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;

      const dataPrefix = 'data: ';
      const jsonStr = trimmed.startsWith(dataPrefix) ? trimmed.slice(dataPrefix.length) : trimmed;

      try {
        const payload = JSON.parse(jsonStr);

        if (payload.type === 'progress') {
          onProgress?.({
            stage: payload.stage || 'parsing',
            percent: payload.percent ?? 50,
            fileName: payload.fileName || file.name,
            fileSize: payload.fileSize || file.size,
            currentChunk: payload.currentChunk,
            totalChunks: payload.totalChunks,
            detail: payload.detail || 'Processing document in vector store...',
          });
        } else if (payload.type === 'complete') {
          finalDoc = payload.document;
          finalMsg = payload.message || 'Indexing complete';
          onProgress?.({
            stage: 'complete',
            percent: 100,
            fileName: file.name,
            fileSize: file.size,
            currentChunk: payload.document?.chunkCount,
            totalChunks: payload.document?.chunkCount,
            detail: finalMsg,
          });
        } else if (payload.type === 'aborted') {
          onProgress?.({
            stage: 'aborted',
            percent: 0,
            fileName: file.name,
            detail: 'Upload aborted by user.',
            isAborting: false,
          });
          return { success: false, aborted: true, error: 'Upload aborted by user.' };
        } else if (payload.type === 'error') {
          throw new Error(payload.error || 'Server processing error');
        }
      } catch (e: any) {
        if (e.message && !e.message.includes('JSON')) {
          throw e;
        }
      }
    }
  }

  if (finalDoc) {
    return { success: true, document: finalDoc, message: finalMsg };
  }

  throw new Error('Indexing completed without document payload.');
}


