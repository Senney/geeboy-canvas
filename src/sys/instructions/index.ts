import specialInstructions from './special';
import loadInstructions from './ld';
import jumpInstructions from './jump';
import mathInstructions from './math';
import cbInstructions from './cb';

export const instructionSet = {
  ...specialInstructions,
  ...loadInstructions,
  ...jumpInstructions,
  ...mathInstructions,
  ...cbInstructions,
};
