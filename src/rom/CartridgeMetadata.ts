import { Cartridge } from './Cartridge';
import { cartTypeStringMap, ramSizeMap, romSizeMap } from './constants';

const TITLE_START_INDEX = 0x134;
const TITLE_END_INDEX = 0x142;

export class CartridgeMetadata {
  public title: string;
  public cartType: number;
  public cartTypeString: string;
  public designation: string;
  public colorCompatible: boolean;

  public romType: number;
  public romSize: number;
  public romBanks: number;

  public ramType: number;
  public ramSize: number;
  public ramBanks: number;

  public destination: string;
  public romVersion: number;

  public log(): void {
    console.log(JSON.stringify(this, null, 2));
  }

  static fromCartridge(cart: Cartridge): CartridgeMetadata {
    const metadata = new CartridgeMetadata();
    metadata.title = this.getTitle(cart);
    metadata.cartType = cart.readByte(0x147);
    metadata.cartTypeString = cartTypeStringMap[metadata.cartType];
    metadata.designation = new TextDecoder('utf-8').decode(
      cart.readRange(0x13f, 0x142)
    );
    metadata.colorCompatible = cart.readByte(0x143) > 0;

    metadata.romType = cart.readByte(0x148);
    const romData = romSizeMap[metadata.romType];
    metadata.romSize = romData[0];
    metadata.romBanks = romData[1];

    metadata.ramType = cart.readByte(0x149);
    const ramData = ramSizeMap[metadata.ramType];
    metadata.ramSize = ramData[0];
    metadata.ramBanks = ramData[1];

    metadata.destination = cart.readByte(0x14a) === 0 ? 'JA' : 'NA';
    metadata.romVersion = cart.readByte(0x14c);

    return metadata;
  }

  private static getTitle(cart: Cartridge): string {
    const d = cart.readRange(TITLE_START_INDEX, TITLE_END_INDEX);
    const t = d.slice(0, d.indexOf(0));
    return new TextDecoder('utf-8').decode(t);
  }
}
