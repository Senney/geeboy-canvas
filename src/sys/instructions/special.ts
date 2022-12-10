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

const daa: InstructionFunction = (registers) => {
  const flags = registers.flags;
  if (!flags.subtract) {
    if (flags.carry || registers.A > 0x99) {
      registers.A += 0x60;
      registers.setFlags({ carry: 1 });
    }

    if (flags.halfCarry || (registers.A & 0xf) > 0x9) {
      registers.A += 0x6;
    }
  } else {
    if (flags.carry) {
      registers.A -= 0x60;
    }
    if (flags.halfCarry) {
      registers.A -= 0x6;
    }
  }

  registers.setFlags({ zero: registers.A === 0 ? 1 : 0, halfCarry: 0 });
};

const instructionMap: InstructionMap = {
  0x00: noop,
  0x27: daa,
  0xf3: disableInterrupts,
  0xfb: enableInterrupts,
};

export default instructionMap;
