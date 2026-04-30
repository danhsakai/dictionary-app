import './style.css';
const switchTrack = document.querySelector(
  '.dictionary-app__theme-toggle-track',
);
const btnToggle = document.querySelector('.dictionary-app__theme-toggle');
const btnMenu = document.querySelector('.dictionary-app__font-trigger');
const menuFont = document.querySelector('.dictionary-app__font-menu');
const switchThumb = document.querySelector(
  '.dictionary-app__theme-toggle-thumb',
);
const wordEntry = document.querySelector('.dictionary-app__entry');
const inputWord = document.querySelector('.dictionary-app__search-input');
const btnSearch = document.querySelector('.dictionary-app__search button');
btnToggle.addEventListener('click', () => {
  switchThumb.classList.toggle('dictionary-app__theme-toggle-thumb--active');
  if (
    switchThumb.classList.contains('dictionary-app__theme-toggle-thumb--active')
  ) {
    switchTrack.style.backgroundColor = 'hsl(274, 82%, 55%)';
  } else switchTrack.style.backgroundColor = '#757575';
});
btnMenu.addEventListener('click', () => {
  menuFont.classList.toggle('dictionary-app__font-menu--active');
});

// Better approach
async function getWord(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
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
    console.error('Error fetching word:', error);
    throw error;
  }
}
console.log(await getWord('word'));
async function analytic(data) {
  const word = await getWord(data);
  wordEntry.insertAdjacentHTML('beforebegin', renderHeader(word));
  renderBody(word.meanings);
  renderSource(word.source);
  playAudio(word.audio);
}
await analytic('animal');

function renderHeader(word) {
  return `<div class="dictionary-app__entry-header">
          <div class="dictionary-app__entry-title-group">
            <h1 class="dictionary-app__word">${word.name}</h1>
            <p class="dictionary-app__phonetic">${word.phonetic}/</p>
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
              style="color: hsl(274, 82%, 55%)"
            ></iconify-icon>
          </button>
        </div>`;
}
function renderBody(meanings) {
  meanings.forEach((mean) => {
    const body = document.createElement('div');
    body.classList.add('dictionary-app__entry-body');
    wordEntry.insertAdjacentElement('beforeend', body);
    body.insertAdjacentHTML(
      'afterbegin',
      `<div class="dictionary-app__part-of-speech"><span>${mean.partOfSpeech}</span></div>
          <h3 class="dictionary-app__section-title">Meaning</h3>
          <ul class="dictionary-app__meaning-list">
          </ul><p class="dictionary-app__synonyms">Synonyms: <span></span></p>`,
    );
    const defList = body.querySelector('.dictionary-app__meaning-list');
    const synonymsList = body.querySelector('.dictionary-app__synonyms span');

    mean.definitions.forEach((def) => {
      defList.insertAdjacentHTML(
        'beforeend',

        `<li class="dictionary-app__meaning-item">
              <p class="dictionary-app__meaning-text">
                ${def.definition}
              </p>
              <p class="dictionary-app__meaning-example">
               ${def.example ? def.example : ''}
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
  target.textContent = displaySynonyms.length
    ? displaySynonyms.join(', ')
    : 'None';
}
function renderSource(source) {
  wordEntry.insertAdjacentHTML(
    'beforeend',
    `<hr><div class="dictionary-app__source">
          <p class="dictionary-app__source-label">Source:</p>
          <a
            class="dictionary-app__source-link"
            href="${source}"
            target="_blank"
            rel="noopener noreferrer"
            >${source}</a
          >
        </div>
    `,
  );
}
async function playAudio(sourceAudio) {
  const btnPlayAudio = document.querySelector('.dictionary-app__audio-button');
  if (!btnPlayAudio || !sourceAudio) return;

  btnPlayAudio.addEventListener('click', () => {
    const phonetic = new Audio(sourceAudio);
    phonetic.play().catch((error) => {
      console.error('Failed to play audio:', error);
    });
  });
}
function getSearchValue() {
  const runSearch = () => {
    const searchWord = inputWord.value.trim();
    if (!searchWord) return;

    const previousHeader = wordEntry.previousElementSibling;
    if (previousHeader?.classList.contains('dictionary-app__entry-header')) {
      previousHeader.remove();
    }

    wordEntry.innerHTML = '';
    analytic(searchWord);
  };

  btnSearch.addEventListener('click', runSearch);
  inputWord.addEventListener('input', (event) => {
    event.preventDefault();
    runSearch();
  });
}
getSearchValue();
