import { InstructionFunction, InstructionMap } from './types';
import { RegisterNames } from '../RegisterSet';
import { getImmediate16 } from './util';

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
    [baseInstr]: registerToRegisterLd(reg, 'B'),
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

const instructionMap: InstructionMap = {
  0x6: loadRegisterImmediate8('B'),
  0xe: loadRegisterImmediate8('C'),
  0x16: loadRegisterImmediate8('D'),
  0x1e: loadRegisterImmediate8('E'),
  0x26: loadRegisterImmediate8('H'),
  0x2e: loadRegisterImmediate8('L'),
  0x3e: loadRegisterImmediate8('A'),
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
