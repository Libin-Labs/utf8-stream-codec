export interface Utf8Options {
  maxBytes?: number;
  maxCodeUnits?: number;
}
function bound(n: number | undefined, fallback: number): number {
  const v = n ?? fallback;
  if (!Number.isSafeInteger(v) || v < 0) throw new RangeError('Invalid limit');
  return v;
}
export function encodeUtf8(text: string, o: Utf8Options = {}): Uint8Array {
  const max = bound(o.maxBytes, 16_777_216),
    units = bound(o.maxCodeUnits, 16_777_216);
  if (text.length > units) throw new RangeError('Code unit limit exceeded');
  let size = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const d = text.charCodeAt(++i);
      if (!(d >= 0xdc00 && d <= 0xdfff)) throw new SyntaxError('Lone surrogate');
      size += 4;
    } else if (c >= 0xdc00 && c <= 0xdfff) throw new SyntaxError('Lone surrogate');
    else size += c < 128 ? 1 : c < 2048 ? 2 : 3;
    if (size > max) throw new RangeError('Byte limit exceeded');
  }
  return new TextEncoder().encode(text);
}
export class Utf8Decoder {
  private readonly maxBytes: number;
  private readonly maxUnits: number;
  private bytes = 0;
  private units = 0;
  private remaining = 0;
  private point = 0;
  private minimum = 0;
  private closed = false;
  private failed = false;
  constructor(o: Utf8Options = {}) {
    this.maxBytes = bound(o.maxBytes, 16_777_216);
    this.maxUnits = bound(o.maxCodeUnits, 16_777_216);
  }
  write(chunk: Uint8Array): string {
    if (this.closed || this.failed) throw new Error('Decoder is closed or failed');
    try {
      if (chunk.length > this.maxBytes - this.bytes) throw new RangeError('Byte limit exceeded');
      this.bytes += chunk.length;
      const out: string[] = [];
      for (const b of chunk) {
        if (this.remaining === 0) {
          if (b < 128) {
            this.append(b, out);
            continue;
          }
          if (b >= 0xc2 && b <= 0xdf) {
            this.remaining = 1;
            this.point = b & 31;
            this.minimum = 128;
          } else if (b >= 0xe0 && b <= 0xef) {
            this.remaining = 2;
            this.point = b & 15;
            this.minimum = 2048;
          } else if (b >= 0xf0 && b <= 0xf4) {
            this.remaining = 3;
            this.point = b & 7;
            this.minimum = 65536;
          } else throw new SyntaxError('Invalid UTF-8 leading byte');
        } else {
          if ((b & 0xc0) !== 0x80) throw new SyntaxError('Invalid UTF-8 continuation');
          this.point = (this.point << 6) | (b & 63);
          if (--this.remaining === 0) {
            if (
              this.point < this.minimum ||
              this.point > 0x10ffff ||
              (this.point >= 0xd800 && this.point <= 0xdfff)
            )
              throw new SyntaxError('Invalid UTF-8 scalar');
            this.append(this.point, out);
          }
        }
      }
      return out.join('');
    } catch (error) {
      this.failed = true;
      throw error;
    }
  }
  private append(point: number, out: string[]): void {
    this.units += point > 0xffff ? 2 : 1;
    if (this.units > this.maxUnits) throw new RangeError('Code unit limit exceeded');
    out.push(String.fromCodePoint(point));
  }
  finish(): string {
    if (this.closed || this.failed) throw new Error('Decoder is closed or failed');
    this.closed = true;
    if (this.remaining) throw new SyntaxError('Truncated UTF-8');
    return '';
  }
}
