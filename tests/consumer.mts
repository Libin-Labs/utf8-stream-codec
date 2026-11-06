import { encodeUtf8, Utf8Decoder } from '@lp-labs/utf8-stream-codec';
const decoder = new Utf8Decoder({ maxBytes: 4 });
const text: string = decoder.write(encodeUtf8('abc')) + decoder.finish();
void text;
// @ts-expect-error bytes required
decoder.write('a');
