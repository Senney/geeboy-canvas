import { Cartridge } from '../rom/Cartridge';
import { RAM } from './RAM';
import { MBC1 } from './MBC1';

export class RAMFactory {
  static getImplementation(cart: Cartridge): RAM {
    switch (cart.metadata.ramType) {
      case 0x00:
      case 0x01:
      case 0x02:
      case 0x03:
        return new MBC1(cart);
      default:
        throw new Error('Unsupported memory type.');
    }
  }
}
