import { RAM } from '../../mem/RAM';
import { RegisterNames, RegisterSet } from '../RegisterSet';

export const combineRegisters = (
  register: RegisterSet,
  r1: RegisterNames,
  r2: RegisterNames
): number => {
  const v1 = register.getRegister(r1);
  const v2 = register.getRegister(r2);

  return ((v1 << 8) | v2) & 0xff;
};

export const getImmediate8 = (registers: RegisterSet, memory: RAM): number => {
  return memory.read(registers.PC + 1);
};

export const getImmediate16 = (registers: RegisterSet, memory: RAM): number => {
  return memory.read(registers.PC + 1) | (memory.read(registers.PC + 2) << 8);
};

export const getImmediate16Signed = (
  registers: RegisterSet,
  memory: RAM
): number => {
  return signed(getImmediate16(registers, memory));
};

export const signed = (value: number): number => {
  return Int8Array.from([value])[0];
};

export const unsigned = (value: number): number => {
  return Uint8Array.from([value])[0];
};
