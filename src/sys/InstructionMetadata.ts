import opcodes from './opcodes.json';

type OpcodeEntry = {
  operand2: string;
  mnemonic: string;
  operand1: string;
  bytes: number;
  operand_count: number;
  flags_ZHNC: string[];
  cycles: number[];
};

export type InstructionMetadataRecord = {
  opcode: number;
  name: string;
  size: number;
  cycles: number[];
};

export class InstructionMetadata {
  static get(opcode: number): InstructionMetadataRecord {
    if ((opcode & 0xcb00) === 0xcb00) {
      return this.toMetadataRecord(
        opcode,
        opcodes.cbprefixed[this.toOpcodeStr(opcode & 0xff)]
      );
    }

    return this.toMetadataRecord(
      opcode,
      opcodes.unprefixed[this.toOpcodeStr(opcode & 0xff)]
    );
  }

  private static toMetadataRecord(
    opcode: number,
    v: OpcodeEntry
  ): InstructionMetadataRecord {
    if (!v) {
      throw new Error('Undefined opcode ' + opcode.toString(16));
    }

    return {
      opcode: opcode,
      cycles: v.cycles,
      name: this.toAssemblyStr(v),
      size: v.bytes,
    };
  }

  private static toOpcodeStr(opcode: number): string {
    return `0x${(opcode & 0xff).toString(16).substr(0, 2)}`;
  }

  private static toAssemblyStr(v: OpcodeEntry): string {
    return [v.mnemonic, v.operand1, v.operand2].filter((v) => v).join(' ');
  }
}
