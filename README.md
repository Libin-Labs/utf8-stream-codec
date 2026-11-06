# @lp-labs/utf8-stream-codec

Fatal incremental UTF-8 decoding and bounded Unicode encoding.

## Install

```sh
npm install @lp-labs/utf8-stream-codec
```

Node.js 18+; standalone browser-compatible ES2022 core with DOM codec types. Zero runtime or peer dependencies. ESM and CommonJS with separate declarations. No filesystem, network or environment side effects.

## Quickstart

```js
import { Utf8Decoder, encodeUtf8 } from '@lp-labs/utf8-stream-codec';
const decoder = new Utf8Decoder();
const bytes = encodeUtf8('A😀');
console.log(decoder.write(bytes.slice(0, 3)) + decoder.write(bytes.slice(3)) + decoder.finish());
```

CommonJS consumers use `const api = require('@lp-labs/utf8-stream-codec')`. The same named API is available in both module formats. No default export.

## API, behavior, errors and limits

encodeUtf8 rejects lone UTF-16 surrogates instead of replacing them; it bounds code units and calculates byte size before allocation. Utf8Decoder.write consumes bytes synchronously without retaining input; split scalars are buffered as integer state. finish rejects truncated sequences and closes the decoder. Any write failure poisons the instance; subsequent operations throw Error. UTF-8 overlong, surrogate, out-of-range and malformed bytes throw SyntaxError (never replacement); BOM is preserved. maxBytes and maxCodeUnits default to 16,777,216 each and apply cumulatively to a decoder. RangeError means a limit violation. Successful earlier write results cannot be retracted. Linear time; constant decoder state plus current output; encoder output space is linear.

All exports: `Utf8Options`, `encodeUtf8`, `Utf8Decoder`.

## Full TypeScript declarations

```ts
export interface Utf8Options {
  maxBytes?: number;
  maxCodeUnits?: number;
}
export declare function encodeUtf8(text: string, o?: Utf8Options): Uint8Array;
export declare class Utf8Decoder {
  private readonly maxBytes;
  private readonly maxUnits;
  private bytes;
  private units;
  private remaining;
  private point;
  private minimum;
  private closed;
  private failed;
  constructor(o?: Utf8Options);
  write(chunk: Uint8Array): string;
  private append;
  finish(): string;
}
```

## Development

```sh
npm ci --offline
npm run typecheck
npm test
npm run format:check
```

TypeScript ^5.9.3 and Prettier ^3.6.2 are development-only. Build emits dist/esm and dist/cjs. Tests use Node's test runner; consumer.mts and consumer.cts exercise bare package imports including negative type assertions.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
