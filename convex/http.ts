import { videoDuration } from './lib/video';
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length' };
const response = (message: string, status: number) => new Response(message, { status, headers: cors });
http.route({ path: '/upload', method: 'POST', handler: httpAction(async (ctx, req) => {
  const identity = await ctx.auth.getUserIdentity(); if (!identity) return response('Sign in required.', 401);
  const upload = await ctx.runQuery(internal.uploads.forUpload, { id: new URL(req.url).searchParams.get('id') ?? '', tokenIdentifier: identity.tokenIdentifier });
  if (!upload || upload.expiresAt <= Date.now()) return response('Upload missing or expired.', 404);
  if (upload.storageId) return response('Upload complete.', 200);
  const type = (req.headers.get('Content-Type') ?? '').split(';')[0].toLowerCase();
  const allowed = upload.kind === 'image' ? ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] : ['video/mp4', 'video/quicktime'];
  const max = (upload.purpose === 'avatar' ? 5 : upload.kind === 'image' ? 10 : 50) * 1024 * 1024;
  if (!allowed.includes(type)) return response('Unsupported media format.', 415);
  if (Number(req.headers.get('Content-Length')) > max) return response('File is too large.', 413);
  // Stream into the runtime's Blob implementation instead of accumulating a
  // 50 MB array of JS chunks against Convex's 64 MB action memory budget.
  if (!req.body) return response('Empty file.', 400);
  let size = 0;
  const limited = req.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      size += chunk.byteLength;
      if (size > max) throw new Error('File is too large.');
      controller.enqueue(chunk);
    },
  }));
  let blob: Blob;
  try { blob = await new Response(limited, { headers: { 'Content-Type': type } }).blob(); }
  catch { return response('Upload interrupted or file too large.', size > max ? 413 : 400); }
  if (!blob.size) return response('Empty file.', 400);
  const head = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  const ascii = (start: number, end: number) => String.fromCharCode(...head.slice(start, end));
  const valid = type === 'image/jpeg' ? head[0] === 255 && head[1] === 216 && head[2] === 255
    : type === 'image/png' ? head[0] === 137 && ascii(1, 4) === 'PNG'
    : type === 'image/webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
    : ascii(4, 8) === 'ftyp';
  if (!valid) return response('File content does not match its media type.', 400);
  const duration = upload.kind === 'video' ? await videoDuration(blob) : undefined;
  if (upload.kind === 'video' && (!duration || duration > 30)) return response('Choose a valid MP4/MOV video no longer than 30 seconds.', 400);
  const storageId = await ctx.storage.store(blob);
  try {
    const accepted = await ctx.runMutation(internal.uploads.finish, { id: upload._id, tokenIdentifier: identity.tokenIdentifier, storageId, ...(duration ? { duration } : {}) });
    if (accepted !== storageId) await ctx.storage.delete(storageId);
    return response('Upload complete.', 200);
  } catch { await ctx.storage.delete(storageId); return response('Upload expired. Please retry.', 409); }
}) });
http.route({ path: '/media', method: 'GET', handler: httpAction(async (ctx, req) => {
  const identity = await ctx.auth.getUserIdentity(); if (!identity) return response('Sign in required.', 401);
  const url = new URL(req.url); const kind = url.searchParams.get('kind') === 'avatar' ? 'avatar' : url.searchParams.get('kind') === 'story' ? 'story' : 'post';
  const storageId = await ctx.runQuery(internal.uploads.media, { id: url.searchParams.get('id') ?? '', kind, now: Date.now(), tokenIdentifier: identity.tokenIdentifier });
  if (!storageId) return response('Media unavailable.', 404);
  const blob = await ctx.storage.get(storageId); if (!blob) return response('Media unavailable.', 404);
  const headers = { ...cors, 'Content-Type': blob.type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, no-store' };
  const range = req.headers.get('Range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return response('Invalid range.', 416);
    const start = match[1] ? Number(match[1]) : Math.max(0, blob.size - Number(match[2]));
    const requestedEnd = match[1] && match[2] ? Math.min(Number(match[2]), blob.size - 1) : blob.size - 1;
    const end = Math.min(requestedEnd, start + 8 * 1024 * 1024 - 1);
    if (start > end || start >= blob.size) return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${blob.size}` } });
    return new Response(blob.slice(start, end + 1), { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${blob.size}`, 'Content-Length': String(end - start + 1) } });
  }
  if (blob.size > 8 * 1024 * 1024 && blob.type.startsWith('video/')) {
    const end = 8 * 1024 * 1024 - 1;
    return new Response(blob.slice(0, end + 1), { status: 206, headers: { ...headers, 'Content-Range': `bytes 0-${end}/${blob.size}`, 'Content-Length': String(end + 1) } });
  }
  return new Response(blob, { headers: { ...headers, 'Content-Length': String(blob.size) } });
}) });
for (const path of ['/upload', '/media']) http.route({ path, method: 'OPTIONS', handler: httpAction(async () => new Response(null, { status: 204, headers: cors })) });
export default http;
