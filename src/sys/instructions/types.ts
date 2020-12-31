import { RegisterSet } from '../RegisterSet';
import { RAM } from '../../mem/RAM';
import { CPU } from '../CPU';
import { InstructionMetadataRecord } from '../InstructionMetadata';

export type InstructionFunction = (
  registers: RegisterSet,
  ram: RAM,
  cpu: CPU,
  instructionMeta: InstructionMetadataRecord
) => number | void;
export type InstructionMap = Record<number, InstructionFunction>;
