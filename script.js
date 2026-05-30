/* =========================================
   MOVES LIST
========================================= */

const MOVES = [
  "Alf", "All Bee", "All In", "Alpha", "ATL Stomp",
  "Back Jump", "Bankhead Bounce", "Barbie", "Bart Simpson", "Baseball Bat",
  "Basketball", "Bedrock", "Bernie", "Biz Markie", "Bow & Arrow",
  "Box Step", "Brooklyn Bounce", "Brooklyn Stomp", "Bump", "Butt",
  "Butterfly", "Cabbage Patch", "Camel Walk", "Carlton", "Cat Daddy",
  "Charleston", "Cherry Hill", "Crab Step", "Crazy Legs", "Creep",
  "Criss Cross", "Cross Step", "V Step", "James Brown", "Dippin",
  "D-mac", "Do the 40's", "Do The James", "Doll", "Drop Dance",
  "Elbows Up", "Gougie", "Gucci", "Guess", "Famous Dancer",
  "Fatler MC", "Fila", "Flava Flave", "Flinstone", "Fred Samford",
  "Funky Chicken", "Hammer Shake", "Happy Feet", "Heel Toe", "HI",
  "Hit the Folks", "Horse Move", "Humpty Dance", "Indian Step", "Jack & Wave",
  "Jack in the Box", "Janet Jackson", "Jerk", "Karate Kid", "Kick and Slide",
  "Kick Ball Change", "Kick It", "Kick Out", "Knee Twist", "Kool Moe Dee",
  "LL Cool J", "Look It Down", "March Step", "Marry J", "Mike Tyson",
  "Millie Rock", "Minnesota Shake", "Monastery", "Nasty Step", "Orange Justice",
  "Pacman", "Pas De Bourree", "Patty Duke", "Pendulum", "Pimp Walk",
  "Pin Drop", "Popcorn", "Pope", "Punch It", "Sexy Walk",
  "Raise the Roof", "Raja", "Real Love", "Reebok", "Reject",
  "Robocop", "Rock Off", "Roger Rabbit", "Roller Skate", "Roof Top",
  "Rope", "Running Man", "Skate", "Stop Bus", "Hit The Quon",
  "Shamrock", "Smurf", "Shmurda", "Step and Slide", "Superman",
  "Stich Roll", "Souljia", "Side Walk", "Swaggy Daddy", "Sponge Bob",
  "Stick and Roll", "Step and Cross", "Step and Touch", "Skeeter Rabbit", "Steve Martin",
  "Tlc", "Town Wop", "Two Step", "The Biz Markie", "The Wop",
  "The Prep", "Typewriter", "Tip Tap Toe", "Toast It Up", "Up Town"
  // ДОБАВЛЯЕШЬ СЮДА ВСЕ ДВИЖЕНИЯ
]

/* =========================================
   SETTINGS
========================================= */

const QUESTIONS_COUNT = 20

/* =========================================
   SHUFFLE UTILITY
========================================= */

function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/* =========================================
   ALPHABETICALLY DISTRIBUTED SHUFFLE
   Разбивает список по первым буквам и
   берёт по одному движению из каждой
   группы, чередуя — так вопросы всегда
   из разных частей алфавита.
========================================= */

function alphabetDistributedShuffle(moves) {

  // Группируем по первой букве
  const groups = {}
  for (const move of moves) {
    const letter = move[0].toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(move)
  }

  // Перемешиваем внутри каждой группы
  for (const letter in groups) {
    groups[letter] = shuffleArray(groups[letter])
  }

  // Перемешиваем порядок самих букв
  const letters = shuffleArray(Object.keys(groups))

  // Распределяем по принципу round-robin:
  // берём по одному из каждой буквы, пока не кончатся
  const result = []
  let hasMore = true
  let round = 0

  while (hasMore) {
    hasMore = false
    for (const letter of letters) {
      if (groups[letter][round]) {
        result.push(groups[letter][round])
        hasMore = true
      }
    }
    round++
  }

  return result
}

/* =========================================
   GENERATE OPTIONS
   Гарантирует что 4 варианта всегда с
   разных первых букв (никогда не повторяется
   первая буква среди вариантов ответа).
========================================= */

function generateOptions(correctAnswer, allMoves) {

  const correctLetter = correctAnswer[0].toUpperCase()

  // Группируем остальные движения по первой букве
  const byLetter = {}
  for (const move of allMoves) {
    if (move === correctAnswer) continue
    const letter = move[0].toUpperCase()
    if (!byLetter[letter]) byLetter[letter] = []
    byLetter[letter].push(move)
  }

  // Удаляем из пула букву правильного ответа —
  // чтобы 3 неправильных точно были с других букв
  delete byLetter[correctLetter]

  // Перемешиваем буквы
  const availableLetters = shuffleArray(Object.keys(byLetter))

  const wrongAnswers = []

  for (const letter of availableLetters) {
    if (wrongAnswers.length >= 3) break
    const pool = shuffleArray(byLetter[letter])
    wrongAnswers.push(pool[0])
  }

  // Fallback: если уникальных букв не хватает — берём из любых
  if (wrongAnswers.length < 3) {
    const usedNames = new Set([correctAnswer, ...wrongAnswers])
    const extras = shuffleArray(allMoves.filter(m => !usedNames.has(m)))
    while (wrongAnswers.length < 3 && extras.length > 0) {
      wrongAnswers.push(extras.shift())
    }
  }

  return shuffleArray([correctAnswer, ...wrongAnswers])
}

/* =========================================
   BUILD QUESTIONS
   Вопросы распределены по алфавиту —
   никогда не идут подряд несколько движений
   на одну букву.
========================================= */

function buildQuestions() {

  const distributed = alphabetDistributedShuffle(MOVES)
  const selected = distributed.slice(0, QUESTIONS_COUNT)

  return selected.map(move => ({
    video: `videos/${move}.mp4`,
    answer: move,
    options: generateOptions(move, MOVES)
  }))
}

/* =========================================
   STATE
========================================= */

let QUESTIONS = []
let current = 0
let score = 0
let playerName = ''

/* =========================================
   ELEMENTS
========================================= */

const video              = document.getElementById('quizVideo')
const answersEl          = document.getElementById('answers')
const feedbackEl         = document.getElementById('feedback')
const nextBtn            = document.getElementById('nextBtn')
const progressFill       = document.getElementById('progressFill')
const scoreEl            = document.getElementById('score')
const currentQuestionEl  = document.getElementById('currentQuestion')
const totalQuestionsEl   = document.getElementById('totalQuestions')
const replayBtn          = document.getElementById('replayBtn')

/* =========================================
   WELCOME SCREEN
   Приветствие + поле ввода имени.
   Вставляется поверх .quiz-card до старта.
========================================= */

function showWelcomeScreen() {

  const card = document.querySelector('.quiz-card')

  card.innerHTML = `
    <div class="welcome-screen">

      <p class="welcome-msg">
        Салют! Давай проверим насколько<br>хорошо ты знаешь базовые движения)
      </p>

      <div class="name-field">
        <label for="nameInput">Как тебя зовут?</label>
        <input
          id="nameInput"
          type="text"
          placeholder="Введи имя..."
          maxlength="30"
          autocomplete="off"
        />
      </div>

      <button id="startBtn" class="next-btn" style="display:block;">
        НАЧАТЬ ТЕСТ
      </button>

    </div>
  `

  const startBtn   = document.getElementById('startBtn')
  const nameInput  = document.getElementById('nameInput')

  // Снимаем disabled при вводе имени (опционально — старт всегда доступен)
  startBtn.addEventListener('click', () => {
    playerName = nameInput.value.trim() || 'Аноним'
    startQuiz()
  })

  // Запуск по Enter
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') startBtn.click()
  })
}

/* =========================================
   START QUIZ
========================================= */

function startQuiz() {

  QUESTIONS  = buildQuestions()
  current    = 0
  score      = 0

  // Восстанавливаем оригинальную разметку карточки
  const card = document.querySelector('.quiz-card')

  card.innerHTML = `

    <div class="top-bar">
      <div class="progress-info">
        <span id="currentQuestion">1</span> / <span id="totalQuestions">${QUESTIONS.length}</span>
      </div>
      <div class="score-box">SCORE: <span id="score">0</span></div>
    </div>

    <div class="progress-track">
      <div class="progress-fill" id="progressFill"></div>
    </div>

    <div class="video-wrapper">
      <video id="quizVideo" class="quiz-video" playsinline></video>
      <button id="replayBtn" class="replay-btn">↺</button>
    </div>

    <div class="question-label">КАКОЕ ЭТО ДВИЖЕНИЕ?</div>

    <div id="feedback" class="feedback"></div>

    <div id="answers" class="answers"></div>

    <button id="nextBtn" class="next-btn" style="display:none;">
      ДАЛЕЕ →
    </button>

  `

  // Переназначаем ссылки на элементы (они были пересозданы)
  bindElements()

  totalQuestionsEl.textContent = QUESTIONS.length

  loadQuestion()
}

/* =========================================
   BIND ELEMENTS
   Вызывается после пересборки разметки.
========================================= */

function bindElements() {

  // переопределяем переменные через замыкание
  Object.assign(window, {
    quizVideo:       document.getElementById('quizVideo'),
    answersEl:       document.getElementById('answers'),

    feedbackEl:      document.getElementById('feedback'),
    nextBtn:         document.getElementById('nextBtn'),
    progressFill:    document.getElementById('progressFill'),
    scoreEl:         document.getElementById('score'),
    currentQuestionEl: document.getElementById('currentQuestion'),
    totalQuestionsEl:  document.getElementById('totalQuestions'),
    replayBtn:       document.getElementById('replayBtn'),
  })

  window.nextBtn.addEventListener('click', () => {
    current++
    if (current >= QUESTIONS.length) {
      showResults()
    } else {
      loadQuestion()
    }
  })

  window.replayBtn.addEventListener('click', () => {
    window.quizVideo.currentTime = 0
    window.quizVideo.play()
  })
}

/* =========================================
   LOAD QUESTION
========================================= */

function loadQuestion() {

  const q = QUESTIONS[current]

  window.currentQuestionEl.textContent = current + 1
  window.progressFill.style.width =
    `${((current + 1) / QUESTIONS.length) * 100}%`

  // Видео
  window.quizVideo.src = q.video
  window.quizVideo.play()

  // Сброс UI
  window.answersEl.innerHTML   = ''
  window.feedbackEl.textContent = ''
  window.nextBtn.style.display = 'none'

  // Варианты ответа уже перемешаны в buildQuestions()
  q.options.forEach(option => {
    const btn = document.createElement('button')
    btn.className   = 'answer-btn'
    btn.textContent = option
    btn.onclick = () => selectAnswer(btn, option)
    window.answersEl.appendChild(btn)
  })

  preloadNextVideo()
}

/* =========================================
   SELECT ANSWER
========================================= */

function selectAnswer(btn, option) {

  const q       = QUESTIONS[current]
  const buttons = document.querySelectorAll('.answer-btn')

  buttons.forEach(b => b.disabled = true)

  if (option === q.answer) {

    btn.classList.add('correct')
    window.feedbackEl.textContent = 'ПРАВИЛЬНО ✓'
    score++

  } else {

    btn.classList.add('wrong')
    window.feedbackEl.textContent = `ПРАВИЛЬНЫЙ ОТВЕТ: ${q.answer}`

    buttons.forEach(b => {
      if (b.textContent === q.answer) b.classList.add('correct')
    })

  }

  window.scoreEl.textContent   = score
  window.nextBtn.style.display = 'block'
}

/* =========================================
   SHOW RESULTS
========================================= */

function showResults() {

  const percent = Math.round((score / QUESTIONS.length) * 100)

  let grade = ''
  let emoji = ''

  if (percent >= 80) {
    grade = 'Отлично!'
    emoji = '🔥'
  } else if (percent >= 60) {
    grade = 'Хорошо!'
    emoji = '👍'
  } else if (percent >= 40) {
    grade = 'Надо подучить'
    emoji = '📚'
  } else {
    grade = 'Не показывай это Наташе)'
    emoji = '🙈'
  }

  document.querySelector('.quiz-card').innerHTML = `

    <div class="results-screen">

      <p class="results-name">${playerName}</p>

      <h2 class="results-percent">${percent}%</h2>

      <p class="results-score">
        ${score} из ${QUESTIONS.length} правильных ответов
      </p>

      <p class="results-grade">${emoji} ${grade}</p>

      <button
        onclick="location.reload()"
        class="next-btn"
        style="display:block; margin-top: 1.5rem;"
      >
        ПРОЙТИ СНОВА
      </button>

    </div>

  `
}

/* =========================================
   PRELOAD NEXT VIDEO
========================================= */

function preloadNextVideo() {

  const next = QUESTIONS[current + 1]
  if (!next) return

  const preloadVideo = document.createElement('video')
  preloadVideo.src   = next.video
  preloadVideo.preload = 'auto'
}

/* =========================================
   INIT — показываем приветствие при загрузке
========================================= */

showWelcomeScreen()


/* =========================================
   CSS-ЗАГОТОВКИ ДЛЯ НОВЫХ ЭКРАНОВ
   (скопируй в свой style.css)

.welcome-screen,
.results-screen {
  text-align: center;
  padding: 2rem 1rem;
}

.welcome-msg {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.name-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.name-field label {
  font-size: 0.9rem;
  opacity: 0.7;
}

.name-field input {
  padding: 0.6rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
  color: inherit;
  font-size: 1rem;
  text-align: center;
  width: 220px;
  outline: none;
}

.name-field input:focus {
  border-color: rgba(255,255,255,0.5);
}

.results-name {
  font-size: 1rem;
  opacity: 0.6;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.results-percent {
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.4rem;
}

.results-score {
  font-size: 1rem;
  opacity: 0.7;
  margin-bottom: 0.8rem;
}

.results-grade {
  font-size: 1.4rem;
  font-weight: 600;
}

========================================= */
