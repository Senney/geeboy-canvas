import { Canvas } from './gfx/Canvas';
import { Cartridge } from './rom/Cartridge';
import { RomLoader } from './rom/RomLoader';
import { CPU } from './sys/CPU';
import { RAMFactory } from './mem/RAMFactory';
import {
  dumpInstructionHistory,
  dumpRegistersToTable,
  dumpSurroundingProgram,
  formatCpuStateForLogging,
} from './web';
import { InterruptManager } from './sys/InterruptManager';
import { GPU } from './gfx/GPU';

const MILLISECONDS_PER_CYCLE = 1000 / 4_194_304;

const logfile = [];

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

  logfile.push(formatCpuStateForLogging(cpu.registers, ram));

  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 50; j++) {
      canvas.setPixel(i, j, { r: 1, g: 1, b: 1 });
    }
  }
  canvas.swap();

  ram.write(0xff44, 0x91);

  let playing = false;

  const runFrame = () => {
    let f = 0;
    // const start = performance.now();
    while (f < 70224) {
      const cycles = cpu.step();
      // logfile.push(formatCpuStateForLogging(cpu.registers, ram));
      f += cycles;
      gpu.step(f);

      if (interruptManager.hasInterrupt()) {
        interruptManager.handleInterrupt();
      }

      interruptManager.clearInterrupts();
    }

    // console.log('frame time: ', performance.now() - start);
    // console.log('log length', logfile.length);
  };

  const fps = 60;
  const startPlayLoop = async () => {
    const desiredFrameTimeMs = 1000 / fps;
    let count = 0;
    const startTime = new Date().valueOf();

    while (playing) {
      const s = performance.now();
      await new Promise<void>(resolve => setTimeout(() => {
        runFrame();
        resolve();
      }, 1));
      const waitTime = Math.max(0, desiredFrameTimeMs - (performance.now() - s));

      await new Promise(resolve => setTimeout(resolve, waitTime));

      count += 1;

      if (count % 10 === 0) {
        document.getElementById('fps').textContent = 'fps: ' + Math.floor(count / ((new Date().valueOf() - startTime) / 1000)).toString();
      }
    }
  };

  dumpRegistersToTable(cpu.registers);
  dumpSurroundingProgram(cpu.registers, ram);
  document.getElementById('step').onclick = () => {
    cpu.step();
    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);

    logfile.push(formatCpuStateForLogging(cpu.registers, ram));

    // for (let i = 0; i < 50; i++) {
    //   for (let j = 0; j < 50; j++) {
    //     canvas.setPixel(i, j, {
    //       r: Math.random() * 255,
    //       g: Math.random() * 255,
    //       b: 1,
    //     });
    //   }
    // }
    // canvas.swap();
  };
  document.getElementById('play').onclick = () => {
    if (playing) {
      playing = false;
      document.getElementById('play').textContent = '⏵';
    } else {
      playing = true;
      document.getElementById('play').textContent = '⏸';

      startPlayLoop();
    }
  };
  document.getElementById('step-out').onclick = () => {
    while (!cpu.instrHistory[cpu.instrHistory.length - 1].includes('RET')) {
      cpu.step();
      logfile.push(formatCpuStateForLogging(cpu.registers, ram));
    }
    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
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
    const t = parseInt(pcValue);
    if (cpu.registers.PC === t) {
      cpu.step();
      logfile.push(formatCpuStateForLogging(cpu.registers, ram));
    }

    while (cpu.registers.PC !== t) {
      try {
        cpu.step();
        logfile.push(formatCpuStateForLogging(cpu.registers, ram));
      } catch (e) {
        break;
      }
    }

    dumpInstructionHistory(cpu);
    dumpRegistersToTable(cpu.registers);
    dumpSurroundingProgram(cpu.registers, ram);
  };
  document.getElementById('run-to-count').onclick = () => {
    const pcValue = (document.getElementById('count') as HTMLInputElement).value;
    const t = parseInt(pcValue);

    while (logfile.length !== t) {
      try {
        cpu.step();
        logfile.push(formatCpuStateForLogging(cpu.registers, ram));
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
    const data = gpu.dumpSpriteTable();
    canvas.clear();
    canvas.context.putImageData(data, 0, 0);
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
  document.getElementById('copy-logs').onclick = () => {
    const logs = logfile.join('\n');
    navigator.clipboard.writeText(logs);
  };
  document.getElementById('save-logs').onclick = () => {
    const logs = logfile.join('\n');
    const file = new Blob([logs]);
    
    const a = document.createElement("a"),
    url = URL.createObjectURL(file);
    a.href = url;
    a.toggleAttribute('download');
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);  
    }, 0); 
  };
};

document.addEventListener('DOMContentLoaded', () => {
  main().then(() => console.log('App is loaded.'));
});
