import { Universe, Pattern } from "crucial-experiment";
import { memory } from "crucial-experiment/crucial_experiment_bg";

const CELL_SIZE = 2;
const SELECT_SIZE = 10;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const COUNT_COLOR = "#FF0000";

let universe = Universe.new();

const span = universe.span();
const width = 2 * span + 1;
const iteration_limit = span;
let iteration = 0;

const window = 5;
const pattern = Pattern.new(window);

const canvas = document.getElementById("crucial-experiment-canvas");
canvas.width = (CELL_SIZE + 1) * width + 1;
canvas.height = (CELL_SIZE + 1) * iteration_limit;

const countCanvas = document.getElementById("count-canvas");
countCanvas.width = width;
countCanvas.height = (CELL_SIZE + 1) * iteration_limit;

const settingsCanvas = document.getElementById("settings-canvas");
settingsCanvas.width = (SELECT_SIZE + 1) * (window + 2) + 1;
settingsCanvas.height = (SELECT_SIZE + 1) * (2 ** window) + 1;

settingsCanvas.addEventListener("click", event => {
  const boundingRect = settingsCanvas.getBoundingClientRect();

  const scaleX = settingsCanvas.width / boundingRect.width;
  const scaleY = settingsCanvas.height / boundingRect.height;

  const settingsCanvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const settingsCanvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(settingsCanvasTop / (SELECT_SIZE + 1)), (2 ** window) - 1);
  const col = Math.min(Math.floor(settingsCanvasLeft / (SELECT_SIZE + 1)), (window + 2) - 1);

  console.log("trigger", row, col);

  if (col === window + 1) {
    let current = pattern.get_outcome(row);
    pattern.set_outcome(row, !current);

    drawSettings();
  }
});

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
  reset();
  drawCells();
});

const reset = () => {
  universe = Universe.new();
  iteration = 0;

  pause();
  drawGrid();
  cleanCells();
  cleanCounts();
}

const randomizeButton = document.getElementById("randomize");
randomizeButton.addEventListener("click", event => {
  reset();
  universe.randomize();
  drawCells();
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

const countCtx = countCanvas.getContext("2d");

const drawCount = () => {
  const count = universe.count_active();

  countCtx.beginPath();

  countCtx.fillStyle = COUNT_COLOR;

  countCtx.fillRect(
    0,
    iteration * (CELL_SIZE + 1) + 1,
    count,
    CELL_SIZE
  );

  countCtx.stroke();
};

const settingsCtx = settingsCanvas.getContext("2d");

const drawSettings = () => {
  settingsCtx.beginPath();

  settingsCtx.fillStyle = COUNT_COLOR;

  for (let row = 0; row < (2 ** window); row++) {
    for (let col = 0; col < window; col++) {
      let mask = 1 << col;

      settingsCtx.fillStyle = (row & mask) != 0
        ? ALIVE_COLOR
        : DEAD_COLOR;

      settingsCtx.fillRect(
        col * (SELECT_SIZE + 1) + 1,
        row * (SELECT_SIZE + 1) + 1,
        SELECT_SIZE,
        SELECT_SIZE
      );
    }

    settingsCtx.fillStyle = pattern.get_outcome(row)
      ? ALIVE_COLOR
      : DEAD_COLOR;

    settingsCtx.fillRect(
      (window + 1) * (SELECT_SIZE + 1) + 1,
      row * (SELECT_SIZE + 1) + 1,
      SELECT_SIZE,
      SELECT_SIZE
    );
  }

  settingsCtx.stroke();
};

const cleanCounts = () => {
  countCtx.clearRect(0, 0, countCanvas.width, countCanvas.height);
};

const renderLoop = () => {
  drawGrid();
  drawCells();
  drawCount();
  drawSettings();

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
