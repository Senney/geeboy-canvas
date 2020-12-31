import { InstructionFunction, InstructionMap } from './types';

const noop: InstructionFunction = () => {
  return;
};

const disableInterrupts: InstructionFunction = (_, __, cpu) => {
  cpu.disableInterrupts();
};

const enableInterrupts: InstructionFunction = (_, __, cpu) => {
  cpu.enableInterrupts();
};

const instructionMap: InstructionMap = {
  0x00: noop,
  0xf3: disableInterrupts,
  0xfb: enableInterrupts,
};

export default instructionMap;
