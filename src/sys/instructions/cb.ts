import { RegisterNames, RegisterSet } from '../RegisterSet';
import { InstructionFunction, InstructionMap } from './types';

const shiftRegisterRight = (register: RegisterNames): InstructionFunction => {
  return (registers) => {
    const value = registers.getRegister(register);
    const lsb = value & 0b1;
    registers.setRegister(register, value >> 1);
    registers.setFlags({
      carry: lsb,
      halfCarry: 0,
      subtract: 0,
      zero: value === 0 ? 1 : 0,
    });
  };
};

const shiftHLRight: InstructionFunction = (registers, memory) => {
  const value = memory.read(registers.HL);
  const lsb = value & 0b1;
  memory.write(registers.HL, value >> 1);
  registers.setFlags({
    carry: lsb,
    halfCarry: 0,
    subtract: 0,
    zero: value === 0 ? 1 : 0,
  });
};

const instructionMap: InstructionMap = {
  0xcb38: shiftRegisterRight('B'),
  0xcb39: shiftRegisterRight('C'),
  0xcb3a: shiftRegisterRight('D'),
  0xcb3b: shiftRegisterRight('E'),
  0xcb3c: shiftRegisterRight('H'),
  0xcb3d: shiftRegisterRight('L'),
  0xcb3e: shiftHLRight,
  0xcb3f: shiftRegisterRight('A'),
};

export default instructionMap;
