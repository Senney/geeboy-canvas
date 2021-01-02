import { Canvas } from './gfx/Canvas';
import { Cartridge } from './rom/Cartridge';
import { RomLoader } from './rom/RomLoader';
import { CPU } from './sys/CPU';
import { RAMFactory } from './mem/RAMFactory';
import {
  dumpInstructionHistory,
  dumpRegistersToTable,
  dumpSurroundingProgram,
} from './web';

const main = async () => {
  const canvasElement = document.getElementById('canvas');
  if (!canvasElement) {
    console.error('Unable to resolve canvas element.');
    return;
  }

  const fileUploadElement = document.getElementById('rom');

  const canvas = new Canvas(canvasElement as HTMLCanvasElement, 160, 144);
  const loader = new RomLoader(fileUploadElement as HTMLInputElement);

  canvas.context.fillText('Waiting for a ROM...', 50, 50);
  const rom = await loader.waitForRom();
  canvas.context.clearRect(0, 0, 160, 144);

  const cart = new Cartridge(rom);
  canvas.context.fillText(cart.metadata.title, 50, 50);

  cart.metadata.log();

  const ram = RAMFactory.getImplementation(cart);
  const cpu = new CPU(cart, ram);

  dumpRegistersToTable(cpu.registers);
  dumpSurroundingProgram(cpu.registers, ram);
  document.getElementById('step').onclick = () => {
    cpu.step();
    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
  };
  document.getElementById('step-10').onclick = () => {
    for (let i = 0; i < 10; i++) {
      cpu.step();
    }
    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
  };
  document.getElementById('run-to-unimplemented').onclick = () => {
    let i = 0;
    while (cpu.hasUnimplemented === false && i < 10000) {
      try {
        cpu.step();
        i++;
      } catch (e) {
        break;
      }
    }

    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
  };
  document.getElementById('run-to-pc').onclick = () => {
    const pcValue = (document.getElementById('pc') as HTMLInputElement).value;
    let i = 0;
    while (cpu.registers.PC !== parseInt(pcValue) && i < 50000) {
      try {
        cpu.step();
        i++;
      } catch (e) {
        break;
      }
    }

    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
  };
};

document.addEventListener('DOMContentLoaded', () => {
  main().then(() => console.log('App is loaded.'));
});
