import { pop16PC } from './stack';
import { InstructionFunction, InstructionMap } from './types';

const ret: InstructionFunction = (registers, memory) => {
  const newPC = pop16PC(registers, memory);
  registers.PC = newPC;
};

const instructionMap: InstructionMap = {
  0xc9: ret,
};

export default instructionMap;
