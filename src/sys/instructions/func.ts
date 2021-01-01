import { pop16PC, push16 } from './stack';
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

const instructionMap: InstructionMap = {
  0xc9: ret,
  0xcd: call,
};

export default instructionMap;
