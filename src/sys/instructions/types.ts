import { RegisterSet } from '../RegisterSet';
import { RAM } from '../../mem/RAM';

export type InstructionFunction = (
  registers: RegisterSet,
  ram: RAM
) => number | void;
export type InstructionMap = Record<number, InstructionFunction>;
