/*
  DONE : filtrer les non caractères du clavier (tab, etc)
  DONE : changer background-color en fonction de la lettre
  DONE : arrêter la saisie si line pleine
  DONE : réinitialiser l'état si newGame en pleine partie (sans faire sauter la protection fetched)
  DONE : résoudre le fetch intempestif
  DONE : afficher la règle du wordle quand grille absente
  DONE : newGame en cours de partie ne réinitialise pas arrayInput
  DONE : expected behaviour : cannot validate line if 0 chars
  DONE : modularize html in js
  DONE : backspace must be discarded as a displayed character
  DONE : choix de la langue
  DONE : remplacer par un setInterval avec un liseré rouge sur les cases restantes de la ligne incomplète
  DONE : fix bug defeat div hidden
  DONE : responsive design
  DONE : make board responsive so it can be seen on small screens.
  DONE : header height minimal
  DONE : center h1
  DONE : handle not enough letters with css
  DONE : favicon
  DONE : fix bug display soluce when win on 6th row
  TODO : factorize
  TODO : clean code
*/

import { translate, setAPILang } from "./translate.js";
import {
  initBoard,
  displayBoard,
  generateHTMLTable,
  concealRule,
  concealResults,
  printYear,
  normalizeLatinAccents,
  displayScore,
  triggerDefeat,
} from "./wordleLib.js";

// init global state

const ROWS = 6;
let COLS = 0;

let gameState = {
  score: 0,
  board: null, // array<null>[6][5]
  mysteryWord: "",
  inputArray: [],
  charCountInline: 0,
  langSelected: "en",
};

const select = document.querySelector("#lang-select");
select.selectedIndex = 0;

// Condition pour contrer le fetch intempestif à chaque touche ENTER pressée
// l'event "click" sur le boutton newGame était déclenché.

document.querySelector("#newGame").addEventListener("keydown", (e) => {
  const key = e.keyCode || e.charCode;
  if (key == 13) {
    e.stopPropagation();
    e.preventDefault();
  }
});

select.addEventListener("change", (e) => {
  console.log("event : " + e.target.value);

  gameState.langSelected = e.target.value;
  translate(gameState.langSelected);
});

// game logic
document.querySelector("#newGame").addEventListener("click", () => {
  console.log("*************** FETCH *************");

  // const langSelected = document.getElementById("lang-select").value;
  console.log("langue selected : " + gameState.langSelected);

  resetState();
  fetch(setAPILang(gameState.langSelected))
    .then((response) => response.json())
    .then((data) => {
      // itinialisation
      if (data) {
        if (gameState.langSelected === "en") {
          // API returns a single word in an array
          gameState.mysteryWord = data[0];
        } else if (gameState.langSelected === "fr") {
          // Returns a word array
          const randomArrayIndex = Math.floor(Math.random() * data.length);
          const frenchWord = data[randomArrayIndex];
          gameState.mysteryWord = normalizeLatinAccents(frenchWord);
        }
      }
      console.log(gameState.mysteryWord);

      concealRule();
      concealResults();
      initGame();
      getKeyboardInput();
    })
    .catch((error) => console.log({ error }));
});

displayScore(gameState.score);
translate(gameState.langSelected);
printYear();

/****************************************
 * functions mutating global game state *
 ****************************************/

function getKeyboardInput() {
  try {
    gameState.board[0].length === gameState.mysteryWord.length;
  } catch (error) {
    console.error(
      "Something went wrong : line lenght does not match mystery word length"
    );
  }
  const lineLength = gameState.board[0].length;

  window.addEventListener("keyup", (e) => {
    e.stopImmediatePropagation(); // nécessaire pour ne pas doubler l'input à chaque nouvelle partie

    // Discard non letters
    if (
      !e.key.match(/[a-z]/i) ||
      (e.keyCode < 65 && e.keyCode !== 13 && e.keyCode !== 8) ||
      (e.keyCode > 122 && e.keyCode !== 13 && e.keyCode !== 8)
    ) {
      console.log("discarded keycode : ", e.keyCode);
      return;
    }

    // Handle saisie
    const letter = e.key.toUpperCase();

    // le tableau est vide, impossible de supprimer un caractère
    if (letter == "BACKSPACE" && !gameState.inputArray.length) {
      return;
    }
    // On veut supprimer un caractère
    else if (letter == "BACKSPACE" && gameState.charCountInline > 0) {
      document.querySelector(
        `#td-${gameState.inputArray.length - 1}`
      ).textContent = "";
      document
        .querySelector(`#td-${gameState.inputArray.length - 1}`)
        .classList.remove("filled-box");

      gameState.inputArray.pop();
      gameState.charCountInline--;
      console.log("chars in line : ", gameState.charCountInline);
    }
    // on n'enregistre l'entrée que si le nombre de lettres ne dépasse pas la limite de la ligne
    else if (
      letter != "ENTER" &&
      letter != "BACKSPACE" &&
      gameState.charCountInline < gameState.mysteryWord.length
    ) {
      gameState.inputArray.push(letter);
      gameState.charCountInline++;

      document.querySelector(
        `#td-${gameState.inputArray.length - 1}`
      ).textContent = letter;
      document
        .querySelector(`#td-${gameState.inputArray.length - 1}`)
        .classList.add("filled-box");
      document
        .querySelector(`#td-${gameState.inputArray.length - 1}`)
        .classList.remove("missing-letter");
      console.log("chars in line : ", gameState.charCountInline);
    }

    // Handle line validation with ENTER key
    // not enough chars in line
    else if (
      letter == "ENTER" &&
      (gameState.inputArray.length % lineLength !== 0 ||
        gameState.charCountInline === 0)
    ) {
      document.querySelector("#result").textContent = "Not enough letters !";

      // CSS animation shenanigans
      const missingLettersNumber = COLS - (gameState.inputArray.length % COLS);
      console.log(`Not enough letters ! Need ${missingLettersNumber} more !`);

      for (let i = 0; i < missingLettersNumber; i++) {
        document
          .querySelector(`#td-${gameState.inputArray.length + i}`)
          .classList.add("missing-letter");
      }
      setTimeout(() => {
        for (let i = 0; i < missingLettersNumber; i++) {
          document
            .querySelector(`#td-${gameState.inputArray.length + i}`)
            .classList.remove("missing-letter");
        }
      }, 2000);
    } else if (
      gameState.inputArray.length % lineLength === 0 &&
      letter == "ENTER"
    ) {
      checkLine(gameState.inputArray.length);
      gameState.charCountInline = 0;
      console.log("reset chars in line : ", gameState.charCountInline);
    }
  });
}

function checkLine(indexOfLastChar) {
  /*  on prend l'index absolu de la dernière lettre entrée,
      partant du principe qu'elle se situe toujours à la fin d'un ligne
      et on vérifie la ligne en retranchant la length du mot
  */
  // Edge case l'utilisateur appuie sur entrée sans avoir entré de lettres
  if (gameState.inputArray.length === 0) return;
  let verif = "";
  const startIndex = indexOfLastChar - 5;
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

  // tests win/lose
  if (lineContent.toLowerCase() === gameState.mysteryWord.toLowerCase()) {
    triggerVictory();
  } else if (
    // game over if board is full
    gameState.inputArray.length >= ROWS * COLS &&
    lineContent.toLowerCase() !== gameState.mysteryWord.toLowerCase()
  ) {
    triggerDefeat(gameState.langSelected, gameState.mysteryWord);
  }
}

function resetState() {
  gameState.board = null;
  gameState.mysteryWord = "";
  gameState.inputArray = [];
  gameState.charCountInline = 0;
  COLS = 0;

  console.log("state reset");
}

function initGame() {
  console.log("INIT GAME");
  const table = document.querySelector("table");
  if (table) table.remove();
  document.querySelector("#result").textContent = "";
  document.querySelector("#soluce").textContent = "";
  document.querySelector("#result").style.color = "black";

  COLS = gameState.mysteryWord.length;

  // generate HTML board from data structure
  gameState.board = initBoard(ROWS, COLS);
  displayBoard(gameState.board);
  generateHTMLTable(gameState.board);
}

function triggerVictory() {
  // timeout pour ne pas supprimer trop vite l'état dont dépend la boucle timeout de checkLine
  setTimeout(() => {
    document.querySelector("#result-container").style.display = "flex";
    document.querySelector("#result").textContent =
      gameState.langSelected === "en" ? "YOU WON!" : "GAGNÉ!";
    document.querySelector("#result").style.color = "var(--tileGreen)";
    document.querySelector("#result").style.textShadow = "1px 1px black";
    displayScore(++gameState.score);
  }, 2000);
}
