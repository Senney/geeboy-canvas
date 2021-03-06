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
import { InterruptManager } from './sys/InterruptManager';
import { GPU } from './gfx/GPU';

const MILLISECONDS_PER_CYCLE = 1000 / 4_194_304;

const main = async () => {
  const canvasElement = document.getElementById('canvas');
  if (!canvasElement) {
    console.error('Unable to resolve canvas element.');
    return;
  }

  const fileUploadElement = document.getElementById('rom');

  const canvas = new Canvas(canvasElement as HTMLCanvasElement);
  const loader = new RomLoader(fileUploadElement as HTMLInputElement);

  canvas.context.fillText('Waiting for a ROM...', 50, 50);
  const rom = await loader.waitForRom();
  canvas.context.clearRect(0, 0, 160, 144);

  const cart = new Cartridge(rom);
  canvas.context.fillText(cart.metadata.title, 50, 50);

  cart.metadata.log();

  const ram = RAMFactory.getImplementation(cart);
  const cpu = new CPU(cart, ram);
  const interruptManager = new InterruptManager(cpu, ram);
  const gpu = new GPU(canvas, ram, interruptManager);
  cpu.instrumentation = false;

  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 50; j++) {
      canvas.setPixel(i, j, { r: 1, g: 1, b: 1 });
    }
  }
  canvas.swap();

  ram.write(0xff44, 0x91);

  const runFrame = () => {
    let f = 0;
    const start = performance.now();
    while (f < 70224) {
      const cycles = cpu.step();
      f += cycles;
      gpu.step(f);

      if (interruptManager.hasInterrupt()) {
        interruptManager.handleInterrupt();
      }

      interruptManager.clearInterrupts();
    }

    console.log('frame time: ', performance.now() - start);
  };

  dumpRegistersToTable(cpu.registers);
  dumpSurroundingProgram(cpu.registers, ram);
  document.getElementById('step').onclick = () => {
    // cpu.step();
    // dumpInstructionHistory(cpu);
    // dumpRegistersToTable(cpu.registers);
    // dumpSurroundingProgram(cpu.registers, ram);

    for (let i = 0; i < 50; i++) {
      for (let j = 0; j < 50; j++) {
        canvas.setPixel(i, j, {
          r: Math.random() * 255,
          g: Math.random() * 255,
          b: 1,
        });
      }
    }
    canvas.swap();
  };
  document.getElementById('step-10').onclick = () => {
    document.getElementById('step-10').setAttribute('disabled', '1');
    runFrame();
    document.getElementById('step-10').removeAttribute('disabled');
    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
  };
  document.getElementById('run-to-unimplemented').onclick = () => {
    let i = 0;
    while (cpu.hasUnimplemented === false && i < 60) {
      try {
        runFrame();
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
    while (cpu.registers.PC !== parseInt(pcValue)) {
      try {
        cpu.step();
      } catch (e) {
        break;
      }
    }

    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
  };
  document.getElementById('dump-oam').onclick = () => {
    const sprites = [];
    for (let i = 0; i < 40 * 4; i += 4) {
      const ypos = ram.read(0xfe00 + i);
      const xpos = ram.read(0xfe00 + i + 1);
      const tile = ram.read(0xfe00 + i + 2);
      const flags = ram.read(0xfe00 + i + 3);

      if ((ypos | xpos | tile | flags) === 0) {
        continue;
      }

      sprites.push(
        `Sprite ${tile} at (${xpos}, ${ypos}) [${flags.toString(2)}]`
      );
    }

    alert(sprites.join('\n'));
  };
  document.getElementById('dump-tile').onclick = () => {
    const strings = [];
    const base = prompt('Base', '0x8000');
    const baseNum = parseInt(base);
    for (let i = 0; i < 8; i++) {
      const str = ram.read(baseNum + i).toString(2);
      strings.push('00000000'.substr(str.length) + str);
    }
    alert(strings.join('\n'));
  };
  document.getElementById('dump-background').onclick = () => {
    const strings = [];
    for (let i = 0; i < 32; i++) {
      const row = [];
      for (let j = 0; j < 32; j++) {
        row.push(ram.read(0x9800 + (i * 32 + j)).toString(16));
      }
      strings.push(row.join(' '));
    }

    alert(strings.join('\n'));
  };
};

document.addEventListener('DOMContentLoaded', () => {
  main().then(() => console.log('App is loaded.'));
});
