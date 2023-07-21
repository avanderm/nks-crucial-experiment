import { Universe, Pattern } from "crucial-experiment";
import { memory } from "crucial-experiment/crucial_experiment_bg";

const CELL_SIZE = 2;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

let universe = Universe.new();

const span = universe.span();
const width = 2 * span + 1;
const iteration_limit = span;
let iteration = 0;

const pattern = Pattern.new();

const canvas = document.getElementById("crucial-experiment-canvas");
canvas.width = (CELL_SIZE + 1) * width + 1;
canvas.height = (CELL_SIZE + 1) * iteration_limit;

const ctx = canvas.getContext("2d");
let animationId = null;

const playPauseButton = document.getElementById("play-pause");

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = "▶";
  cancelAnimationFrame(animationId);
  animationId = null;
};

playPauseButton.addEventListener("click", event => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

const resetButton = document.getElementById("reset");

resetButton.addEventListener("click", event => {
  universe = Universe.new();
  iteration = 0;

  pause();
  drawGrid();
  cleanCells();
});

const checkboxes = document.querySelectorAll("input[type=checkbox][name=settings]");
checkboxes.forEach((checkbox) => {
  let number = parseInt(checkbox.value);
  checkbox.checked = pattern.get_outcome(number);

  checkbox.onclick = () => {
    let number = parseInt(checkbox.value);
    if (checkbox.checked) {
      pattern.set_outcome(number, true);
    } else {
      pattern.set_outcome(number, false);
    }
  };
});

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * width + 1);
  }

  // Horizontal lines
  for (let i = 0; i <= span; i++) {
    ctx.moveTo(0, i * (CELL_SIZE + 1) + 1);
    ctx.moveTo((CELL_SIZE + 1) * width + 1, i * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const bitIsSet = (n, arr) => {
  const byte = Math.floor(n / 8);
  const mask = 1 << (n % 8);
  return (arr[byte] & mask) === mask;
};

const cleanCells = () => {
  ctx.beginPath();
  ctx.fillStyle = DEAD_COLOR;

  for (let row = 0; row < width; row++) {
    for (let col = 0; col < iteration_limit; col++) {
      ctx.fillRect(
        row * (CELL_SIZE + 1) + 1,
        col * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width / 8);

  ctx.beginPath();

  for (let row = 0; row < width; row++) {
    // This is updated!
    ctx.fillStyle = bitIsSet(row, cells)
      ? ALIVE_COLOR
      : DEAD_COLOR;

    ctx.fillRect(
      row * (CELL_SIZE + 1) + 1,
      iteration * (CELL_SIZE + 1) + 1,
      CELL_SIZE,
      CELL_SIZE
    );
  }

  ctx.stroke();
};

const renderLoop = () => {
  drawGrid();
  drawCells();

  universe.tick(pattern);
  iteration += 1;

  animationId = requestAnimationFrame(renderLoop);

  if (iteration > iteration_limit) {
    cancelAnimationFrame(animationId);
  }
};

const isPaused = () => {
  return animationId === null;
}

play();
