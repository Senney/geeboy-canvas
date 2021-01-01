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

const subtractRegisterImmediate8 = (
  register: RegisterNames
): InstructionFunction => {
  return (registers, memory) => {
    const value = registers.getRegister(register);
    const immediate = getImmediate8(registers, memory);
    const ret = subtractor(registers)(value, immediate);
    registers.setRegister(register, ret);
  };
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
  0x04: incrementRegister('B'),
  0x05: decrementRegister('B'),
  0x0c: incrementRegister('C'),
  0x0d: decrementRegister('C'),
  0x14: incrementRegister('D'),
  0x15: decrementRegister('D'),
  0x1c: incrementRegister('E'),
  0x1d: decrementRegister('E'),
  0x24: incrementRegister('H'),
  0x25: decrementRegister('H'),
  0x2c: incrementRegister('L'),
  0x2d: decrementRegister('L'),
  0x3c: incrementRegister('A'),
  0x3d: decrementRegister('A'),
  0xd6: subtractRegisterImmediate8('A'),
};

export default instructionMap;
