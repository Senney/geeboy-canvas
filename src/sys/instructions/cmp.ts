import { RegisterNames, RegisterSet } from '../RegisterSet';
import { InstructionFunction, InstructionMap } from './types';
import { getImmediate8, halfCarryFlag8, zeroFlag } from './util';

const compare = (registers: RegisterSet) => (op1: number, op2: number) => {
  const v = op1 - op2;
  registers.setFlags({
    zero: zeroFlag(v),
    subtract: 1,
    halfCarry: halfCarryFlag8(op1, op2, 'SUB'),
    carry: op1 < op2 ? 1 : 0,
  });
};

const compareAToRegister = (register: RegisterNames): InstructionFunction => {
  return (registers) => {
    compare(registers)(registers.A, registers.getRegister(register));
  };
};

const compareAToHLMemory: InstructionFunction = (registers, memory) => {
  compare(registers)(registers.A, memory.read(registers.HL));
};

const compareAImmediate8: InstructionFunction = (registers, memory) => {
  compare(registers)(registers.A, getImmediate8(registers, memory));
};

const instructionMap: InstructionMap = {
  0xb8: compareAToRegister('B'),
  0xb9: compareAToRegister('C'),
  0xba: compareAToRegister('D'),
  0xbb: compareAToRegister('E'),
  0xbc: compareAToRegister('H'),
  0xbd: compareAToRegister('L'), 
  0xbe: compareAToHLMemory,
  0xbf: compareAToRegister('A'),
  0xfe: compareAImmediate8,
};

export default instructionMap;
