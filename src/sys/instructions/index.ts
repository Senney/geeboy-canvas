import specialInstructions from './special';
import loadInstructions from './ld';
import jumpInstructions from './jump';
import mathInstructions from './math';
import cbInstructions from './cb';
import bitwiseInstructions from './bitwise';

export const instructionSet = {
  ...specialInstructions,
  ...loadInstructions,
  ...jumpInstructions,
  ...mathInstructions,
  ...cbInstructions,
  ...bitwiseInstructions,
};
