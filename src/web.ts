import { Cartridge } from './rom/Cartridge';
import { RegisterSet } from './sys/RegisterSet';

const toHex = (value: number): string => {
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
};

export const dumpSurroundingProgram = (
  registers: RegisterSet,
  cart: Cartridge
): void => {
  document.getElementById('current-pc').textContent = toHex(registers.PC);

  const values = [];
  for (let i = registers.PC - 4; i <= registers.PC + 4; i++) {
    values.push(
      i === registers.PC
        ? `*${toHex(cart.readByte(i))}*`
        : toHex(cart.readByte(i))
    );
  }
  document.getElementById('pc-bytes').textContent = values.join(' ');
};
