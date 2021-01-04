import { InstructionFunction, InstructionMap } from './types';
import { RegisterNames, RegisterSet } from '../RegisterSet';
import { getImmediate8, zeroFlag } from './util';

type LogicFn = (registers: RegisterSet) => (op1: number, op2: number) => void;

const ander = (registers: RegisterSet) => (op1: number, op2: number) => {
  const res = op1 & op2;
  registers.A = res;
  registers.setFlags({
    zero: zeroFlag(res),
    subtract: 0,
    halfCarry: 1,
    carry: 0,
  });
};

const orer = (registers: RegisterSet) => (op1: number, op2: number) => {
  const res = op1 | op2;
  registers.A = res;
  registers.setFlags({
    zero: zeroFlag(res),
    subtract: 0,
    halfCarry: 0,
    carry: 0,
  });
};

const xorer = (registers: RegisterSet) => (op1: number, op2: number) => {
  const res = op1 ^ op2;
  registers.A = res;
  registers.setFlags({
    zero: zeroFlag(res),
    subtract: 0,
    halfCarry: 0,
    carry: 0,
  });
};

const fnImmediate8 = (logicFn: LogicFn): InstructionFunction => (
  registers,
  memory
) => {
  logicFn(registers)(registers.A, getImmediate8(registers, memory));
};

const fnHLMemory = (logicFn: LogicFn): InstructionFunction => (
  registers,
  memory
) => {
  logicFn(registers)(registers.A, memory.read(registers.HL));
};

const fnR8 = (logicFn: LogicFn) => (
  register: RegisterNames
): InstructionFunction => {
  return (registers) => {
    logicFn(registers)(registers.A, registers.getRegister(register));
  };
};

const generateLogicFns = (logicFn: LogicFn, baseAddr: number) => {
  return {
    [baseAddr++]: fnR8(logicFn)('B'),
    [baseAddr++]: fnR8(logicFn)('C'),
    [baseAddr++]: fnR8(logicFn)('D'),
    [baseAddr++]: fnR8(logicFn)('E'),
    [baseAddr++]: fnR8(logicFn)('H'),
    [baseAddr++]: fnR8(logicFn)('L'),
    [baseAddr++]: fnHLMemory(logicFn),
    [baseAddr++]: fnR8(logicFn)('A'),
  };
};

const setBitInValue = (bit: number, value: number) => {
  if (bit < 0 || bit > 7) {
    throw new Error('Bit must be between 0 and 7');
  }

  const mask = (0x1 << bit) ^ 0xff;
  return value & mask;
};

const setBitInRegister = (
  register: RegisterNames,
  bit: number
): InstructionFunction => (registers) => {
  const value = registers.getRegister(register);
  registers.setRegister(register, setBitInValue(bit, value));
};

const setBitInMemory = (bit: number): InstructionFunction => (
  registers,
  memory
) => {
  const value = memory.read(registers.HL);
  memory.write(registers.HL, setBitInValue(bit, value));
};

const testBitInValue = (bit: number, value: number) => {
  const mask = 0x1 << bit;
  return (value & mask) > 0;
};

const testBitInRegister = (
  register: RegisterNames,
  bit: number
): InstructionFunction => (registers) => {
  const v = registers.getRegister(register);
  registers.setFlags({
    zero: testBitInValue(bit, v) ? 0 : 1,
    subtract: 0,
    halfCarry: 1,
  });
};

const testBitInMemory = (bit: number): InstructionFunction => (
  registers,
  memory
) => {
  const v = memory.read(registers.HL);
  registers.setFlags({
    zero: testBitInValue(bit, v) ? 0 : 1,
    subtract: 0,
    halfCarry: 1,
  });
};

const generateBitFunctions = (): InstructionMap => {
  const regOrder = ['B', 'C', 'D', 'E', 'H', 'L', 'HL', 'A'];
  const baseBitInstructionIdx = 0x40;
  const baseResInstructionIdx = 0x80;
  const instructions: InstructionMap = {};

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < regOrder.length; j++) {
      const reg = regOrder[j];
      const instr = 0xcb00 | (baseBitInstructionIdx + i * 8 + j);
      if (reg === 'HL') {
        instructions[instr] = testBitInMemory(i);
      } else {
        instructions[instr] = testBitInRegister(reg as RegisterNames, i);
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < regOrder.length; j++) {
      const reg = regOrder[j];
      const instr = 0xcb00 | (baseResInstructionIdx + i * 8 + j);
      if (reg === 'HL') {
        instructions[instr] = setBitInMemory(i);
      } else {
        instructions[instr] = setBitInRegister(reg as RegisterNames, i);
      }
    }
  }

  return instructions;
};

const complement = (registers: RegisterSet): void => {
  registers.A = ~registers.A & 0xff;
};

const complementCarry = (registers: RegisterSet): void => {
  registers.setFlags({
    carry: ~registers.flags.zero & 0x1,
  });
};

const setCarryFlag = (registers: RegisterSet): void => {
  registers.setFlags({
    subtract: 0,
    halfCarry: 0,
    carry: 1,
  });
};

const instructionMap: InstructionMap = {
  ...generateLogicFns(ander, 0xa0),
  ...generateLogicFns(xorer, 0xa8),
  ...generateLogicFns(orer, 0xb0),
  ...generateBitFunctions(),
  0x2f: complement,
  0x37: setCarryFlag,
  0x3f: complementCarry,
  0xe6: fnImmediate8(ander),
  0xee: fnImmediate8(xorer),
  0xf6: fnImmediate8(orer),
};

export default instructionMap;
