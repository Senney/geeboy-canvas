import { RAM } from './mem/RAM';
import { CPU } from './sys/CPU';
import { RegisterSet } from './sys/RegisterSet';

export const toHex = (value: number): string => {
  if (value === undefined) {
    return '0x???';
  }

  return `0x${value.toString(16).toUpperCase()}`;
};

const setRegisterInTable = (registerName: string, value: number) => {
  const element = document.getElementById(`${registerName.toLowerCase()}-reg`);
  element.textContent = toHex(value);
};

export const dumpRegistersToTable = (registers: RegisterSet): void => {
  setRegisterInTable('A', registers.A);
  setRegisterInTable('F', registers.F);
  setRegisterInTable('B', registers.B);
  setRegisterInTable('C', registers.C);
  setRegisterInTable('D', registers.D);
  setRegisterInTable('E', registers.E);
  setRegisterInTable('H', registers.H);
  setRegisterInTable('L', registers.L);
  setRegisterInTable('BC', registers.BC);
  setRegisterInTable('DE', registers.DE);
  setRegisterInTable('HL', registers.HL);
  setRegisterInTable('zero', registers.flags.zero);
  setRegisterInTable('carry', registers.flags.carry);
  setRegisterInTable('halfcarry', registers.flags.halfCarry);
  setRegisterInTable('subtract', registers.flags.subtract);
};

export const dumpSurroundingProgram = (
  registers: RegisterSet,
  mem: RAM
): void => {
  document.getElementById('current-pc').textContent = toHex(registers.PC);

  const values = [];
  for (let i = registers.PC - 4; i <= registers.PC + 4; i++) {
    try {
      values.push(
        i === registers.PC ? `*${toHex(mem.read(i))}*` : toHex(mem.read(i))
      );
    } catch (e) {
      values.push(
        i === registers.PC ? `*???*` : '???'
      );
    }
  }
  document.getElementById('pc-bytes').textContent = values.join(' ');
};

export const dumpInstructionHistory = (cpu: CPU): void => {
  const target = document.getElementById('instruction-history');
  target.innerHTML = '';

  document.getElementById('next-instruction').textContent = cpu.nextInstruction;
  for (const instr of [...cpu.instrHistory].reverse().slice(0, 100)) {
    const e = document.createElement('li');
    e.textContent = instr;
    target.appendChild(e);
  }
};

export const formatCpuStateForLogging = (registers: RegisterSet, memory: RAM): string => {
  const { A, B, C, D, E, F, H, L, SP, PC } = registers;

  const pcMem = [
    memory.read(PC),
    memory.read(PC+1),
    memory.read(PC+2),
    memory.read(PC+3)
  ];
  
  const f = (value: number, len = 2): string => value.toString(16).padStart(len, '0').toUpperCase();
  const pcMemString = pcMem.map(v => f(v)).join(',');

  return `A:${f(A)} F:${f(F)} B:${f(B)} C:${f(C)} D:${f(D)} E:${f(E)} H:${f(H)} L:${f(L)} SP:${f(SP, 4)} PC:${f(PC, 4)} PCMEM:${pcMemString}`;
};
