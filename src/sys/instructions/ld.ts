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
  memory.write(0xff00 | addr, registers.A);
};

const loadAToOffsetC: InstructionFunction = (registers, memory) => {
  memory.write(0xff00 | registers.C, registers.A);
};

const loadOffsetImmediate8ToA: InstructionFunction = (registers, memory) => {
  const addr = getImmediate8(registers, memory);
  registers.A = memory.read(0xff00 + addr);
};

const loadOffsetFromCToA: InstructionFunction = (registers, memory) => {
  registers.A = memory.read(0xff00 + registers.C);
};

const loadRegisterPairFromImmediate16 = (
  r1: RegisterNames,
  r2: RegisterNames
): InstructionFunction => {
  return (registers, memory) => {
    const val = getImmediate16(registers, memory);
    registers.setRegister(r1, (val & 0xff00) >> 8);
    registers.setRegister(r2, val & 0xff);
  };
};

const loadHLAndIncrement: InstructionFunction = (registers, memory) => {
  memory.write(registers.HL, registers.A);
  registers.HL++;
};

const loadHLAndDecrement: InstructionFunction = (registers, memory) => {
  memory.write(registers.HL, registers.A);
  registers.HL--;
};

const loadAAndIncrementHL: InstructionFunction = (register, memory) => {
  register.A = memory.read(register.HL);
  register.HL = register.HL + 1;
};

const loadAAndDecrementHL: InstructionFunction = (register, memory) => {
  register.A = memory.read(register.HL);
  register.HL = register.HL - 1;
};

const loadAToMemoryAtRegisterPair = (
  r1: RegisterNames,
  r2: RegisterNames
): InstructionFunction => {
  return (registers, memory) => {
    const addr = (registers.getRegister(r1) << 8) | registers.getRegister(r2);
    memory.write(addr, registers.A);
  };
};

const loadRegisterInToMemoryAtHL = (r: RegisterNames): InstructionFunction => (
  registers,
  memory
) => {
  memory.write(registers.HL, registers.getRegister(r));
};

const instructionMap: InstructionMap = {
  0x1: loadRegisterPairFromImmediate16('B', 'C'),
  0x2: loadAToMemoryAtRegisterPair('B', 'C'),
  0x6: loadRegisterImmediate8('B'),
  0x8: writeSPToMemory,
  0xa: loadAFromAddressCallback((r) => r.BC),
  0xe: loadRegisterImmediate8('C'),
  0x11: loadRegisterPairFromImmediate16('D', 'E'),
  0x12: loadAToMemoryAtRegisterPair('D', 'E'),
  0x16: loadRegisterImmediate8('D'),
  0x1a: loadAFromAddressCallback((r) => r.DE),
  0x1e: loadRegisterImmediate8('E'),
  0x21: loadRegisterPairFromImmediate16('H', 'L'),
  0x22: loadHLAndIncrement,
  0x26: loadRegisterImmediate8('H'),
  0x2a: loadAAndIncrementHL,
  0x2e: loadRegisterImmediate8('L'),
  0x31: loadSPImmediate16,
  0x32: loadHLAndDecrement,
  0x3a: loadAAndDecrementHL,
  0x3e: loadRegisterImmediate8('A'),
  0xe0: loadAToOffsetImmediate8,
  0xe2: loadAToOffsetC,
  0xea: loadImmediateMemoryWithRegister('A'),
  0xf0: loadOffsetImmediate8ToA,
  0xf2: loadOffsetFromCToA,
  0x70: loadRegisterInToMemoryAtHL('B'),
  0x71: loadRegisterInToMemoryAtHL('C'),
  0x72: loadRegisterInToMemoryAtHL('D'),
  0x73: loadRegisterInToMemoryAtHL('E'),
  0x74: loadRegisterInToMemoryAtHL('H'),
  0x75: loadRegisterInToMemoryAtHL('L'),
  0x77: loadRegisterInToMemoryAtHL('A'),
  ...makeRegisterCopySet(0x40, 'B'),
  ...makeRegisterCopySet(0x48, 'C'),
  ...makeRegisterCopySet(0x50, 'D'),
  ...makeRegisterCopySet(0x58, 'E'),
  ...makeRegisterCopySet(0x60, 'H'),
  ...makeRegisterCopySet(0x68, 'L'),
  ...makeRegisterCopySet(0x78, 'A'),
};

export default instructionMap;
