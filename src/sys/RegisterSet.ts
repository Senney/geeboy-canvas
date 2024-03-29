import { combineRegisters, unsigned, unsigned16 } from './instructions/util';

const DEFAULT_REGISTER_STATE = [0x01, 0xB0, 0x00, 0x13, 0x00, 0xD8, 0x01, 0x4D];
const DEFAULT_FLAG_STATE = [1, 0, 1, 1];
const DEFAULT_PC = 0x100;
const DEFAULT_SP = 0xfffe;

export type RegisterNames = 'A' | 'F' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L';
const registerNameIndex: Record<RegisterNames, number> = {
  A: 0,
  F: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  H: 6,
  L: 7,
};

export type Flags = {
  zero: number;
  subtract: number;
  halfCarry: number;
  carry: number;
};

export class RegisterSet {
  private registers: Uint8Array;
  private flagValues: Uint8Array;
  private pc: number;
  private sp: number;

  constructor(
    registerState = DEFAULT_REGISTER_STATE,
    flags = DEFAULT_FLAG_STATE,
    pc = DEFAULT_PC,
    sp = DEFAULT_SP
  ) {
    this.registers = Uint8Array.from(registerState);
    this.flagValues = Uint8Array.from(flags);
    this.pc = pc;
    this.sp = sp;
  }

  setRegister(reg: RegisterNames, value: number): void {
    if (reg === 'F') {
      this.F = value;
      return;
    }

    this.setRegisterInternal(registerNameIndex[reg], value);
  }

  getRegister(reg: RegisterNames): number {
    if (reg === 'F') {
      return this.F;
    }

    return this.registers[registerNameIndex[reg]];
  }

  get flags(): Flags {
    return {
      zero: this.flagValues[0],
      subtract: this.flagValues[1],
      halfCarry: this.flagValues[2],
      carry: this.flagValues[3],
    };
  }

  getFlag(flag: keyof Flags): number {
    return this.flags[flag];
  }

  setFlags(flags: Partial<Flags>): Flags {
    this.flagValues[0] = flags.zero ?? this.flagValues[0];
    this.flagValues[1] = flags.subtract ?? this.flagValues[1];
    this.flagValues[2] = flags.halfCarry ?? this.flagValues[2];
    this.flagValues[3] = flags.carry ?? this.flagValues[3];
    return this.flags;
  }

  get A(): number {
    return this.registers[0];
  }

  set A(v: number) {
    this.setRegisterInternal(0, v);
  }

  get F(): number {
    return (
      ((this.flagValues[0] & 0x1) << 7) |
      ((this.flagValues[1] & 0x1) << 6) |
      ((this.flagValues[2] & 0x1) << 5) |
      ((this.flagValues[3] & 0x1) << 4)
    );
  }

  set F(v: number) {
    this.flagValues[0] = (v & 0b10000000) >> 7;
    this.flagValues[1] = (v & 0b01000000) >> 6;
    this.flagValues[2] = (v & 0b00100000) >> 5;
    this.flagValues[3] = (v & 0b00010000) >> 4;
    this.setRegisterInternal(1, v & 0xf0);
  }

  get B(): number {
    return this.registers[2];
  }

  set B(v: number) {
    this.setRegisterInternal(2, v);
  }

  get C(): number {
    return this.registers[3];
  }

  set C(v: number) {
    this.setRegisterInternal(3, v);
  }

  get D(): number {
    return this.registers[4];
  }

  set D(v: number) {
    this.setRegisterInternal(4, v);
  }

  get E(): number {
    return this.registers[5];
  }

  set E(v: number) {
    this.setRegisterInternal(5, v);
  }

  get H(): number {
    return this.registers[6];
  }

  set H(v: number) {
    this.setRegisterInternal(6, v);
  }

  get L(): number {
    return this.registers[7];
  }

  set L(v: number) {
    this.setRegisterInternal(7, v);
  }

  get PC(): number {
    return this.pc;
  }

  set PC(v: number) {
    this.pc = unsigned16(v);
  }

  get SP(): number {
    return this.sp;
  }

  set SP(v: number) {
    this.sp = v & 0xffff;
  }

  get AF(): number {
    const value = combineRegisters(this, 'A', 'F');
    return value;
  }

  get BC(): number {
    const value = combineRegisters(this, 'B', 'C');
    return value;
  }

  set BC(value: number) {
    this.setRegisterInternal(registerNameIndex.B, (value & 0xff00) >> 8);
    this.setRegisterInternal(registerNameIndex.C, value & 0xff);
  }

  get DE(): number {
    const value = combineRegisters(this, 'D', 'E');
    return value;
  }

  set DE(value: number) {
    this.setRegisterInternal(registerNameIndex.D, (value & 0xff00) >> 8);
    this.setRegisterInternal(registerNameIndex.E, value & 0xff);
  }

  get HL(): number {
    const value = combineRegisters(this, 'H', 'L');
    return value;
  }

  set HL(value: number) {
    this.setRegisterInternal(registerNameIndex.H, (value & 0xff00) >> 8);
    this.setRegisterInternal(registerNameIndex.L, value & 0xff);
  }

  private setRegisterInternal(idx: number, value: number): void {
    this.registers[idx] = unsigned(value);
  }
}
