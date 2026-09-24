const CONFIG = {
  rows: 10, // total rows
  columns: 8, // total columns
  differences: 4, // total number of differences between IMAGES
  seconds: 30, // how long timer should be
  strikes: 2, // total of incorrect allowed
};

let imageA = [];
let imageB = [];

let differences = new Set();
let found = new Set();
let strikesLeft = CONFIG.strikes;
let timeRemaining = CONFIG.seconds;
let gameRunning = false;
let selectedIndex = 0;
let timer = null;

function randomHex() {
  return Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function generateImages() {
  const totalCells = CONFIG.rows * CONFIG.columns;
  imageA = [];

  for (let i = 0; i < totalCells; i++) {
    imageA.push(randomHex());
  }

  imageB = [...imageA];
  differences.clear();

  while (differences.size < CONFIG.differences) {
    const index = Math.floor(Math.random() * totalCells);
    differences.add(index);
  }

  differences.forEach((index) => {
    let newValue;
    do {
      newValue = randomHex();
    } while (newValue === imageA[index]);

    imageB[index] = newValue;
  });
}

function renderGrid(container, values, side) {
  container.innerHTML = "";

  for (let row = 0; row < CONFIG.rows; row++) {
    const rowElement = document.createElement("div");
    rowElement.className = "hex-row";

    const address = 0xa000 + row * CONFIG.columns;
    const addressElement = document.createElement("div");
    addressElement.className = "hex-address";

    addressElement.textContent = "0x" + address.toString(16).toUpperCase().padStart(4, "0");

    rowElement.appendChild(addressElement);

    const cellsElement = document.createElement("div");
    cellsElement.className = "hex-cells";

    for (let column = 0; column < CONFIG.columns; column++) {
      const index = row * CONFIG.columns + column;

      const button = document.createElement("button");
      button.className = "hex";
      button.textContent = values[index];
      button.dataset.index = index;
      button.dataset.side = side;

      button.addEventListener("click", () => {
        selectedIndex = index;
        updateSelection();
        handleClick(index, button);
      });

      cellsElement.appendChild(button);
    }

    rowElement.appendChild(cellsElement);
    container.appendChild(rowElement);
  }
}

function handleClick(index, button) {
  if (!gameRunning) {
    return;
  }

  if (found.has(index)) {
    return;
  }

  if (differences.has(index)) {
    found.add(index);

    highlightDifference(index);
    updateFound();

    if (found.size === differences.size) {
      endGame(true);
    }
  } else {
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    strikesLeft--;
    updateStrikes();

    if (strikesLeft <= 0) {
      endGame(false);
    }
  }
}

function moveSelection(rowChange, columnChange) {
  if (!gameRunning) {
    return;
  }

  if (document.getElementById("settingsOverlay")?.classList.contains("show")) {
    return;
  }

  const currentRow = Math.floor(selectedIndex / CONFIG.columns);
  const currentColumn = selectedIndex % CONFIG.columns;

  let newRow = currentRow + rowChange;
  let newColumn = currentColumn + columnChange;

  if (newRow < 0) {
    newRow = CONFIG.rows - 1;
  }

  if (newRow >= CONFIG.rows) {
    newRow = 0;
  }

  if (newColumn < 0) {
    newColumn = CONFIG.columns - 1;
  }

  if (newColumn >= CONFIG.columns) {
    newColumn = 0;
  }

  selectedIndex = newRow * CONFIG.columns + newColumn;

  updateSelection();
}

function updateSelection() {
  document.querySelectorAll(".hex.selected").forEach((cell) => {
    cell.classList.remove("selected");
  });

  document
    .querySelectorAll(`.hex[data-index="${selectedIndex}"]`)
    .forEach((cell) => {
      cell.classList.add("selected");
    });
}

function selectCurrentCell() {
  if (!gameRunning) {
    return;
  }

  if (found.has(selectedIndex)) {
    return;
  }

  const cellA = document.querySelector(
    `#gridA .hex[data-index="${selectedIndex}"]`,
  );

  if (cellA) {
    handleClick(selectedIndex, cellA);
  }
}

function highlightDifference(index) {
  document.querySelectorAll(`.hex[data-index="${index}"]`).forEach((cell) => {
    cell.classList.add("found");
  });
}

function updateFound() {
  document.getElementById("foundCount").textContent = found.size;
}

function updateStrikes() {
  document.getElementById("strikesLeft").textContent = strikesLeft;
}

function startTimer() {
  clearInterval(timer);

  const startTime = performance.now();
  const duration = CONFIG.seconds * 1000;

  timer = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    timeRemaining = remaining / 1000;

    const percentage = (remaining / duration) * 100;
    const fill = document.getElementById("timerFill");
    fill.style.width = percentage + "%";

    if (percentage > 50) {
      fill.style.background = "#5be46e";
    } else if (percentage > 25) {
      fill.style.background = "#ffe66d";
    } else {
      fill.style.background = "#ff4d4d";
    }
    document.getElementById("timerText").textContent =
      timeRemaining.toFixed(1) + "s";

    if (remaining <= 0) {
      clearInterval(timer);
      endGame(false);
    }
  }, 50);
}

function endGame(success) {
  gameRunning = false;
  clearInterval(timer);

  const message = document.getElementById("gameMessage");
  const title = document.getElementById("messageTitle");
  const subtitle = document.getElementById("messageSubtitle");

  if (success) {
    title.textContent = "BREACH COMPLETE";
    subtitle.textContent = "MEMORY INTEGRITY VERIFIED";
    title.style.color = "#ffe66d";
  } else {
    title.textContent = "ACCESS DENIED";
    subtitle.textContent = "MEMORY DIFFERENCE CHECK FAILED";
    title.style.color = "#ff4d4d";
  }
  message.classList.add("show");
}

function startGame() {
  clearInterval(timer);
  found.clear();
  strikesLeft = CONFIG.strikes;
  timeRemaining = CONFIG.seconds;
  selectedIndex = 0;
  gameRunning = true;

  document.getElementById("gameMessage").classList.remove("show");
  document.getElementById("foundCount").textContent = "0";
  document.getElementById("totalDiffs").textContent = CONFIG.differences;
  document.getElementById("strikesLeft").textContent = strikesLeft;

  document.getElementById("timerFill").style.width = "100%";
  document.getElementById("timerFill").style.background = "#5be46e";
  document.getElementById("timerText").textContent =
    CONFIG.seconds.toFixed(1) + "s";

  generateImages();
  renderGrid(document.getElementById("gridA"), imageA, "A");
  renderGrid(document.getElementById("gridB"), imageB, "B");
  updateSelection();
  startTimer();
}

startGame();

// settings
const settingsButton = document.getElementById("settingsButton");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsClose = document.getElementById("settingsClose");
const settingsCancel = document.getElementById("settingsCancel");
const settingsApply = document.getElementById("settingsApply");
const timerSetting = document.getElementById("timerSetting");

settingsButton.addEventListener("click", () => {
  timerSetting.value = CONFIG.seconds;
  settingsOverlay.classList.add("show");
});

function closeSettings() {
  settingsOverlay.classList.remove("show");
}

settingsClose.addEventListener("click", closeSettings);
settingsCancel.addEventListener("click", closeSettings);
settingsApply.addEventListener("click", () => {
  let newTimer = parseInt(timerSetting.value, 10);

  if (isNaN(newTimer) || newTimer < 1) {
    newTimer = 1;
  }

  if (newTimer > 999) {
    newTimer = 999;
  }

  CONFIG.seconds = newTimer;
  closeSettings();
  startGame();
});

settingsOverlay.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) {
    closeSettings();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsOverlay.classList.contains("show")) {
    closeSettings();
  }
});

document.addEventListener("keydown", (event) => {
  if (document.getElementById("settingsOverlay")?.classList.contains("show")) {
    return;
  }

  if (!gameRunning) {
    return;
  }

  let handled = true;
  switch (event.key.toLowerCase()) {
    case "arrowup":
    case "w":
      moveSelection(-1, 0);
      break;
    case "arrowdown":
    case "s":
      moveSelection(1, 0);
      break;
    case "arrowleft":
    case "a":
      moveSelection(0, -1);
      break;
    case "arrowright":
    case "d":
      moveSelection(0, 1);
      break;
    case "enter":
    case " ":
      selectCurrentCell();
      break;
    default:
      handled = false;
  }

  if (handled) {
    event.preventDefault();
  }
});
