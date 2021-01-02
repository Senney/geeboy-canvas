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

const retCondition = (key: keyof Flags, value): InstructionFunction => {
  return (registers, memory, _, meta) => {
    if (registers.flags[key] === value) {
      const newPC = pop16PC(registers, memory);
      registers.PC = newPC - meta.size;
      return meta.cycles[0];
    }

    return meta.cycles[1];
  };
};

const retI: InstructionFunction = (registers, memory, cpu, meta) => {
  cpu.enableInterrupts();
  const newPC = pop16PC(registers, memory);
  registers.PC = newPC - meta.size;
};

function callInternal(
  registers: RegisterSet,
  memory: RAM,
  meta: InstructionMetadataRecord,
  targetAddr: number
) {
  const nextInstr = registers.PC + meta.size;
  const addr = targetAddr - meta.size;
  push16(registers, memory, nextInstr);
  registers.PC = addr;
}

const call: InstructionFunction = (registers, memory, _, meta) => {
  callInternal(registers, memory, meta, getImmediate16(registers, memory));
};

const callCondition = (
  key: keyof Flags,
  value: number
): InstructionFunction => {
  return (registers, memory, _, meta) => {
    if (registers.flags[key] === value) {
      callInternal(registers, memory, meta, getImmediate16(registers, memory));
      return meta.cycles[0];
    }

    return meta.cycles[1];
  };
};

const rst = (addr: number): InstructionFunction => (
  registers,
  memory,
  _,
  meta
) => {
  callInternal(registers, memory, meta, addr);
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
  0xc0: retCondition('zero', 0),
  0xc1: pop('B', 'C'),
  0xc4: callCondition('zero', 0),
  0xc5: push((r) => r.BC),
  0xc7: rst(0x00),
  0xc8: retCondition('zero', 1),
  0xc9: ret,
  0xcc: callCondition('zero', 1),
  0xcd: call,
  0xcf: rst(0x08),
  0xd0: retCondition('carry', 0),
  0xd1: pop('D', 'E'),
  0xd4: callCondition('carry', 0),
  0xd5: push((r) => r.DE),
  0xd7: rst(0x10),
  0xd8: retCondition('carry', 1),
  0xdc: callCondition('carry', 1),
  0xdf: rst(0x18),
  0xd9: retI,
  0xe1: pop('H', 'L'),
  0xe5: push((r) => r.HL),
  0xe7: rst(0x20),
  0xef: rst(0x28),
  0xf1: pop('A', 'F'),
  0xf5: push((r) => r.AF),
  0xf7: rst(0x30),
  0xff: rst(0x38),
};

export default instructionMap;
