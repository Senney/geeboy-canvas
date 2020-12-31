import { InstructionFunction, InstructionMap } from './types';

const noop: InstructionFunction = () => {
  return;
};

const instructionMap: InstructionMap = {
  0x00: noop,
};

export default instructionMap;
