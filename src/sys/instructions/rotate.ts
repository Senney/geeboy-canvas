import { InstructionFunction, InstructionMap } from './types';
import { RegisterNames, RegisterSet } from '../RegisterSet';
import { generateInstructionsSingleRegisterWithHL, zeroFlag } from './util';

const shiftRegisterRight = (register: RegisterNames): InstructionFunction => {
  return (registers) => {
    const value = registers.getRegister(register);
    const newValue = value >> 1;
    const lsb = value & 0b1;
    registers.setRegister(register, newValue);
    registers.setFlags({
      carry: lsb,
      halfCarry: 0,
      subtract: 0,
      zero: zeroFlag(newValue),
    });
  };
};

const shiftHLRight: InstructionFunction = (registers, memory) => {
  const value = memory.read(registers.HL);
  const newValue = value >> 1;
  const lsb = value & 0b1;
  memory.write(registers.HL, newValue);
  registers.setFlags({
    carry: lsb,
    halfCarry: 0,
    subtract: 0,
    zero: zeroFlag(newValue),
  });
};

const shiftLeft = (register: RegisterNames): InstructionFunction => (
  registers
) => {
  const v = registers.getRegister(register);
  const msb = v & (0b1 << 7);
  const newValue = v << 1;

  registers.setRegister(register, newValue);
  registers.setFlags({
    zero: zeroFlag(newValue),
    subtract: 0,
    halfCarry: 0,
    carry: msb,
  });
};

const shiftLeftMemory = (): InstructionFunction => (registers, memory) => {
  const v = memory.read(registers.HL);
  const msb = v & (0b1 << 7);
  const newValue = v << 1;

  memory.write(registers.HL, newValue);
  registers.setFlags({
    zero: zeroFlag(newValue),
    subtract: 0,
    halfCarry: 0,
    carry: msb,
  });
};

const shiftRightArithmetic = (register: RegisterNames): InstructionFunction => (
  registers
) => {
  const value = registers.getRegister(register);
  const msb = value & (0b1 << 7);
  const lsb = value & 0b1;
  const newValue = (value >> 1) | msb;
  registers.setRegister(register, newValue);
  registers.setFlags({
    zero: zeroFlag(newValue),
    subtract: 0,
    halfCarry: 0,
    carry: lsb,
  });
};

const shiftRightArithmeticMemory = (): InstructionFunction => (
  registers,
  memory
) => {
  const value = memory.read(registers.HL);
  const msb = value & (0b1 << 7);
  const lsb = value & 0b1;
  const newValue = (value >> 1) | msb;
  memory.write(registers.HL, newValue);
  registers.setFlags({
    zero: zeroFlag(newValue),
    subtract: 0,
    halfCarry: 0,
    carry: lsb,
  });
};

const rotateRightInternal = (registers: RegisterSet, value: number): number => {
  const lsb = value & 0b1;
  const msb = registers.flags.carry << 7;
  const rotated = (value >> 1) | msb;

  registers.setFlags({
    zero: zeroFlag(rotated),
    subtract: 0,
    halfCarry: 0,
    carry: lsb,
  });
  return rotated;
};

const rotateRight = (register: RegisterNames): InstructionFunction => (
  registers
) => {
  const value = registers.getRegister(register);
  const rotated = rotateRightInternal(registers, value);
  registers.setRegister(register, rotated);
};

const rotateRightMemory = (): InstructionFunction => (registers, memory) => {
  const v = memory.read(registers.HL);
  const rotated = rotateRightInternal(registers, v);
  memory.write(registers.HL, rotated);
};

const rotateRightCarry = (register: RegisterNames): InstructionFunction => (
  registers
) => {
  const value = registers.getRegister(register);
  const lsb = value & 0b1;
  const newValue = value | (lsb << 7);
  registers.setRegister(register, newValue);
  registers.setFlags({
    zero: zeroFlag(newValue),
    subtract: 0,
    halfCarry: 0,
    carry: lsb,
  });
};

const rotateRightCarryMemory = (): InstructionFunction => (
  registers,
  memory
) => {
  const value = memory.read(registers.HL);
  const lsb = value & 0b1;
  const newValue = value | (lsb << 7);
  memory.write(registers.HL, newValue);
  registers.setFlags({
    zero: zeroFlag(newValue),
    subtract: 0,
    halfCarry: 0,
    carry: lsb,
  });
};

const rlc = (register: RegisterNames): InstructionFunction => (registers) => {
  const value = registers.getRegister(register);
  const msb = (value & (0x1 << 7)) >> 7;
  registers.setRegister(register, (value << 1) | msb);
  registers.setFlags({
    zero: register === 'A' ? 0 : zeroFlag(value),
    subtract: 0,
    halfCarry: 0,
    carry: msb,
  });
};

const rlcMemory = (): InstructionFunction => (registers, memory) => {
  const value = memory.read(registers.HL);
  const msb = (value & (0x1 << 7)) >> 7;
  memory.write(registers.HL, (value << 1) | msb);
  registers.setFlags({
    zero: zeroFlag(value),
    subtract: 0,
    halfCarry: 0,
    carry: msb,
  });
};

const rl = (register: RegisterNames): InstructionFunction => (registers) => {
  const value = registers.getRegister(register);
  const msb = (value & (0x1 << 7)) >> 7;
  const newValue = (value << 1) | registers.flags.carry;
  registers.setRegister(register, newValue);
  registers.setFlags({
    zero: register === 'A' ? 0 : zeroFlag(newValue),
    subtract: 0,
    halfCarry: 0,
    carry: msb,
  });
};

const rlMemory = (): InstructionFunction => (registers, memory) => {
  const value = memory.read(registers.HL);
  const msb = (value & (0x1 << 7)) >> 7;
  const newValue = (value << 1) | registers.flags.carry;
  memory.write(registers.HL, newValue);
  registers.setFlags({
    zero: zeroFlag(value),
    subtract: 0,
    halfCarry: 0,
    carry: msb,
  });
};

const instructionMap: InstructionMap = {
  0x07: rlc('A'),
  0x0f: rotateRightCarry('A'),
  0x17: rl('A'),
  0x1f: rotateRight('A'),
  ...generateInstructionsSingleRegisterWithHL(0xcb00, rlc, rlcMemory),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb08,
    rotateRightCarry,
    rotateRightCarryMemory
  ),
  ...generateInstructionsSingleRegisterWithHL(0xcb10, rl, rlMemory),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb18,
    rotateRight,
    rotateRightMemory
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb20,
    shiftLeft,
    shiftLeftMemory
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb28,
    shiftRightArithmetic,
    shiftRightArithmeticMemory
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb38,
    shiftRegisterRight,
    () => shiftHLRight
  ),
};

export default instructionMap;
