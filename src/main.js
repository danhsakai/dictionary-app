import "./style.css";
const main = document.querySelector("main");
const switchTrack = document.querySelector(".dictionary-app__theme-toggle-track");
const btnToggle = document.querySelector(".dictionary-app__theme-toggle");
const btnMenu = document.querySelector(".dictionary-app__font-trigger");
const menuFont = document.querySelector(".dictionary-app__font-menu");
const switchThumb = document.querySelector(".dictionary-app__theme-toggle-thumb");
const wordEntry = document.querySelector(".dictionary-app__entry");
const inputWord = document.querySelector(".dictionary-app__search-input");
const btnSearch = document.querySelector(".dictionary-app__search button");
const THEME_STORAGE_KEY = "dictionary-app-theme";

function applyTheme(theme) {
  const isDarkTheme = theme === "dark";
  document.body.dataset.theme = isDarkTheme ? "dark" : "light";
  switchThumb.classList.toggle("dictionary-app__theme-toggle-thumb--active", isDarkTheme);
  btnToggle.setAttribute("aria-pressed", String(isDarkTheme));
  switchTrack.style.backgroundColor = isDarkTheme ? "var(--color-accent)" : "var(--color-track)";
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme ?? (prefersDark ? "dark" : "light"));
}

btnToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});

initTheme();
btnMenu.addEventListener("click", () => {
  menuFont.classList.toggle("dictionary-app__font-menu--active");
});

// Better approach
async function getWord(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) throw new Error(`Word "${word}" not found`);

    const [wordData] = await response.json();
    console.log(wordData);

    return {
      name: wordData.word,
      audio: wordData.phonetics?.find((p) => p.audio)?.audio,
      phonetic: wordData.phonetic,
      meanings: wordData.meanings,
      source: wordData.sourceUrls[0],
    };
  } catch (error) {
    console.error("Error fetching word:", error);
    throw error;
  }
}

async function analytic(data) {
  try {
    const word = await getWord(data);
    wordEntry.insertAdjacentHTML("beforebegin", renderHeader(word));
    renderBody(word.meanings);
    renderSource(word.name);
    void playAudio(word.audio);
  } catch {
    renderError(`Sorry, we couldn't find the word "${data}". Please try another word.`);
  }
}

function renderHeader(word) {
  return `<div class="dictionary-app__entry-header">
          <div class="dictionary-app__entry-title-group">
            <h1 class="dictionary-app__word">${word.name}</h1>
            <p class="dictionary-app__phonetic">${word.phonetic}</p>
          </div>
          <button
            class="dictionary-app__audio-button"
            type="button"
            aria-label="Play pronunciation"
          >
            <iconify-icon
              class="dictionary-app__audio-icon"
              icon="material-symbols:play-arrow-rounded"
              width="46"
              height="46"
            ></iconify-icon>
          </button>
        </div>`;
}
function renderBody(meanings) {
  meanings.forEach((mean) => {
    const body = document.createElement("div");
    body.classList.add("dictionary-app__entry-body");
    wordEntry.insertAdjacentElement("beforeend", body);
    body.insertAdjacentHTML(
      "afterbegin",
      `<div class="dictionary-app__part-of-speech"><span>${mean.partOfSpeech}</span></div>
          <h3 class="dictionary-app__section-title">Meaning</h3>
          <ul class="dictionary-app__meaning-list">
          </ul><p class="dictionary-app__synonyms">Synonyms: <span></span></p>`,
    );
    const defList = body.querySelector(".dictionary-app__meaning-list");
    const synonymsList = body.querySelector(".dictionary-app__synonyms span");

    mean.definitions.forEach((def) => {
      defList.insertAdjacentHTML(
        "beforeend",

        `<li class="dictionary-app__meaning-item">
              <p class="dictionary-app__meaning-text">
                ${def.definition}
              </p>
              <p class="dictionary-app__meaning-example">
               ${def.example ? def.example : ""}
              </p>
            </li>`,
      );
    });

    renderSynonyms(mean.synonyms, synonymsList);
  });
}

function renderSynonyms(synonyms, target) {
  if (!target) return;

  const displaySynonyms = [...new Set(synonyms ?? [])].slice(0, 3);
  target.textContent = displaySynonyms.length ? displaySynonyms.join(", ") : "None";
}
function renderSource(word) {
  wordEntry.insertAdjacentHTML(
    "beforeend",
    `<hr><div class="dictionary-app__source">
          <p class="dictionary-app__source-label">Source:</p>
          <a
            class="dictionary-app__source-link"
            href="https://en.wiktionary.org/wiki/${word}"
            target="_blank"
            rel="noopener noreferrer"
            >https://en.wiktionary.org/wiki/${word}</a
          >
        </div>
    `,
  );
}
async function playAudio(sourceAudio) {
  const btnPlayAudio = document.querySelector(".dictionary-app__audio-button");
  if (!btnPlayAudio || !sourceAudio) return;

  btnPlayAudio.addEventListener("click", () => {
    const phonetic = new Audio(sourceAudio);
    phonetic.play().catch((error) => {
      console.error("Failed to play audio:", error);
    });
  });
}
function renderError(message) {
  wordEntry.insertAdjacentHTML(
    "beforebegin",
    `<div class="dictionary-app__error" style="padding: 24px; text-align: center;">
      <h2 style="font-size: 1.5rem; margin-bottom: 12px;">😔</h2>
      <p style="font-size: 1.1rem; color: #666;">${message}</p>
    </div>`,
  );
}
function getSearchValue() {
  const runSearch = () => {
    const searchWord = inputWord.value.trim();
    if (!searchWord) return;

    const previousHeader = wordEntry.previousElementSibling;
    if (previousHeader?.classList.contains("dictionary-app__entry-header")) {
      previousHeader.remove();
    }

    const previousError = wordEntry.previousElementSibling;
    if (previousError?.classList.contains("dictionary-app__error")) {
      previousError.remove();
    }

    wordEntry.innerHTML = "";
    void analytic(searchWord);
  };

  btnSearch.addEventListener("click", runSearch);
  inputWord.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });
}

function changeFont() {
  menuFont.addEventListener("click", (e) => {
    const font = e.target.textContent;
    if (!font) return;
    if (font.toLowerCase() == "sans serif") {
      main.style.fontFamily = "var(--font-sans)";
    }
    if (font.toLowerCase() == "serif") main.style.fontFamily = "var(--font-serif)";

    if (font.toLowerCase() == "mono") main.style.fontFamily = "var(--font-mono)";
    btnMenu.textContent = font;
    menuFont.classList.toggle("dictionary-app__font-menu--active");
  });
}
changeFont();
await analytic("greet");
getSearchValue();
