import { RAM } from '../../mem/RAM';
import { InstructionMetadataRecord } from '../InstructionMetadata';
import { Flags, RegisterNames, RegisterSet } from '../RegisterSet';
import { pop16, pop16PC, push16 } from './stack';
import { InstructionFunction, InstructionMap } from './types';
import { getImmediate16 } from './util';

const ret: InstructionFunction = (registers, memory, _, meta) => {
  const newPC = pop16PC(registers, memory);
  registers.PC = newPC - meta.size;
};

function callInternal(
  registers: RegisterSet,
  memory: RAM,
  meta: InstructionMetadataRecord
) {
  const nextInstr = registers.PC + meta.size;
  const addr = getImmediate16(registers, memory) - meta.size;
  push16(registers, memory, nextInstr);
  registers.PC = addr;
}

const call: InstructionFunction = (registers, memory, _, meta) => {
  callInternal(registers, memory, meta);
};

const callCondition = (
  key: keyof Flags,
  value: number
): InstructionFunction => {
  return (registers, memory, _, meta) => {
    if (registers.flags[key] === value) {
      callInternal(registers, memory, meta);
      return meta.cycles[0];
    }

    return meta.cycles[1];
  };
};

const push = (
  valueFn: (registers: RegisterSet) => number
): InstructionFunction => (registers, memory) => {
  push16(registers, memory, valueFn(registers));
};

const pop = (
  highReg: RegisterNames,
  lowReg: RegisterNames
): InstructionFunction => (registers, memory) => {
  pop16(registers, memory, highReg, lowReg);
};

const instructionMap: InstructionMap = {
  0xc1: pop('B', 'C'),
  0xc4: callCondition('zero', 0),
  0xc5: push((r) => r.BC),
  0xc9: ret,
  0xcc: callCondition('zero', 1),
  0xcd: call,
  0xd1: pop('D', 'E'),
  0xd4: callCondition('carry', 0),
  0xd5: push((r) => r.DE),
  0xdc: callCondition('carry', 1),
  0xe1: pop('H', 'L'),
  0xe5: push((r) => r.HL),
  0xf1: pop('A', 'F'),
  0xf5: push((r) => r.AF),
};

export default instructionMap;
