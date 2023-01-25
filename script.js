/*
  DONE : filtrer les non caractères du clavier (tab, etc)
  DONE : changer background-color en fonction de la lettre
  DONE : arrêter la saisie si line pleine
  DONE : réinitialiser l'état si newGame en pleine partie (sans faire sauter la protection fetched)
  DONE : résoudre le fetch intempestif
  DONE : afficher la règle du wordle quand grille absente
  DONE : newGame en cours de partie ne réinitialise pas arrayInput
  TODO : responsive design
  TODO : toggle règle/grille
  TODO : choix de la langue
*/

// game state, variables et constantes

const ROWS = 6;
let COLS = 0;

let gameState = {
  score: 0,
  board: null,
  mysteryWord: "",
  inputArray: [],
  charCountInline: 0,
};

// Condition pour contrer le fetch intempestif à chaque touche ENTER pressée
// l'event "click" sur le boutton newGame était déclenché.

document.querySelector("#newGame").addEventListener("keydown", (e) => {
  const key = e.keyCode || e.charCode;
  if (key == 13) {
    e.stopPropagation();
    e.preventDefault();
  }
});

// document.querySelector("#lang-select").addEventListener("change", (e) => {
//   changeLang(e.target.value);
// });

// logic

document.querySelector("#newGame").addEventListener("click", (e) => {
  console.log("*************** FETCH *************");
  // e.preventDefault();
  // e.stopImmediatePropagation();

  const langSelected = document.getElementById("lang-select").value;
  console.log(langSelected);

  resetState();
  fetch(setAPILang(langSelected))
    .then((response) => response.json())
    .then((data) => {
      // itinialisation
      if (data) {
        concealRule();
      }
      if (langSelected === "fr") {
        const randomArrayNumber = Math.floor(Math.random() * data.length);
        console.log(randomArrayNumber);

        data = data[randomArrayNumber];
        // normalize accents
        /*
        1. normalize()ing to NFD Unicode normal form decomposes combined graphemes into the combination of simple ones. 
        The è of Crème ends up expressed as e + ̀.
        2. Using a regex character class to match the U+0300 → U+036F range, it is now trivial to globally get rid of the diacritics, 
        which the Unicode standard conveniently groups as the Combining Diacritical Marks Unicode block. 
        */
        data = data.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        data = [data];
        console.log(data);
      }
      initGame(data);

      // prise en charge input
      console.log("prise en charge input");
      getKeyboardInput();
    });
});

function initBoard(rows, cols) {
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

const displayBoard = () => {
  for (let i = 0; i < gameState.board.length; i++) {
    let row = "";
    for (let j = 0; j < gameState.board[i].length; j++) {
      row += `[${gameState.board[i][j] ? gameState.board[i][j] : " "}]`;
    }
    console.log(row);
  }
};

function generateHTMLTable() {
  let container = document.querySelector("#game-board");
  let table = "";
  table += "<table>";

  for (let i = 0; i < gameState.board.length; i++) {
    table += `<tr class="letter-row" id="tr-${i}">`;
    for (let j = 0; j < gameState.board[i].length; j++) {
      table += `<td class="letter-box" id="td-${
        gameState.board[i].length * i + j
      }"></td>`;
    }
    table += "</tr>";
  }

  table += "</table>";

  container.innerHTML += table;
}

function getKeyboardInput() {
  const lineLength = gameState.board[0].length;

  window.addEventListener("keyup", (e) => {
    // e.preventDefault();
    e.stopImmediatePropagation(); // nécessaire pour ne pas doubler l'input à chaque nouvelle partie
    // Discard non letters
    document.querySelector("#result").textContent = "";
    if (
      !e.key.match(/[a-z]/i) ||
      (e.keyCode < 65 && e.keyCode !== 13 && e.keyCode !== 8) ||
      (e.keyCode > 122 && e.keyCode !== 13 && e.keyCode !== 8)
    ) {
      return;
    }

    // game over if board is full
    checkDefeat(lineLength);

    // Handle saisie
    const letter = e.key.toUpperCase();
    if (letter == "BACKSPACE" && !gameState.inputArray.length) {
      // le tableau est vide, impossible de supprimer un caractère
      return;
    } else if (letter == "BACKSPACE" && gameState.inputArray.length > 0) {
      // Supprime un caractère
      document.querySelector(
        `#td-${gameState.inputArray.length - 1}`
      ).textContent = "";
      document
        .querySelector(`#td-${gameState.inputArray.length - 1}`)
        .classList.remove("filled-box");

      gameState.inputArray.pop();
      gameState.charCountInline--;
    } else if (
      letter != "ENTER" &&
      gameState.charCountInline < gameState.mysteryWord.length
    ) {
      // on n'enregistre l'entrée que si le nombre de lettres ne dépasse pas la limite de la ligne
      gameState.inputArray.push(letter);
      gameState.charCountInline++;

      document.querySelector(
        `#td-${gameState.inputArray.length - 1}`
      ).textContent = letter;
      document
        .querySelector(`#td-${gameState.inputArray.length - 1}`)
        .classList.add("filled-box");
    }
    console.log(gameState.charCountInline);

    // Handle validation de la saisie avec entrée
    if (letter == "ENTER" && gameState.inputArray.length % lineLength) {
      // entrée mais pas assez de lettres
      document.querySelector("#result").textContent = "Not enough letters !";
    } else if (
      gameState.inputArray.length % lineLength === 0 &&
      letter == "ENTER"
    ) {
      checkLine(gameState.inputArray.length, gameState.mysteryWord);
      gameState.charCountInline = 0;
    }
  });
}

function checkLine(indexOfLastChar, mysteryWord) {
  /*  on prend l'index absolu de la dernière lettre entrée,
      partant du principe qu'elle se situe toujours à la fin d'un ligne
      et on vérifie la ligne en retranchant la length du mot
  */
  // Edge case l'utilisateur appuie sur entrée sans avoir entré de lettres
  if (gameState.inputArray.length === 0) return;

  const startIndex = indexOfLastChar - 5;
  let verif = "";
  // vérification de chaque lettre de la ligne par rapport au mot mystère
  // vérification de chaque lettre de la ligne par rapport au mot mystère
  for (let i = startIndex, j = 0; i < indexOfLastChar; i++, j++) {
    console.log(gameState.inputArray);
    ((ind) => {
      setTimeout(function () {
        if (
          gameState.inputArray[i].toLowerCase() ===
          gameState.mysteryWord[j].toLowerCase()
        ) {
          verif += "x";
          document.querySelector(`#td-${i}`).style.backgroundColor =
            "var(--tileGreen)";
        } else if (
          gameState.mysteryWord
            .toLowerCase()
            .includes(gameState.inputArray[i].toLowerCase())
        ) {
          verif += "-";
          document.querySelector(`#td-${i}`).style.backgroundColor = "yellow";
        } else {
          verif += "_";
          document.querySelector(`#td-${i}`).style.backgroundColor = "grey";
        }
        console.log("indice :" + 300 * ind);
      }, 300 * ind);
    })(i % gameState.mysteryWord.length);
  }
  const lineContent = gameState.inputArray
    .slice(startIndex, indexOfLastChar)
    .join("");

  // tests condition victoire
  if (lineContent.toLowerCase() === gameState.mysteryWord.toLowerCase()) {
    console.log("debug");

    // timeout pour ne pas supprimer trop vite l'état dont dépend la boucle timeout de checkLine
    setTimeout(() => {
      document.querySelector("#result").textContent = "YOU WON!";
      document.querySelector("#result").style.color = "var(--tileGreen)";
      document.querySelector("#result").style.textShadow = "1px 1px black";
      displayScore(++gameState.score);
      resetState();
    }, 2000);
  }
}

function displayScore() {
  document.querySelector("#score").textContent = gameState.score;
}

function resetState() {
  gameState.board = null;
  gameState.mysteryWord = "";
  gameState.inputArray = [];
  gameState.charCountInline = 0;
  COLS = 0;

  console.log("state reset");
}

function initGame(wordFromApi) {
  // expects an array of 1 string
  console.log("INIT GAME");
  const table = document.querySelector("table");
  if (table) table.remove();
  document.querySelector("#result").textContent = "";
  document.querySelector("#soluce").textContent = "";
  document.querySelector("#result").style.color = "black";
  gameState.mysteryWord = wordFromApi[0];

  // initialisation des données du jeu
  displayScore();

  COLS = gameState.mysteryWord.length;

  // génération du tableau
  gameState.board = initBoard(ROWS, COLS);
  displayBoard();
  generateHTMLTable();

  console.log(gameState.mysteryWord);
}

function checkDefeat(lineLength) {
  if (gameState.inputArray.length >= gameState.board.length * lineLength) {
    checkLine(gameState.inputArray.length, gameState.mysteryWord);
    document.querySelector("#result").textContent = "GAME OVER";
    document.querySelector("#result").style.color = "var(--brun)";

    revealSoluce();

    // timeout pour ne pas supprimer trop vite l'état dont dépend la boucle timeout de checkLine
    setTimeout(() => {
      resetState();
    }, 2000);

    console.log("return défaite");
  }
}

function revealSoluce() {
  document.querySelector("#soluce").textContent =
    "Soluce : " + gameState.mysteryWord;
  document.querySelector("#soluce").style.color = "var(--brun)";
}

function concealRule() {
  document.querySelector("#rules").style.display = "none";
}

function printYear() {
  document.querySelector("#date").innerHTML = new Date().getFullYear();
}

function setAPILang(languageCode) {
  switch (languageCode) {
    case "en":
      return "https://random-word-api.herokuapp.com/word?length=5";

    case "fr":
      return "./filteredFrenchWord.json";

    default:
      return "https://random-word-api.herokuapp.com/word?length=5";
  }
}

printYear();
