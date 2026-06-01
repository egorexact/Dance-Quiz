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
  "D-mac", "Do The 40's", "Do The James", "Doll", "Drop Dance",
  "Elbows Up", "Gougie", "Gucci", "Guess", "Famous Dancer",
  "Fatler MC", "Fila", "Flava Flave", "Flinstone", "Fred Samford",
  "Funky Chicken", "Hammer Shake", "Happy Feet", "Heel Toe", "HI",
  "Hit the Folks", "Horse Move", "Humpty Dance", "Indian Step", "Jack & Wave",
  "Jack In The Box", "Janet Jackson", "Jerk", "Karate Kid", "Kick And Slide",
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
const STORAGE_KEY = 'danceQuiz_seenMoves'

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
   QUEUE MANAGER
   Хранит в localStorage какие движения
   уже были показаны ученику.
   Всегда берёт сначала непоказанные.
   Когда все пройдены — сбрасывает очередь.
========================================= */

const Queue = {

  // Загружаем список уже показанных движений
  getSeenMoves() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  // Сохраняем обновлённый список
  saveSeenMoves(seen) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
    } catch {
      // localStorage недоступен — продолжаем без сохранения
    }
  },

  // Сбрасываем очередь (все движения пройдены)
  reset() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  },

  // Выбираем следующие N движений из непоказанных
  // Возвращает: { moves, seenAfter, cycleCompleted }
  pick(count) {

    const seen = this.getSeenMoves()

    // Фильтруем только те движения которых ещё не видел
    const unseen = MOVES.filter(m => !seen.includes(m))

    let picked = []
    let cycleCompleted = false

    if (unseen.length >= count) {

      // Достаточно непоказанных — просто берём из них
      picked = shuffleArray(unseen).slice(0, count)

    } else {

      // Непоказанных меньше чем нужно вопросов —
      // берём все оставшиеся + добираем из начала нового цикла
      const remaining = shuffleArray(unseen)
      const need = count - remaining.length
      const fresh = shuffleArray(MOVES).slice(0, need)

      picked = shuffleArray([...remaining, ...fresh])
      cycleCompleted = true

    }

    // Обновляем список показанных
    let newSeen = cycleCompleted
      ? [...picked] // новый цикл — сбрасываем, помним только текущий тест
      : [...seen, ...picked]

    // Если все пройдены — сбрасываем чтобы начать круг заново
    if (newSeen.length >= MOVES.length) {
      newSeen = [...picked]
      cycleCompleted = true
    }

    this.saveSeenMoves(newSeen)

    return { moves: picked, cycleCompleted }
  },

  // Сколько движений уже видел ученик
  getProgress() {
    const seen = this.getSeenMoves()
    // Считаем только те что реально есть в MOVES
    return seen.filter(m => MOVES.includes(m)).length
  }

}

/* =========================================
   ALPHABETICALLY DISTRIBUTED SHUFFLE
   Разбивает по первым буквам и берёт
   по одному из каждой группы — вопросы
   всегда из разных частей алфавита.
========================================= */

function alphabetDistributedShuffle(moves) {

  const groups = {}
  for (const move of moves) {
    const letter = move[0].toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(move)
  }

  for (const letter in groups) {
    groups[letter] = shuffleArray(groups[letter])
  }

  const letters = shuffleArray(Object.keys(groups))

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
   4 варианта всегда с разных первых букв.
========================================= */

function generateOptions(correctAnswer) {

  const correctLetter = correctAnswer[0].toUpperCase()

  const byLetter = {}
  for (const move of MOVES) {
    if (move === correctAnswer) continue
    const letter = move[0].toUpperCase()
    if (!byLetter[letter]) byLetter[letter] = []
    byLetter[letter].push(move)
  }

  delete byLetter[correctLetter]

  const availableLetters = shuffleArray(Object.keys(byLetter))
  const wrongAnswers = []

  for (const letter of availableLetters) {
    if (wrongAnswers.length >= 3) break
    wrongAnswers.push(shuffleArray(byLetter[letter])[0])
  }

  // Fallback если уникальных букв не хватает
  if (wrongAnswers.length < 3) {
    const usedNames = new Set([correctAnswer, ...wrongAnswers])
    const extras = shuffleArray(MOVES.filter(m => !usedNames.has(m)))
    while (wrongAnswers.length < 3 && extras.length > 0) {
      wrongAnswers.push(extras.shift())
    }
  }

  return shuffleArray([correctAnswer, ...wrongAnswers])
}

/* =========================================
   BUILD QUESTIONS
   Берёт движения через Queue (очередь
   без повторов), затем распределяет
   по алфавиту внутри теста.
========================================= */

function buildQuestions() {

  const { moves, cycleCompleted } = Queue.pick(QUESTIONS_COUNT)

  // Распределяем по алфавиту внутри выбранных
  const distributed = alphabetDistributedShuffle(moves)

  return {
    questions: distributed.map(move => ({
      video: `videos/${move}.mp4`,
      answer: move,
      options: generateOptions(move)
    })),
    cycleCompleted
  }
}

/* =========================================
   STATE
========================================= */

let QUESTIONS      = []
let current        = 0
let score          = 0
let playerName     = ''
let cycleCompleted = false

/* =========================================
   WELCOME SCREEN
========================================= */

function showWelcomeScreen() {

  const seen     = Queue.getProgress()
  const total    = MOVES.length
  const isNew    = seen === 0
  const allDone  = seen >= total

  // Подсказка о прогрессе под приветствием
  let progressHint = ''
  if (!isNew && !allDone) {
    progressHint = `
      <p class="progress-hint">
        Изучено движений: <strong>${seen} из ${total}</strong>
      </p>`
  } else if (allDone) {
    progressHint = `
      <p class="progress-hint">
        🎉 Ты прошёл все ${total} движений! Начинаем новый круг.
      </p>`
  }

  document.querySelector('.quiz-card').innerHTML = `
    <div class="welcome-screen">

      <p class="welcome-msg">
        Салют! Давай проверим насколько<br>хорошо ты знаешь базовые движения)
      </p>

      ${progressHint}

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

  const startBtn  = document.getElementById('startBtn')
  const nameInput = document.getElementById('nameInput')

  startBtn.addEventListener('click', () => {
    playerName = nameInput.value.trim() || 'Аноним'
    startQuiz()
  })

  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') startBtn.click()
  })
}

/* =========================================
   START QUIZ
========================================= */

function startQuiz() {

  const result   = buildQuestions()
  QUESTIONS      = result.questions
  cycleCompleted = result.cycleCompleted
  current        = 0
  score          = 0

  document.querySelector('.quiz-card').innerHTML = `

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

  bindElements()
  loadQuestion()
}

/* =========================================
   BIND ELEMENTS
========================================= */

function bindElements() {

  Object.assign(window, {
    quizVideo:         document.getElementById('quizVideo'),
    answersEl:         document.getElementById('answers'),
    feedbackEl:        document.getElementById('feedback'),
    nextBtn:           document.getElementById('nextBtn'),
    progressFill:      document.getElementById('progressFill'),
    scoreEl:           document.getElementById('score'),
    currentQuestionEl: document.getElementById('currentQuestion'),
    totalQuestionsEl:  document.getElementById('totalQuestions'),
    replayBtn:         document.getElementById('replayBtn'),
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

  window.quizVideo.src = q.video
  window.quizVideo.play()

  window.answersEl.innerHTML    = ''
  window.feedbackEl.textContent = ''
  window.nextBtn.style.display  = 'none'

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

  const percent  = Math.round((score / QUESTIONS.length) * 100)
  const seen     = Queue.getProgress()
  const total    = MOVES.length

  let grade, emoji
  if (percent >= 80)      { grade = 'Отлично!';              emoji = '🔥' }
  else if (percent >= 60) { grade = 'Хорошо!';               emoji = '👍' }
  else if (percent >= 40) { grade = 'Надо подучить';         emoji = '📚' }
  else                    { grade = 'Не показывай это Наташе)'; emoji = '🙈' }

  // Сообщение о прогрессе по всему курсу
  const cycleMsg = cycleCompleted
    ? `<p class="results-cycle">🎉 Ты прошёл все движения! Начинаем новый круг.</p>`
    : `<p class="results-cycle">Изучено движений: <strong>${seen} из ${total}</strong></p>`

  document.querySelector('.quiz-card').innerHTML = `
    <div class="results-screen">

      <p class="results-name">${playerName}</p>

      <h2 class="results-percent">${percent}%</h2>

      <p class="results-score">
        ${score} из ${QUESTIONS.length} правильных ответов
      </p>

      <p class="results-grade">${emoji} ${grade}</p>

      ${cycleMsg}

      <button
        onclick="location.reload()"
        class="next-btn"
        style="display:block; margin-top: 1.5rem;"
      >
        ПРОЙТИ ДАЛЬШЕ
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
  preloadVideo.src     = next.video
  preloadVideo.preload = 'auto'
}

/* =========================================
   INIT
========================================= */

showWelcomeScreen()
