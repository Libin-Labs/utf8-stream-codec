import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeUtf8, Utf8Decoder } from '../dist/esm/index.js';

test('all split points', () => {
  const text = 'a€😀z',
    b = encodeUtf8(text);
  for (let i = 0; i <= b.length; i++) {
    const d = new Utf8Decoder();
    assert.equal(d.write(b.slice(0, i)) + d.write(b.slice(i)) + d.finish(), text);
  }
});
test('fatal malformed', () => {
  for (const b of [
    [0xc0, 0x80],
    [0xed, 0xa0, 0x80],
    [0xf4, 0x90, 0x80, 0x80],
    [0x80],
    [0xe2, 0x41],
  ])
    assert.throws(() => new Utf8Decoder().write(new Uint8Array(b)), SyntaxError);
});
test('truncation terminal', () => {
  const d = new Utf8Decoder();
  d.write(new Uint8Array([0xe2]));
  assert.throws(() => d.finish(), SyntaxError);
  assert.throws(() => d.write(new Uint8Array()));
});
test('encoder refuses lone surrogate', () => {
  assert.throws(() => encodeUtf8('\ud800'), SyntaxError);
  assert.throws(() => encodeUtf8('\udfff'), SyntaxError);
});
test('limits exact and cumulative', () => {
  assert.equal(encodeUtf8('€', { maxBytes: 3 }).length, 3);
  assert.throws(() => encodeUtf8('€', { maxBytes: 2 }), RangeError);
  const d = new Utf8Decoder({ maxBytes: 2, maxCodeUnits: 1 });
  assert.equal(d.write(new Uint8Array([65])), 'A');
  assert.throws(() => d.write(new Uint8Array([66])), RangeError);
});
test('BOM preserved and byte ownership', () => {
  const d = new Utf8Decoder();
  const b = encodeUtf8('\ufeff');
  assert.equal(d.write(b), '\ufeff');
  b.fill(0);
  assert.equal(d.finish(), '');
  assert.deepEqual(encodeUtf8('abc'), new TextEncoder().encode('abc'));
});
test('one-byte chunks match platform UTF8 oracle', () => {
  const text = Array.from({ length: 250 }, (_, i) =>
    String.fromCodePoint(i % 2 ? i * 31 : 0x10000 + i * 131),
  ).join('');
  const bytes = encodeUtf8(text);
  assert.deepEqual(bytes, new TextEncoder().encode(text));
  const decoder = new Utf8Decoder();
  let result = '';
  for (const byte of bytes) result += decoder.write(new Uint8Array([byte]));
  assert.equal(result + decoder.finish(), text);
});
test('both cumulative limits are exact at split boundaries', () => {
  const decoder = new Utf8Decoder({ maxBytes: 4, maxCodeUnits: 2 });
  assert.equal(decoder.write(new Uint8Array([240, 159])), '');
  assert.equal(decoder.write(new Uint8Array([152, 128])), '😀');
  assert.equal(decoder.finish(), '');
  assert.throws(() => decoder.finish());
  assert.throws(() => encodeUtf8('😀', { maxCodeUnits: 1 }), RangeError);
  assert.throws(() => new Utf8Decoder({ maxCodeUnits: 1 }).write(encodeUtf8('😀')), RangeError);
});
test('malformed scalar poison, invalid limits and no byte retention', () => {
  const decoder = new Utf8Decoder();
  const first = new Uint8Array([0xe2]);
  decoder.write(first);
  first[0] = 0;
  assert.equal(decoder.write(new Uint8Array([0x82, 0xac])), '€');
  decoder.finish();
  const bad = new Utf8Decoder();
  assert.throws(() => bad.write(new Uint8Array([0xff])), SyntaxError);
  assert.throws(() => bad.finish());
  assert.throws(() => new Utf8Decoder({ maxBytes: -1 }), RangeError);
});
