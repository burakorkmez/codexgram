// Read only MP4/MOV box headers and mvhd; never decode or buffer the video.
// mvhd v0/v1 layout follows ISO BMFF (also used by QuickTime movie headers).
export async function videoDuration(blob: Blob): Promise<number | null> {
  async function find(start: number, end: number, wanted: string) {
    for (let count = 0, offset = start; count < 1000 && offset + 8 <= end; count++) {
      const bytes = await blob.slice(offset, Math.min(offset + 16, end)).arrayBuffer();
      const data = new DataView(bytes); const type = String.fromCharCode(...new Uint8Array(bytes, 4, 4));
      let size = data.getUint32(0); let header = 8;
      if (size === 1) { if (bytes.byteLength < 16) return null; size = Number(data.getBigUint64(8)); header = 16; }
      if (size === 0) size = end - offset;
      if (!Number.isSafeInteger(size) || size < header || offset + size > end) return null;
      if (type === wanted) return { start: offset + header, end: offset + size };
      offset += size;
    }
    return null;
  }
  const moov = await find(0, blob.size, 'moov'); if (!moov) return null;
  const mvhd = await find(moov.start, moov.end, 'mvhd'); if (!mvhd) return null;
  const data = new DataView(await blob.slice(mvhd.start, Math.min(mvhd.start + 32, mvhd.end)).arrayBuffer());
  if (data.byteLength < 20) return null;
  const version = data.getUint8(0);
  if (version !== 0 && version !== 1 || version === 1 && data.byteLength < 32) return null;
  const scale = data.getUint32(version === 1 ? 20 : 12);
  const ticks = version === 1 ? Number(data.getBigUint64(24)) : data.getUint32(16);
  const seconds = ticks / scale;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}
