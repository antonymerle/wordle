export function initBoard(rows, cols) {
  const board = new Array(rows);
  for (let i = 0; i < rows; i++) {
    board[i] = new Array(cols);
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      board[i][j] = null;
    }
  }

  return board;
}

export const displayBoard = (board) => {
  for (let i = 0; i < board.length; i++) {
    let row = "";
    for (let j = 0; j < board[i].length; j++) {
      row += `[${board[i][j] ? board[i][j] : " "}]`;
    }
    console.log(row);
  }
};

export function generateHTMLTable(board) {
  let container = document.querySelector("#game-board");
  let table = "";
  table += "<table>";

  for (let i = 0; i < board.length; i++) {
    table += `<tr class="letter-row" id="tr-${i}">`;
    for (let j = 0; j < board[i].length; j++) {
      table += `<td class="letter-box" id="td-${
        board[i].length * i + j
      }"></td>`;
    }
    table += "</tr>";
  }

  table += "</table>";

  container.innerHTML += table;
}

export function revealSoluce(langSelected, mysteryWord) {
  const soluceTraduction =
    langSelected === "en" ? "Mystery word : " : "Solution : ";
  document.querySelector("#soluce").textContent =
    soluceTraduction + mysteryWord;
  document.querySelector("#soluce").style.color = "var(--brun)";
}

export function concealRule() {
  document.querySelector("#rules").style.display = "none";
}

export function concealResults() {
  document.querySelector("#result-container").style.display = "none";
}

export function revealResults() {
  document.querySelector("#result-container").style.display = "block";
}

export function printYear() {
  document.querySelector("#date").innerHTML = new Date().getFullYear();
}

export function normalizeLatinAccents(frenchWord) {
  /*
  1. normalize()ing to NFD Unicode normal form decomposes combined graphemes into the combination of simple ones. 
  The è of Crème ends up expressed as e + ̀.
  2. Using a regex character class to match the U+0300 → U+036F range, it is now trivial to globally get rid of the diacritics, 
  which the Unicode standard conveniently groups as the Combining Diacritical Marks Unicode block. 
  */
  return frenchWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function displayScore(score) {
  document.querySelector("#score").textContent = score;
}

export function triggerDefeat(langSelected, mysteryWord) {
  console.log("trigger defeat");
  document.querySelector("#result").textContent =
    langSelected === "en" ? "GAME OVER" : "PERDU";
  document.querySelector("#result").style.color = "var(--brun)";

  // timeout pour ne pas supprimer trop vite l'état dont dépend la boucle timeout de checkLine
  setTimeout(() => {
    revealResults();
    revealSoluce(langSelected, mysteryWord);
  }, 2000);
  console.log("return défaite");
}
