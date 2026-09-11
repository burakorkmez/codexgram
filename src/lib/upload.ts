import type { ImagePickerAsset } from 'expo-image-picker';
import { siteUrl } from './social';

export function validateMedia(asset: ImagePickerAsset, avatar = false) {
  const video = asset.type === 'video';
  if (avatar && video) throw new Error('Choose a photo for your avatar.');
  if (!asset.width || !asset.height) throw new Error('Unable to read media dimensions. Select a different file.');
  const max = (avatar ? 5 : video ? 50 : 10) * 1024 * 1024;
  if (asset.fileSize != null && asset.fileSize > max) throw new Error(`Choose a file under ${max / 1024 / 1024} MB.`);
  if (video && (!asset.duration || asset.duration > 30_000)) throw new Error('Choose a video no longer than 30 seconds.');
  const mime = asset.mimeType?.toLowerCase() ?? (video ? 'video/mp4' : 'image/jpeg');
  if (!(video ? ['video/mp4', 'video/quicktime'] : ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']).includes(mime)) throw new Error('Choose a JPG, PNG, WebP, HEIC photo or an MP4/MOV video.');
  return { kind: video ? 'video' as const : 'image' as const, width: asset.width, height: asset.height, ...(video ? { duration: asset.duration! / 1000 } : {}), mime, max };
}
export function sendUpload(id: string, blob: Blob, token: string, progress: (value: number) => void, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    signal?.addEventListener('abort', abort);
    const cleanup = () => signal?.removeEventListener('abort', abort);
    xhr.open('POST', `${siteUrl}/upload?id=${encodeURIComponent(id)}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', blob.type);
    xhr.timeout = 180_000;
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(event.loaded / event.total); };
    xhr.onload = () => { cleanup(); if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(xhr.responseText || 'Upload failed. Please retry.')); };
    xhr.onerror = () => { cleanup(); reject(new Error('Upload failed. Check your connection and retry.')); };
    xhr.ontimeout = () => { cleanup(); reject(new Error('Upload timed out. Please retry.')); };
    xhr.onabort = () => { cleanup(); reject(new Error('Upload cancelled.')); };
    if (signal?.aborted) { cleanup(); reject(new Error('Upload cancelled.')); return; }
    xhr.send(blob);
  });
}
