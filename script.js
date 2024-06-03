document.addEventListener("DOMContentLoaded", (event) => {
  const gridContainer = document.getElementById("sudoku-grid");

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement("div");
      cell.classList.add("sudoku-cell");

      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = "1";
      input.tabIndex = row * 9 + col + 1;
      input.dataset.row = row;
      input.dataset.col = col;
      input.addEventListener("input", (e) => {
        const value = e.target.value;
        if (!/^[1-9]$/.test(value)) {
          e.target.value = "";
        }
      });

      input.addEventListener("keydown", handleArrowKeys);

      cell.appendChild(input);
      gridContainer.appendChild(cell);
    }
  }

  document.getElementById("solve-button").addEventListener("click", () => {
    const gridString = getGridString();
    console.log(gridString);
    const solution = sudoku.solve(gridString);
    console.log(solution);
    displaySolution(solution, gridString);
  });

  document.getElementById("clear-button").addEventListener("click", clearBoard);
});

function handleArrowKeys(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);

  switch (e.key) {
    case "ArrowUp":
      if (row > 0) {
        moveFocusTo(row - 1, col);
      }
      break;
    case "ArrowDown":
      if (row < 8) {
        moveFocusTo(row + 1, col);
      }
      break;
    case "ArrowLeft":
      if (col > 0) {
        moveFocusTo(row, col - 1);
      }
      break;
    case "ArrowRight":
      if (col < 8) {
        moveFocusTo(row, col + 1);
      }
      break;
    default:
      break;
  }
}

function moveFocusTo(row, col) {
  const nextInput = document.querySelector(
    `input[data-row="${row}"][data-col="${col}"]`
  );
  if (nextInput) {
    nextInput.focus();
  }
}

function getGridString() {
  let gridString = "";
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const input = document.querySelector(
        `input[data-row="${row}"][data-col="${col}"]`
      );
      const value = input.value;
      gridString += value ? value : ".";
    }
  }
  return gridString;
}

function displaySolution(solution, original) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;
      const input = document.querySelector(
        `input[data-row="${row}"][data-col="${col}"]`
      );
      if (original[index] === ".") {
        input.value = solution[index];
        input.classList.add("solved-cell");
      }
    }
  }
}

function clearBoard() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const input = document.querySelector(
        `input[data-row="${row}"][data-col="${col}"]`
      );
      input.value = "";
      input.classList.remove("solved-cell");
    }
  }
}
