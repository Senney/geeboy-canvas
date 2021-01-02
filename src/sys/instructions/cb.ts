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

const generateSetBitInstruction = (bit: number) => (
  register: RegisterNames
): InstructionFunction => (registers) => {
  const v = registers.getRegister(register);
  const mask = 0b1 << bit;
  registers.setRegister(register, v | mask);
};

const generateSetHLMemoryBitInstruction = (
  bit: number
) => (): InstructionFunction => (registers, memory) => {
  const v = memory.read(registers.HL);
  const mask = 0b1 << bit;
  memory.write(registers.HL, v | mask);
};

const instructionMap: InstructionMap = {
  ...generateInstructionsSingleRegisterWithHL(
    0xcb30,
    swapRegisterBits,
    () => swapHLBits
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb38,
    shiftRegisterRight,
    () => shiftHLRight
  ),
  0x1f: rotateRight('A'),
  ...generateInstructionsSingleRegisterWithHL(
    0xcb18,
    rotateRight,
    rotateRightMemory
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbc0,
    generateSetBitInstruction(0),
    generateSetHLMemoryBitInstruction(0)
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbc8,
    generateSetBitInstruction(1),
    generateSetHLMemoryBitInstruction(1)
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbd0,
    generateSetBitInstruction(2),
    generateSetHLMemoryBitInstruction(2)
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbd8,
    generateSetBitInstruction(3),
    generateSetHLMemoryBitInstruction(3)
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbe0,
    generateSetBitInstruction(4),
    generateSetHLMemoryBitInstruction(4)
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbe8,
    generateSetBitInstruction(5),
    generateSetHLMemoryBitInstruction(5)
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbf0,
    generateSetBitInstruction(6),
    generateSetHLMemoryBitInstruction(6)
  ),
  ...generateInstructionsSingleRegisterWithHL(
    0xcbf8,
    generateSetBitInstruction(7),
    generateSetHLMemoryBitInstruction(7)
  ),
};

export default instructionMap;
