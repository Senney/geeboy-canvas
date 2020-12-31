/**
 * For each of the jump instructions, we subtract the size of that instruction to negate the PC increment.
 */

import { InstructionMetadata } from '../InstructionMetadata';
import { InstructionFunction, InstructionMap } from './types';
import { getImmediate16, getImmediate16Signed } from './util';

const jumpImmediate16: InstructionFunction = (registers, memory) => {
  const size = InstructionMetadata.get(0xc6).size;
  registers.PC = getImmediate16(registers, memory) - size;
};

const jumpRelativeIfCarryUnset: InstructionFunction = (registers, memory) => {
  const meta = InstructionMetadata.get(0x30);
  if (registers.flags.carry === 0) {
    // Cast from unsigned integer to signed. No idea if this works. :)
    // We may need to offset by the meta.size.
    registers.PC =
      registers.PC + getImmediate16Signed(registers, memory) - meta.size;
    return meta.cycles[0];
  }

  return meta.cycles[1];
};

const instructionMap: InstructionMap = {
  0xc3: jumpImmediate16,
  0x30: jumpRelativeIfCarryUnset,
};

export default instructionMap;
