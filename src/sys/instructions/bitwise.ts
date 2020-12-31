import { InstructionFunction, InstructionMap } from './types';
import { RegisterNames, RegisterSet } from '../RegisterSet';
import { getImmediate8 } from './util';

type LogicFn = (registers: RegisterSet) => (op1: number, op2: number) => void;

const ander = (registers: RegisterSet) => (op1: number, op2: number) => {
  const res = op1 & op2;
  registers.A = res;
  registers.setFlags({
    zero: res === 0 ? 1 : 0,
    subtract: 0,
    halfCarry: 1,
    carry: 0,
  });
};

const orer = (registers: RegisterSet) => (op1: number, op2: number) => {
  const res = op1 | op2;
  registers.A = res;
  registers.setFlags({
    zero: res === 0 ? 1 : 0,
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

const instructionMap: InstructionMap = {
  0xa0: fnR8(ander)('B'),
  0xa1: fnR8(ander)('C'),
  0xa2: fnR8(ander)('D'),
  0xa3: fnR8(ander)('E'),
  0xa4: fnR8(ander)('H'),
  0xa5: fnR8(ander)('L'),
  0xa6: fnHLMemory(ander),
  0xa7: fnR8(ander)('A'),
  0xb0: fnR8(orer)('B'),
  0xb1: fnR8(orer)('C'),
  0xb2: fnR8(orer)('D'),
  0xb3: fnR8(orer)('E'),
  0xb4: fnR8(orer)('H'),
  0xb5: fnR8(orer)('L'),
  0xb6: fnHLMemory(orer),
  0xb7: fnR8(orer)('A'),
  0xe6: fnImmediate8(ander),
  0xf6: fnImmediate8(orer),
};

export default instructionMap;
