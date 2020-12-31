const main = async () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'green';
  ctx.fillRect(10, 10, 150, 100);
};

document.addEventListener('DOMContentLoaded', () => {
  main().then(() => console.log('App is loaded.'));
});
