/**
 * For each of the jump instructions, we subtract the size of that instruction to negate the PC increment.
 */

import { InstructionMetadata } from '../InstructionMetadata';
import { Flags } from '../RegisterSet';
import { InstructionFunction, InstructionMap } from './types';
import { getImmediate16, getImmediate16Signed, getImmediate8 } from './util';

const jumpImmediate16: InstructionFunction = (registers, memory, _, meta) => {
  registers.PC = getImmediate16(registers, memory) - meta.size;
};

const jumpRelative8: InstructionFunction = (registers, memory, _, meta) => {
  registers.PC = registers.PC + getImmediate8(registers, memory) - meta.size;
};

const jumpRelativeIfConditionMet = (
  condition: keyof Flags,
  conditionValue: number
): InstructionFunction => (registers, memory, _, meta) => {
  if (registers.getFlag(condition) === conditionValue) {
    // Cast from unsigned integer to signed. No idea if this works. :)
    // We may need to offset by the meta.size.
    registers.PC =
      registers.PC + getImmediate16Signed(registers, memory) - meta.size;
    return meta.cycles[0];
  }

  return meta.cycles[1];
};

const jumpIfConditionMet = (
  condition: keyof Flags,
  conditionValue: number
): InstructionFunction => (registers, memory, _, meta) => {
  if (registers.getFlag(condition) === conditionValue) {
    // Cast from unsigned integer to signed. No idea if this works. :)
    // We may need to offset by the meta.size.
    registers.PC = getImmediate16Signed(registers, memory) - meta.size;
    return meta.cycles[0];
  }

  return meta.cycles[meta.cycles.length - 1];
};

const instructionMap: InstructionMap = {
  0x18: jumpRelative8,
  0x20: jumpRelativeIfConditionMet('zero', 0),
  0x28: jumpRelativeIfConditionMet('zero', 1),
  0x30: jumpRelativeIfConditionMet('carry', 0),
  0x38: jumpRelativeIfConditionMet('carry', 1),
  0xc2: jumpIfConditionMet('zero', 0),
  0xc3: jumpImmediate16,
  0xca: jumpIfConditionMet('zero', 1),
  0xd2: jumpIfConditionMet('carry', 0),
  0xda: jumpIfConditionMet('carry', 1),
  0xe9: function jumpHL(registers) {
    registers.PC = registers.HL - InstructionMetadata.get(0xe9).size;
  },
};

export default instructionMap;
