import { RegisterNames, RegisterSet } from '../RegisterSet';
import { pop16, pop16PC, push16 } from './stack';
import { InstructionFunction, InstructionMap } from './types';
import { getImmediate16 } from './util';

const ret: InstructionFunction = (registers, memory, _, meta) => {
  const newPC = pop16PC(registers, memory);
  registers.PC = newPC - meta.size;
};

const call: InstructionFunction = (registers, memory, _, meta) => {
  const nextInstr = registers.PC + meta.size;
  const addr = getImmediate16(registers, memory) - meta.size;
  push16(registers, memory, nextInstr);
  registers.PC = addr;
};

const push = (
  valueFn: (registers: RegisterSet) => number
): InstructionFunction => (registers, memory) => {
  push16(registers, memory, valueFn(registers));
};

const pop = (
  highReg: RegisterNames,
  lowReg: RegisterNames
): InstructionFunction => (registers, memory) => {
  pop16(registers, memory, highReg, lowReg);
};

const instructionMap: InstructionMap = {
  0xc1: pop('B', 'C'),
  0xc5: push((r) => r.BC),
  0xc9: ret,
  0xcd: call,
  0xd1: pop('D', 'E'),
  0xd5: push((r) => r.DE),
  0xe1: pop('H', 'L'),
  0xe5: push((r) => r.HL),
  0xf1: pop('A', 'F'),
  0xf5: push((r) => r.AF),
};

export default instructionMap;
