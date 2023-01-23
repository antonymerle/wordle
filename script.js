/*

  Au clic sur le bouton New Game (#newGame), 
  la route précédemment créée doit se lancer et une nouvelle partie doit démarrer 
  en faisant afficher le tableau de jeu (#game-board). 
  Votre tableau de jeu comprendra 6 rangs horizontaux qui devront porter la class "letter-row" 
  et le nombre de cases verticales devra correspondre au nombre de lettres dans votre mot.

  [LIGNES][COLONNES]
  [i][j]

  DONE : filtrer les non caractères du clavier (tab, etc)
  DONE : changer background-color en fonction de la lettre
  DONE : arrêter la saisie si line pleine
  TODO : réinitialiser l'état si newGame en pleine partie (sans faire sauter la protection fetched)
  TODO : fetched = true; => newGame ignore nouveau mot du backend
        1. bouton newGame se transforme en bouton reset game
        2. variable gameOn : boolean
        3. 3e condition (fetched && gameOn true)
  TODO : afficher la règle du wordle quand grille absente
*/

let score = 0;
let fetched = false;
let gameOn = false;
let board = null;
let mysteryWord = "";
let inputArray = [];
let charCountInline = 0;
const ROWS = 6;
let COLS = 0;

// Condition pour contrer le fetch intempestif à chaque touche ENTER pressée
// l'event "click" sur le boutton newGame était déclenché.
//
document.querySelector("#newGame").addEventListener("keydown", (e) => {
  const key = e.keyCode || e.charCode;
  if (key == 13) {
    e.stopPropagation();
    e.preventDefault();
  }
});

document.querySelector("#newGame").addEventListener("click", (e) => {
  console.log("*************** FETCH *************");
  // e.preventDefault();
  // e.stopImmediatePropagation();
  fetch("https://random-word-api.herokuapp.com/word?length=5")
    .then((response) => response.json())
    .then((data) => {
      // TODO : résoudre ce problème à la racine et retirer cette condition
      // console.log({ fetched, gameOn });

      if (!fetched) {
        console.log("INIT GAME");

        const table = document.querySelector("table");
        if (table) table.remove();
        document.querySelector("#result").textContent = "";
        document.querySelector("#result").style.color = "black";
        mysteryWord = data[0];

        // initialisation des données du jeu
        displayScore();
        mysteryWord = data[0];
        COLS = mysteryWord.length;

        // génération du tableau
        board = initBoard(ROWS, COLS);
        displayBoard();
        generateHTMLTable();

        fetched = true;
        gameOn = true;
      }

      // console.log(data);
      // console.log(newGame);
      // console.log("mysteryWord");
      console.log(mysteryWord);

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
  for (let i = 0; i < board.length; i++) {
    let row = "";
    for (let j = 0; j < board[i].length; j++) {
      row += `[${board[i][j] ? board[i][j] : " "}]`;
    }
    console.log(row);
  }
};

function generateHTMLTable() {
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

function getKeyboardInput() {
  const lineLength = board[0].length;

  window.addEventListener("keyup", (e) => {
    // e.preventDefault();
    e.stopImmediatePropagation();
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
    if (inputArray.length >= board.length * lineLength) {
      checkLine(inputArray.length, mysteryWord);
      document.querySelector("#result").textContent = "GAME OVER";
      document.querySelector("#result").style.color = "var(--brun)";
      console.log("debug");

      // timeout pour ne pas supprimer trop vite l'état dont dépend la boucle timeout de checkLine
      setTimeout(() => {
        resetState();
      }, 2000);

      console.log("return défaite");
    }

    // Handle saisie
    const letter = e.key.toUpperCase();
    if (letter == "BACKSPACE" && !inputArray.length) {
      // le tableau est vide, impossible de supprimer un caractère
      return;
    } else if (letter == "BACKSPACE" && inputArray.length > 0) {
      // Supprime un caractère
      document.querySelector(`#td-${inputArray.length - 1}`).textContent = "";
      document
        .querySelector(`#td-${inputArray.length - 1}`)
        .classList.remove("filled-box");

      inputArray.pop();
      charCountInline--;
    } else if (letter != "ENTER" && charCountInline < mysteryWord.length) {
      // on n'enregistre l'entrée que si le nombre de lettres ne dépasse pas la limite de la ligne
      inputArray.push(letter);
      charCountInline++;

      document.querySelector(`#td-${inputArray.length - 1}`).textContent =
        letter;
      document
        .querySelector(`#td-${inputArray.length - 1}`)
        .classList.add("filled-box");
    }
    console.log(charCountInline);

    // Handle validation de la saisie avec entrée
    if (letter == "ENTER" && inputArray.length % lineLength) {
      // entrée mais pas assez de lettres
      document.querySelector("#result").textContent = "Not enough letters !";
    } else if (inputArray.length % lineLength === 0 && letter == "ENTER") {
      checkLine(inputArray.length, mysteryWord);
      charCountInline = 0;
    }
  });
}

function checkLine(indexOfLastChar, mysteryWord) {
  /*  on prend l'index absolu de la dernière lettre entrée,
      partant du principe qu'elle se situe toujours à la fin d'un ligne
      et on vérifie la ligne en retranchant la length du mot
  */
  // Edge case l'utilisateur appuie sur entrée sans avoir entré de lettres
  if (inputArray.length === 0) return;

  const startIndex = indexOfLastChar - 5;
  let verif = "";
  // vérification de chaque lettre de la ligne par rapport au mot mystère
  // vérification de chaque lettre de la ligne par rapport au mot mystère
  for (let i = startIndex, j = 0; i < indexOfLastChar; i++, j++) {
    console.log(inputArray);
    ((ind) => {
      setTimeout(function () {
        if (inputArray[i].toLowerCase() === mysteryWord[j].toLowerCase()) {
          verif += "x";
          document.querySelector(`#td-${i}`).style.backgroundColor =
            "var(--tileGreen)";
        } else if (
          mysteryWord.toLowerCase().includes(inputArray[i].toLowerCase())
        ) {
          verif += "-";
          document.querySelector(`#td-${i}`).style.backgroundColor = "yellow";
        } else {
          verif += "_";
          document.querySelector(`#td-${i}`).style.backgroundColor = "grey";
        }
        console.log("indice :" + 300 * ind);
      }, 300 * ind);
    })(i % mysteryWord.length);
  }
  const lineContent = inputArray.slice(startIndex, indexOfLastChar).join("");

  // tests condition victoire
  if (lineContent.toLowerCase() === mysteryWord.toLowerCase()) {
    console.log("debug");

    // timeout pour ne pas supprimer trop vite l'état dont dépend la boucle timeout de checkLine
    setTimeout(() => {
      document.querySelector("#result").textContent = "YOU WON!";
      document.querySelector("#result").style.color = "var(--tileGreen)";
      document.querySelector("#result").style.textShadow = "1px 1px black";
      displayScore(++score);
      resetState();
    }, 2000);
  }
}

function displayScore() {
  document.querySelector("#score").textContent = score;
}

function resetState() {
  fetched = false;
  gameOn = false;
  board = null;
  mysteryWord = "";
  inputArray = [];
  charCountInline = 0;
  COLS = 0;

  console.log("state reset");
}
