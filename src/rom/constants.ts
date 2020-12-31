export const cartTypeStringMap = {
  0: 'ROM',

  // MBC1
  0x01: 'ROM+MBC1',
  0x02: 'ROM+MBC1+RAM',
  0x03: 'ROM+MBC1+RAM+BATT',

  // MBC2
  0x05: 'ROM+MBC2',
  0x06: 'ROM+MBC2+BATT',

  // ROM RAM
  0x08: 'ROM+RAM',
  0x09: 'ROM+RAM+BATTERY',

  // MMD1
  0x0b: 'ROM+MMD1',
  0x0c: 'ROM+MMD1+SRAM',
  0x0d: 'ROM+MMD1+SRAM+BATT',

  // MBC3
  0x0f: 'ROM+MBC3+TIMER+BATT',
  0x10: 'ROM+MBC3+TIMER+RAM+BATT',
  0x11: 'ROM+MBC3',
  0x12: 'ROM+MBC3+RAM',
  0x13: 'ROM+MBC3+RAM+BATT',

  // MBC5
  0x19: 'ROM+MBC5',
  0x1a: 'ROM+MBC5+RAM',
  0x1b: 'ROM+MBC5+RAM+BATT',
  0x1c: 'ROM+MBC5+RUMBLE',
  0x1d: 'ROM+MBC5+RUMBLE+SRAM',
  0x1e: 'ROM+MBC5+RUMBLE+SRAM+BATT',

  // Other
  0x1f: 'Pocket Camera',
  0xfd: 'Bandai TAMA5',

  // Hudson
  0xfe: 'Hudson HuC-3',
  0xff: 'Hudson HuC-1',
};

export const romSizeMap: Record<number, [number, number]> = {
  0x00: [32 * 1024, 2],
  0x01: [64 * 1024, 4],
  0x02: [128 * 1024, 8],
  0x03: [256 * 1024, 16],
  0x04: [512 * 1024, 32],
  0x05: [1024 * 1024, 64],
  0x06: [2048 * 2014, 128],
  0x52: [1152 * 1024, 72],
  0x53: [1280 * 1024, 80],
  0x54: [1536 * 1024, 96],
};

export const ramSizeMap: Record<number, [number, number]> = {
  0x00: [0, 0],
  0x01: [2 * 1024, 1],
  0x02: [8 * 1024, 1],
  0x03: [32 * 1024, 4],
  0x04: [128 * 1024, 16],
};
