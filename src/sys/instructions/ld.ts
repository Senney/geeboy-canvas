import { InstructionFunction, InstructionMap } from './types';
import { RegisterNames, RegisterSet } from '../RegisterSet';
import { getImmediate16, getImmediate8 } from './util';

const registerToRegisterLd = (
  dst: RegisterNames,
  src: RegisterNames
): InstructionFunction => {
  return (registers) => {
    registers.setRegister(dst, registers.getRegister(src));
  };
};

const memoryAtHLToRegister = (dst: RegisterNames): InstructionFunction => {
  return (registers, memory) => {
    registers.setRegister(dst, memory.read(registers.HL));
  };
};

const makeRegisterCopySet = (baseInstr: number, reg: RegisterNames) => {
  return {
    [baseInstr++]: registerToRegisterLd(reg, 'B'),
    [baseInstr++]: registerToRegisterLd(reg, 'C'),
    [baseInstr++]: registerToRegisterLd(reg, 'D'),
    [baseInstr++]: registerToRegisterLd(reg, 'E'),
    [baseInstr++]: registerToRegisterLd(reg, 'H'),
    [baseInstr++]: registerToRegisterLd(reg, 'L'),
    [baseInstr++]: memoryAtHLToRegister(reg),
    [baseInstr++]: registerToRegisterLd(reg, 'A'),
  };
};

const loadRegisterImmediate8 = (
  register: RegisterNames
): InstructionFunction => {
  return (registers, ram) => {
    registers.setRegister(register, ram.read(registers.PC + 1) & 0xff);
  };
};

const loadImmediateMemoryWithRegister = (
  register: RegisterNames
): InstructionFunction => {
  return (registers, memory) => {
    const addr = getImmediate16(registers, memory);
    memory.write(addr, registers.getRegister(register));
  };
};

const loadAFromAddressCallback = (
  cb: (registers: RegisterSet) => number
): InstructionFunction => {
  return (registers, memory) => {
    registers.A = memory.read(cb(registers));
  };
};

const loadSPImmediate16: InstructionFunction = (registers, memory) => {
  const v = getImmediate16(registers, memory);
  registers.SP = v;
};

const writeSPToMemory: InstructionFunction = (registers, memory) => {
  const addr = getImmediate16(registers, memory);
  memory.write(addr, registers.SP & 0xff);
  memory.write(addr + 1, (registers.SP & 0xff00) >> 8);
};

const loadAToOffsetImmediate8: InstructionFunction = (registers, memory) => {
  const addr = getImmediate8(registers, memory);
  memory.write(0xff00 + addr, registers.A);
};

const instructionMap: InstructionMap = {
  0x6: loadRegisterImmediate8('B'),
  0x8: writeSPToMemory,
  0xa: loadAFromAddressCallback((r) => r.BC),
  0xe: loadRegisterImmediate8('C'),
  0x16: loadRegisterImmediate8('D'),
  0x1a: loadAFromAddressCallback((r) => r.DE),
  0x1e: loadRegisterImmediate8('E'),
  0x26: loadRegisterImmediate8('H'),
  0x2e: loadRegisterImmediate8('L'),
  0x31: loadSPImmediate16,
  0x3e: loadRegisterImmediate8('A'),
  0xe0: loadAToOffsetImmediate8,
  0xea: loadImmediateMemoryWithRegister('A'),
  ...makeRegisterCopySet(0x40, 'B'),
  ...makeRegisterCopySet(0x48, 'C'),
  ...makeRegisterCopySet(0x50, 'D'),
  ...makeRegisterCopySet(0x58, 'E'),
  ...makeRegisterCopySet(0x60, 'H'),
  ...makeRegisterCopySet(0x68, 'L'),
  ...makeRegisterCopySet(0x78, 'A'),
};

export default instructionMap;
