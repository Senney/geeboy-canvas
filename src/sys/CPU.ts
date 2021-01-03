import { Cartridge } from '../rom/Cartridge';
import { RegisterSet } from './RegisterSet';
import {
  InstructionMetadata,
  InstructionMetadataRecord,
} from './InstructionMetadata';

import { instructionSet } from './instructions';
import { RAM } from '../mem/RAM';
import { toHex } from '../web';
import { getImmediate16, getImmediate8 } from './instructions/util';
import { push16 } from './instructions/stack';

export class CPU {
  private r: RegisterSet;
  private halt: boolean;
  private interruptsEnabled: boolean;

  public hasUnimplemented = false;
  public instrHistory = [];
  public nextInstruction: string;
  public instrumentation = true;

  constructor(private rom: Cartridge, private mem: RAM) {
    this.r = new RegisterSet();
    this.halt = false;
  }

  public step(): number {
    if (this.halt) {
      return 4;
    }

    const instr = this.getCurrentInstruction();

    const meta = InstructionMetadata.get(instr);
    if (this.instrumentation) {
      this.instrHistory.push(this.renderInstructionWithData(meta.name, meta));
      this.instrHistory = this.instrHistory.slice(
        this.instrHistory.length - 100,
        this.instrHistory.length
      );
    }

    if (instr === 0x76) {
      this.r.PC += meta.size;
      if (this.interruptsEnabled) {
        this.halt = true;
      } else {
        // Per the manual, the next instruction is also skipped when interrupts are disabled.
        this.r.PC += InstructionMetadata.get(this.getCurrentInstruction()).size;
      }
      return 4;
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

      return meta.cycles[0];
    }

    const cycles =
      (func(this.r, this.mem, this, meta) as number) ?? meta.cycles[0];

    this.r.PC += meta.size;

    if (this.instrumentation) {
      const nextInstructionMetadata = InstructionMetadata.get(
        this.getCurrentInstruction()
      );
      this.nextInstruction = this.renderInstructionWithData(
        nextInstructionMetadata.name,
        nextInstructionMetadata
      );
    }

    return cycles ?? 0;
  }

  public interrupt(addr: number): void {
    if (!this.interruptsEnabled) {
      return;
    }

    this.halt = false;
    this.disableInterrupts();
    push16(this.registers, this.mem, this.registers.PC);
    this.registers.PC = addr;
  }

  public enableInterrupts(): boolean {
    console.log('Disable interrupts');
    this.interruptsEnabled = true;
    return true;
  }

  public disableInterrupts(): boolean {
    console.log('Enabled interrupts');
    this.interruptsEnabled = false;
    return false;
  }

  private getCurrentInstruction(): number {
    let instr = this.mem.read(this.r.PC);
    if (instr === 0xcb) {
      instr = (instr << 8) | this.mem.read(this.r.PC + 1);
    }

    return instr;
  }

  public get registers(): RegisterSet {
    return this.r;
  }

  private renderInstructionWithData(
    instructionStr: string,
    meta: InstructionMetadataRecord
  ): string {
    const [instr, ...parts] = instructionStr.split(' ');
    const renderedParts = parts.map((p) => {
      switch (p) {
        case 'd16':
        case 'a16':
          return `${p} {${toHex(getImmediate16(this.registers, this.mem))}}`;
        case 'r8':
        case 'd8':
          return `${p} {${toHex(getImmediate8(this.registers, this.mem))}}`;
        case 'a8':
          return `${p} {${toHex(
            0xff00 | getImmediate8(this.registers, this.mem)
          )}}`;
        case '(a8)':
          return `${p} {[${toHex(
            0xff00 | getImmediate8(this.registers, this.mem)
          )}] ${toHex(
            this.mem.read(0xff00 | getImmediate8(this.registers, this.mem))
          )}}`;
        case '(a16)':
          return `${p} {[${toHex(
            getImmediate16(this.registers, this.mem)
          )}] ${toHex(
            this.mem.read(getImmediate16(this.registers, this.mem))
          )}}`;
        case '(HL+)':
        case '(HL-)':
          return `${p} {[${toHex(this.registers.HL)}] ${toHex(
            this.mem.read(this.registers.HL)
          )}}`;
        default:
          return p;
      }
    });

    return `[${toHex(this.registers.PC)}][${toHex(
      meta.opcode
    )}] ${instr} ${renderedParts.join(' ')}`;
  }
}
