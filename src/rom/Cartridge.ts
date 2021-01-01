import { CartridgeMetadata } from './CartridgeMetadata';

export class Cartridge {
  private content: Uint8Array;
  private readonly meta: CartridgeMetadata;

  constructor(romContentBuffer: ArrayBuffer) {
    this.content = new Uint8Array(romContentBuffer);
    this.meta = Object.freeze(CartridgeMetadata.fromCartridge(this));
  }

  public read(idx: number, len: number): Uint8Array {
    if (idx + len - 1 > this.content.byteLength) {
      throw new Error(
        `Out of bounds read. [0x${idx.toString(16)}:0x${(idx + len).toString(
          16
        )}] - Max is [0x${this.content.byteLength.toString(16)}]`
      );
    }

    return this.content.slice(idx, idx + len);
  }

  public readByte(idx: number): number {
    return this.read(idx, 1)[0];
  }

  public readRange(startIdx: number, endIdx: number): Uint8Array {
    return this.read(startIdx, endIdx - startIdx);
  }

  public get metadata(): Readonly<CartridgeMetadata> {
    return this.meta;
  }
}
