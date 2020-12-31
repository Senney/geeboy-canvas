import { RAM } from '../../mem/RAM';
import { RegisterSet, RegisterNames } from '../RegisterSet';

export const push8 = (registers: RegisterSet, memory: RAM, v: number): void => {
  registers.SP -= 1;
  memory.write(registers.SP, v & 0xff);
};

export const push16 = (
  registers: RegisterSet,
  memory: RAM,
  v: number
): void => {
  push8(registers, memory, v & 0xff);
  push8(registers, memory, (v & 0xff00) >> 8);
};

export const pop8 = (
  registers: RegisterSet,
  memory: RAM,
  reg: RegisterNames
): number => {
  registers.setRegister(reg, memory.read(registers.SP));
  registers.SP += 1;
  return registers.getRegister(reg);
};

export const pop16 = (
  registers: RegisterSet,
  memory: RAM,
  highReg: RegisterNames,
  lowReg: RegisterNames
): number => {
  const v1 = pop8(registers, memory, lowReg);
  const v2 = pop8(registers, memory, highReg);
  return (v2 << 8) | v1;
};

export const pop16PC = (registers: RegisterSet, memory: RAM): number => {
  const v = memory.read(registers.SP) | (memory.read(registers.SP + 1) << 8);
  registers.SP += 2;
  return v & 0xffff;
};
