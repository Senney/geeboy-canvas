import { mergeInstructionSets } from './util';
import specialInstructions from './special';
import loadInstructions from './ld';
import jumpInstructions from './jump';
import mathInstructions from './math';
import cbInstructions from './cb';
import bitwiseInstructions from './bitwise';
import compareInstructions from './cmp';
import funcInstructions from './func';

export const instructionSet = mergeInstructionSets([
  specialInstructions,
  loadInstructions,
  jumpInstructions,
  mathInstructions,
  cbInstructions,
  bitwiseInstructions,
  compareInstructions,
  funcInstructions,
]);
