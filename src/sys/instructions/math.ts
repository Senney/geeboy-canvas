import { RegisterNames, RegisterSet } from '../RegisterSet';
import { InstructionFunction, InstructionMap } from './types';
import { getImmediate8, unsigned } from './util';

const subtractor = (
  registers: RegisterSet
): ((r1: number, r2: number) => number) => {
  return (r1, r2) => {
    const r = r1 - r2;
    registers.setFlags({
      carry: r < 0 ? 1 : 0,
      halfCarry: (((r1 & 0xf) - (r2 & 0xf)) & 0x10) > 0 ? 1 : 0,
      subtract: 1,
      zero: r === 0 ? 1 : 0,
    });

    return unsigned(r);
  };
};

const subtractCarry = (registers: RegisterSet) => (v1: number, v2: number) => {
  const r = v1 - v2 - registers.flags.carry;
  registers.setFlags({
    carry: r < 0 ? 1 : 0,
    halfCarry: (((v1 & 0xf) - (v2 & 0xf)) & 0x10) > 0 ? 1 : 0,
    subtract: 1,
    zero: r === 0 ? 1 : 0,
  });

  return unsigned(r);
};

const adder = (registers: RegisterSet) => (v1: number, v2: number) => {
  const result = v1 + v2;
  registers.setFlags({
    zero: result === 0 ? 1 : 0,
    subtract: 0,
    halfCarry: (((v1 & 0xf) + (v2 & 0xf)) & 0x10) > 0 ? 1 : 0,
    carry: result > 0xff ? 1 : 0,
  });
  return unsigned(result);
};

const addCarry = (registers: RegisterSet) => (v1: number, v2: number) => {
  const result = v1 + v2 + registers.flags.carry;
  registers.setFlags({
    zero: result === 0 ? 1 : 0,
    subtract: 0,
    halfCarry: (((v1 & 0xf) + (v2 & 0xf)) & 0x10) > 0 ? 1 : 0,
    carry: result > 0xff ? 1 : 0,
  });
  return unsigned(result);
};

const fnRegisterImmediate8 = (
  fn: (registers: RegisterSet) => (v1: number, v2: number) => number,
  register: RegisterNames
): InstructionFunction => {
  return (registers, memory) => {
    const value = registers.getRegister(register);
    const immediate = getImmediate8(registers, memory);
    const ret = fn(registers)(value, immediate);
    registers.setRegister(register, ret);
  };
};

const fnRegisterRegister = (
  fn: (registers: RegisterSet) => (v1: number, v2: number) => number,
  dst: RegisterNames,
  src: RegisterNames
): InstructionFunction => (registers) => {
  const v1 = registers.getRegister(dst);
  const v2 = registers.getRegister(src);
  const res = fn(registers)(v1, v2);
  registers.setRegister(dst, res);
};

const fnRegisterHLMemory = (
  fn: (registers: RegisterSet) => (v1: number, v2: number) => number,
  dst: RegisterNames
): InstructionFunction => (registers, memory) => {
  const v1 = registers.getRegister(dst);
  const v2 = memory.read(registers.HL);
  const res = fn(registers)(v1, v2);
  registers.setRegister(dst, res);
};

const incrementRegister = (register: RegisterNames): InstructionFunction => {
  return (registers) => {
    const v = registers.getRegister(register);
    const hc = (((v & 0xf) + 1) & 0xf0) > 0;
    const res = (v + 1) & 0xff;
    registers.setRegister(register, res);
    registers.setFlags({
      zero: res === 0 ? 1 : 0,
      subtract: 0,
      halfCarry: hc ? 1 : 0,
    });
  };
};

const decrementRegister = (register: RegisterNames): InstructionFunction => {
  return (registers) => {
    const v = registers.getRegister(register);
    const hc = (((v & 0xf) - 1) & 0xf0) > 0;
    const res = (v - 1) & 0xff;
    registers.setRegister(register, res);
    registers.setFlags({
      zero: res === 0 ? 1 : 0,
      subtract: 0,
      halfCarry: hc ? 1 : 0,
    });
  };
};

const instructionMap: InstructionMap = {
  0x03: (register) => {
    register.BC++;
  },
  0x04: incrementRegister('B'),
  0x05: decrementRegister('B'),
  0x0b: (register) => {
    register.BC--;
  },
  0x0c: incrementRegister('C'),
  0x0d: decrementRegister('C'),
  0x13: (register) => {
    register.DE++;
  },
  0x14: incrementRegister('D'),
  0x15: decrementRegister('D'),
  0x1b: (register) => {
    register.DE--;
  },
  0x1c: incrementRegister('E'),
  0x1d: decrementRegister('E'),
  0x23: (register) => {
    register.HL++;
  },
  0x24: incrementRegister('H'),
  0x25: decrementRegister('H'),
  0x2b: (register) => {
    register.HL--;
  },
  0x2c: incrementRegister('L'),
  0x2d: decrementRegister('L'),
  0x33: (register) => {
    register.SP++;
  },
  0x3b: (register) => {
    register.SP--;
  },
  0x3c: incrementRegister('A'),
  0x3d: decrementRegister('A'),
  0x80: fnRegisterRegister(adder, 'A', 'B'),
  0x81: fnRegisterRegister(adder, 'A', 'C'),
  0x82: fnRegisterRegister(adder, 'A', 'D'),
  0x83: fnRegisterRegister(adder, 'A', 'E'),
  0x84: fnRegisterRegister(adder, 'A', 'H'),
  0x85: fnRegisterRegister(adder, 'A', 'L'),
  0x86: fnRegisterHLMemory(adder, 'A'),
  0x87: fnRegisterRegister(adder, 'A', 'A'),
  0x88: fnRegisterRegister(addCarry, 'A', 'B'),
  0x89: fnRegisterRegister(addCarry, 'A', 'C'),
  0x8a: fnRegisterRegister(addCarry, 'A', 'D'),
  0x8b: fnRegisterRegister(addCarry, 'A', 'E'),
  0x8c: fnRegisterRegister(addCarry, 'A', 'H'),
  0x8d: fnRegisterRegister(addCarry, 'A', 'L'),
  0x8e: fnRegisterHLMemory(addCarry, 'A'),
  0x8f: fnRegisterRegister(addCarry, 'A', 'A'),
  0x90: fnRegisterRegister(subtractor, 'A', 'B'),
  0x91: fnRegisterRegister(subtractor, 'A', 'C'),
  0x92: fnRegisterRegister(subtractor, 'A', 'D'),
  0x93: fnRegisterRegister(subtractor, 'A', 'E'),
  0x94: fnRegisterRegister(subtractor, 'A', 'H'),
  0x95: fnRegisterRegister(subtractor, 'A', 'L'),
  0x96: fnRegisterHLMemory(subtractor, 'A'),
  0x97: fnRegisterRegister(subtractor, 'A', 'A'),
  0x98: fnRegisterRegister(subtractCarry, 'A', 'B'),
  0x99: fnRegisterRegister(subtractCarry, 'A', 'C'),
  0x9a: fnRegisterRegister(subtractCarry, 'A', 'D'),
  0x9b: fnRegisterRegister(subtractCarry, 'A', 'E'),
  0x9c: fnRegisterRegister(subtractCarry, 'A', 'H'),
  0x9d: fnRegisterRegister(subtractCarry, 'A', 'L'),
  0x9e: fnRegisterHLMemory(subtractCarry, 'A'),
  0x9f: fnRegisterRegister(subtractCarry, 'A', 'A'),
  0xc6: fnRegisterImmediate8(adder, 'A'),
  0xce: fnRegisterImmediate8(addCarry, 'A'),
  0xd6: fnRegisterImmediate8(subtractor, 'A'),
  0xde: fnRegisterImmediate8(subtractCarry, 'A'),
};

export default instructionMap;
