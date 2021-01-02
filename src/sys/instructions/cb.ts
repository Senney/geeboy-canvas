import { RegisterNames, RegisterSet } from '../RegisterSet';
import { InstructionFunction, InstructionMap } from './types';
import { generateInstructionsSingleRegisterWithHL } from './util';

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
      zero: newValue === 0 ? 1 : 0,
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
    zero: newValue === 0 ? 1 : 0,
  });
};

const swapRegisterBits = (register: RegisterNames): InstructionFunction => {
  return (registers) => {
    const v = registers.getRegister(register);
    const swapped = ((v & 0b00001111) << 4) | ((v & 0b11110000) << 4);
    registers.setRegister(register, swapped);
    registers.setFlags({
      zero: swapped === 0 ? 1 : 0,
      carry: 0,
      halfCarry: 0,
      subtract: 0,
    });
  };
};

const swapHLBits: InstructionFunction = (registers, memory) => {
  const addr = registers.HL;
  const v = memory.read(addr);
  const swapped = ((v & 0b00001111) << 4) | ((v & 0b11110000) << 4);
  memory.write(addr, swapped);
  registers.setFlags({
    zero: swapped === 0 ? 1 : 0,
    carry: 0,
    halfCarry: 0,
    subtract: 0,
  });
};

const rotateRightInternal = (registers: RegisterSet, value: number): number => {
  const lsb = value & 0b1;
  const msb = lsb << 7;
  const rotated = (value >> 1) | msb;

  registers.setFlags({
    zero: rotated === 0 ? 1 : 0,
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

const instructionMap: InstructionMap = {
  0xcb30: swapRegisterBits('B'),
  0xcb31: swapRegisterBits('C'),
  0xcb32: swapRegisterBits('D'),
  0xcb33: swapRegisterBits('E'),
  0xcb34: swapRegisterBits('H'),
  0xcb35: swapRegisterBits('L'),
  0xcb36: swapHLBits,
  0xcb37: swapRegisterBits('A'),
  0xcb38: shiftRegisterRight('B'),
  0xcb39: shiftRegisterRight('C'),
  0xcb3a: shiftRegisterRight('D'),
  0xcb3b: shiftRegisterRight('E'),
  0xcb3c: shiftRegisterRight('H'),
  0xcb3d: shiftRegisterRight('L'),
  0xcb3e: shiftHLRight,
  0xcb3f: shiftRegisterRight('A'),
  0x1f: rotateRight('A'),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb18,
    rotateRight,
    rotateRightMemory
  ),
};

export default instructionMap;
