export const enRules = `
        <h2>How to play :</h2>
        <h3>⚡️⚡️ Guess the wordle in 6 tries ! ⚡️⚡️</h3>
        <ul>
          <li>🔍️  Each guess must be a valid 5-letter word.</li>
          <li>
            ✏️  The color of the tiles will change to show how close your guess
            was to the word.
          </li>
          <li>
            ✅  If the tile is green, the letter is in the word AND in the
            correct spot.
          </li>
          <li>
            💡  If the tile is yellow, the letter is in the word but in the wrong
            spot.
          </li>
          <li>🙈  If the tile is grey, the letter is not in the word.</li>
        </ul>
`;

export const frRules = `
        <h2>Comment jouer :</h2>
        <h3>⚡️⚡️ Devinez le wordle en 6 coups ! ⚡️⚡️</h3>
        <ul>
          <li>🔍️  Chaque tentative doit être un mot valide de 5 lettres, sans accents.</li>
          <li>
            ✏️  La couleur des cases changera en fonction de votre résultat.
          </li>
          <li>
            ✅  Si la case est verte, la lettre se trouve au bon endroit dans le mot à deviner.
          </li>
          <li>
            💡  Si la case est jaune, la lettre est dans le mot mais au mauvais endroit.
          </li>
          <li>🙈  Si la case est grise, la lettre n'est pas dans le mot.</li>
        </ul>

`;

export function translate(languageCode) {
  console.log("arg " + languageCode);

  if (languageCode === "fr") {
    document.querySelector("html").lang = "fr";
    console.log("change langue français");

    document.querySelector("#rules").innerHTML = frRules;
    document.querySelector("label").textContent = "Choisissez votre langue:";
    document.querySelector("#newGame").textContent = "NOUVELLE PARTIE";
  } else {
    console.log("change langue anglais");

    document.querySelector("html").lang = "en";
    document.querySelector("#rules").innerHTML = enRules;
    document.querySelector("label").textContent = "Choose a language:";
    document.querySelector("#newGame").textContent = "NEW GAME";
  }
}

export function setAPILang(languageCode) {
  switch (languageCode) {
    case "en":
      return "https://random-word-api.herokuapp.com/word?length=5";

    case "fr":
      return "./filteredFrenchWord.json";

    default:
      return "https://random-word-api.herokuapp.com/word?length=5";
  }
}
