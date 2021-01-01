import { Cartridge } from '../rom/Cartridge';
import { RegisterSet } from './RegisterSet';
import { InstructionMetadata } from './InstructionMetadata';

import { instructionSet } from './instructions';
import { RAM } from '../mem/RAM';

export class CPU {
  private r: RegisterSet;
  private halt: boolean;
  private interruptsEnabled: boolean;

  public hasUnimplemented = false;
  public instrHistory = [];
  public nextInstruction: string;

  constructor(private rom: Cartridge, private mem: RAM) {
    this.r = new RegisterSet();
    this.halt = false;
  }

  public step(): void {
    if (this.halt) {
      return;
    }

    const instr = this.getCurrentInstruction();

    const meta = InstructionMetadata.get(instr);
    if (instr === 0x76) {
      this.halt = true;
      return;
    }

    const func = instructionSet[instr];

    if (!func) {
      this.hasUnimplemented = true;
      console.log(
        `Instruction [0x${instr.toString(16)} - ${
          meta.name
        }] has not been implemented.`
      );
      this.r.PC += meta.size;
      return;
    }

    const cycles = func(this.r, this.mem, this, meta) ?? meta.cycles[0];

    this.r.PC += meta.size;
    this.instrHistory.push(meta.name);
    this.nextInstruction = InstructionMetadata.get(
      this.getCurrentInstruction()
    ).name;
  }

  public enableInterrupts(): boolean {
    this.interruptsEnabled = true;
    return true;
  }

  private getCurrentInstruction(): number {
    let instr = this.rom.readByte(this.r.PC);
    if (instr === 0xcb) {
      instr = (instr << 8) | this.rom.readByte(this.r.PC + 1);
    }

    return instr;
  }

  public disableInterrupts(): boolean {
    this.interruptsEnabled = false;
    return false;
  }

  public get registers(): RegisterSet {
    return this.r;
  }
}
