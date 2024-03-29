import { RAM } from '../../mem/RAM';
import { RegisterNames, RegisterSet } from '../RegisterSet';
import { InstructionFunction, InstructionMap } from './types';

export const combineRegisters = (
  register: RegisterSet,
  r1: RegisterNames,
  r2: RegisterNames
): number => {
  const v1 = register.getRegister(r1);
  const v2 = register.getRegister(r2);

  return ((v1 << 8) | v2) & 0xffff;
};

export const getImmediate8 = (registers: RegisterSet, memory: RAM): number => {
  return memory.read(registers.PC + 1);
};

export const getImmediate8Signed = (
  registers: RegisterSet,
  memory: RAM
): number => {
  return signed(getImmediate8(registers, memory));
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

export const signed16 = (value: number): number => {
  return Int16Array.from([value])[0];
};

export const unsigned16 = (value: number): number => {
  return Uint16Array.from([value])[0];
}

export const mergeInstructionSets = (
  sets: InstructionMap[]
): InstructionMap => {
  return sets.reduce((instructionSet, currentSet) => {
    const keys = Object.keys(currentSet);
    const duplicates = keys.filter((k) => instructionSet[k] !== undefined);
    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate instruction definitions detected: ${duplicates}`
      );
    }

    return Object.assign(instructionSet, currentSet);
  }, {} as InstructionMap);
};

export const generateInstructionsSingleRegisterWithHL = (
  baseInstr: number,
  normalFn: (src: RegisterNames) => InstructionFunction,
  hlFn: () => InstructionFunction
): InstructionMap => {
  return {
    [baseInstr++]: normalFn('B'),
    [baseInstr++]: normalFn('C'),
    [baseInstr++]: normalFn('D'),
    [baseInstr++]: normalFn('E'),
    [baseInstr++]: normalFn('H'),
    [baseInstr++]: normalFn('L'),
    [baseInstr++]: hlFn(),
    [baseInstr++]: normalFn('A'),
  };
};

export const generateInstructionsWithHL = (
  baseInstr: number,
  dstReg: RegisterNames,
  normalFn: (dst: RegisterNames, src: RegisterNames) => InstructionFunction,
  hlFn: (dst?: RegisterNames) => InstructionFunction
): InstructionMap => {
  return {
    [baseInstr++]: normalFn(dstReg, 'B'),
    [baseInstr++]: normalFn(dstReg, 'C'),
    [baseInstr++]: normalFn(dstReg, 'D'),
    [baseInstr++]: normalFn(dstReg, 'E'),
    [baseInstr++]: normalFn(dstReg, 'H'),
    [baseInstr++]: normalFn(dstReg, 'L'),
    [baseInstr++]: hlFn(dstReg),
    [baseInstr++]: normalFn(dstReg, 'A'),
  };
};

export const zeroFlag = (value: number): number => {
  return (value & 0xff) === 0 ? 1 : 0;
};

const carry = (opMask: number, resultMask: number): (op1: number, op2: number, operand?: 'SUB' | 'ADD') => number => {
  return (op1: number, op2: number, operand: 'SUB' | 'ADD' = 'ADD'): number => {
    const maskedOp1 = op1 & opMask;
    const maskedOp2 = op2 & opMask;
    const result = operand === 'ADD' 
      ? ((maskedOp1 + maskedOp2) & resultMask) === resultMask 
      : ((maskedOp1 - maskedOp2) & resultMask) === resultMask;

    return result ? 1 : 0;
  }
}

export const carryFlag8 = carry(0xff, 0x100);
export const carryFlag16 = carry(0xffff, 0x10000);
export const halfCarryFlag8 = carry(0xf, 0x10);
export const halfCarryFlag16 = carry(0x0fff, 0x1000);
