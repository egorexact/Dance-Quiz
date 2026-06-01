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
]

/* =========================================
   SETTINGS
========================================= */

const QUESTIONS_COUNT = 20
const STORAGE_KEY     = 'danceQuiz_seenMoves'
const PRELOAD_AHEAD   = 2   // сколько видео грузить вперёд

/* =========================================
   SHUFFLE
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
   VIDEO PATH
   encodeURIComponent решает проблему
   со спецсимволами: & ' пробелы и т.д.
   Файлы переименовывать не нужно.
========================================= */

function videoPath(moveName) {
  return `videos/${encodeURIComponent(moveName)}.mp4`
}

/* =========================================
   AUDIO — звуковые эффекты без файлов
   Генерируем тон через Web Audio API
========================================= */

const AudioFX = (() => {

  let ctx = null

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
  }

  function play(freq, type, duration, gainVal) {
    try {
      const ac  = getCtx()
      const osc = ac.createOscillator()
      const gn  = ac.createGain()

      osc.connect(gn)
      gn.connect(ac.destination)

      osc.type      = type
      osc.frequency.setValueAtTime(freq, ac.currentTime)

      gn.gain.setValueAtTime(gainVal, ac.currentTime)
      gn.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)

      osc.start(ac.currentTime)
      osc.stop(ac.currentTime + duration)
    } catch {}
  }

  return {
    correct() {
      // Два восходящих тона — приятный "динь"
      play(520, 'sine', 0.12, 0.3)
      setTimeout(() => play(780, 'sine', 0.18, 0.25), 80)
    },
    wrong() {
      // Низкий нисходящий тон — "бух"
      play(220, 'sawtooth', 0.18, 0.25)
      setTimeout(() => play(150, 'sawtooth', 0.15, 0.2), 80)
    },
    tick() {
      // Лёгкий клик при переходе
      play(800, 'square', 0.04, 0.08)
    }
  }
})()

/* =========================================
   CONFETTI — чистый canvas без библиотек
========================================= */

const Confetti = (() => {

  let canvas, animId
  const pieces  = []
  const COLORS  = ['#ff2442', '#fff', '#ff6680', '#ffcc00', '#39d98a', '#a40018']
  const COUNT   = 120

  function init() {
    canvas = document.createElement('canvas')
    Object.assign(canvas.style, {
      position:      'fixed',
      inset:         '0',
      width:         '100%',
      height:        '100%',
      pointerEvents: 'none',
      zIndex:        '9999',
    })
    document.body.appendChild(canvas)
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
  }

  function spawn() {
    pieces.length = 0
    for (let i = 0; i < COUNT; i++) {
      pieces.push({
        x:     Math.random() * canvas.width,
        y:     -10 - Math.random() * 200,
        w:     6 + Math.random() * 8,
        h:     10 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot:   Math.random() * 360,
        vx:    (Math.random() - 0.5) * 3,
        vy:    2 + Math.random() * 4,
        vrot:  (Math.random() - 0.5) * 8,
      })
    }
  }

  function draw() {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let alive = false
    for (const p of pieces) {
      p.x   += p.vx
      p.y   += p.vy
      p.rot += p.vrot
      p.vy  *= 1.01 // ускорение вниз

      if (p.y < canvas.height + 20) alive = true

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot * Math.PI / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }

    if (alive) {
      animId = requestAnimationFrame(draw)
    } else {
      stop()
    }
  }

  function stop() {
    cancelAnimationFrame(animId)
    if (canvas) canvas.remove()
    canvas = null
  }

  return {
    launch() {
      if (canvas) stop()
      init()
      spawn()
      draw()
      // Автостоп через 4 секунды
      setTimeout(stop, 4000)
    }
  }
})()

/* =========================================
   QUEUE MANAGER — очередь без повторов
========================================= */

const Queue = {

  getSeenMoves() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  },

  saveSeenMoves(seen) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seen)) } catch {}
  },

  reset() {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  },

  pick(count) {
    const seen   = this.getSeenMoves()
    const unseen = MOVES.filter(m => !seen.includes(m))

    let picked         = []
    let cycleCompleted = false

    if (unseen.length >= count) {
      picked = shuffleArray(unseen).slice(0, count)
    } else {
      const remaining = shuffleArray(unseen)
      const need      = count - remaining.length
      const fresh     = shuffleArray(MOVES).slice(0, need)
      picked          = shuffleArray([...remaining, ...fresh])
      cycleCompleted  = true
    }

    let newSeen = cycleCompleted ? [...picked] : [...seen, ...picked]
    if (newSeen.length >= MOVES.length) {
      newSeen        = [...picked]
      cycleCompleted = true
    }

    this.saveSeenMoves(newSeen)
    return { moves: picked, cycleCompleted }
  },

  getProgress() {
    const seen = this.getSeenMoves()
    return seen.filter(m => MOVES.includes(m)).length
  }
}

/* =========================================
   ALPHABET DISTRIBUTED SHUFFLE
========================================= */

function alphabetDistributedShuffle(moves) {
  const groups = {}
  for (const move of moves) {
    const letter = move[0].toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(move)
  }
  for (const letter in groups) groups[letter] = shuffleArray(groups[letter])

  const letters = shuffleArray(Object.keys(groups))
  const result  = []
  let round = 0, hasMore = true

  while (hasMore) {
    hasMore = false
    for (const letter of letters) {
      if (groups[letter][round]) { result.push(groups[letter][round]); hasMore = true }
    }
    round++
  }
  return result
}

/* =========================================
   GENERATE OPTIONS — всегда разные буквы
========================================= */

function generateOptions(correctAnswer) {
  const correctLetter = correctAnswer[0].toUpperCase()
  const byLetter      = {}

  for (const move of MOVES) {
    if (move === correctAnswer) continue
    const letter = move[0].toUpperCase()
    if (!byLetter[letter]) byLetter[letter] = []
    byLetter[letter].push(move)
  }

  delete byLetter[correctLetter]

  const wrongAnswers = []
  for (const letter of shuffleArray(Object.keys(byLetter))) {
    if (wrongAnswers.length >= 3) break
    wrongAnswers.push(shuffleArray(byLetter[letter])[0])
  }

  if (wrongAnswers.length < 3) {
    const used   = new Set([correctAnswer, ...wrongAnswers])
    const extras = shuffleArray(MOVES.filter(m => !used.has(m)))
    while (wrongAnswers.length < 3 && extras.length) wrongAnswers.push(extras.shift())
  }

  return shuffleArray([correctAnswer, ...wrongAnswers])
}

/* =========================================
   BUILD QUESTIONS
========================================= */

function buildQuestions() {
  const { moves, cycleCompleted } = Queue.pick(QUESTIONS_COUNT)
  const distributed               = alphabetDistributedShuffle(moves)

  return {
    questions: distributed.map(move => ({
      video:   videoPath(move),   // ← encodeURIComponent здесь
      answer:  move,
      options: generateOptions(move)
    })),
    cycleCompleted
  }
}

/* =========================================
   PRELOADER — грузим PRELOAD_AHEAD видео вперёд
   Используем кэш объектов чтобы не создавать
   дубли и не грузить одно и то же дважды.
========================================= */

const VideoPreloader = (() => {
  const cache = {}

  return {
    preload(questions, fromIndex) {
      const end = Math.min(fromIndex + PRELOAD_AHEAD, questions.length)
      for (let i = fromIndex; i < end; i++) {
        const src = questions[i].video
        if (cache[src]) continue           // уже в кэше
        const v    = document.createElement('video')
        v.preload  = 'auto'
        v.src      = src
        cache[src] = v                     // держим ссылку — браузер не выбросит
      }
    },
    clear() {
      for (const key in cache) delete cache[key]
    }
  }
})()

/* =========================================
   SPINNER — показываем пока видео буферизуется
========================================= */

function attachSpinner(videoEl, wrapper) {
  // Создаём спиннер инлайн (без изменения CSS файла)
  const spinner = document.createElement('div')
  spinner.id    = 'videoSpinner'
  Object.assign(spinner.style, {
    position:        'absolute',
    inset:           '0',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      'rgba(0,0,0,0.45)',
    borderRadius:    '16px',
    zIndex:          '3',
    pointerEvents:   'none',
  })
  spinner.innerHTML = `
    <div style="
      width:36px; height:36px;
      border:3px solid rgba(255,255,255,0.15);
      border-top-color:#ff2442;
      border-radius:50%;
      animation:spinAnim 0.7s linear infinite;
    "></div>
  `

  // Инжектим keyframes один раз
  if (!document.getElementById('spinKeyframes')) {
    const style       = document.createElement('style')
    style.id          = 'spinKeyframes'
    style.textContent = '@keyframes spinAnim{to{transform:rotate(360deg)}}'
    document.head.appendChild(style)
  }

  wrapper.appendChild(spinner)

  const hide = () => { spinner.style.display = 'none' }
  const show = () => { spinner.style.display = 'flex' }

  videoEl.addEventListener('waiting',  show)
  videoEl.addEventListener('canplay',  hide)
  videoEl.addEventListener('playing',  hide)
  videoEl.addEventListener('loadeddata', hide)

  // Если видео уже готово
  if (videoEl.readyState >= 3) hide()
}

/* =========================================
   SHAKE ANIMATION — при ошибке
========================================= */

function shakeElement(el) {
  // Инжектим keyframes один раз
  if (!document.getElementById('shakeKeyframes')) {
    const style       = document.createElement('style')
    style.id          = 'shakeKeyframes'
    style.textContent = `
      @keyframes shakeAnim {
        0%,100%{ transform:translateX(0) }
        20%    { transform:translateX(-6px) }
        40%    { transform:translateX(6px) }
        60%    { transform:translateX(-4px) }
        80%    { transform:translateX(4px) }
      }
    `
    document.head.appendChild(style)
  }
  el.style.animation = 'none'
  // Форсируем reflow
  void el.offsetWidth
  el.style.animation = 'shakeAnim 0.35s ease'
  el.addEventListener('animationend', () => { el.style.animation = '' }, { once: true })
}

/* =========================================
   STATE
========================================= */

let QUESTIONS      = []
let current        = 0
let score          = 0
let streak         = 0
let playerName     = ''
let cycleCompleted = false

/* =========================================
   WELCOME SCREEN
========================================= */

function showWelcomeScreen() {
  const seen    = Queue.getProgress()
  const total   = MOVES.length
  const allDone = seen >= total

  let progressHint = ''
  if (seen > 0 && !allDone) {
    progressHint = `<p style="font-size:.88rem;color:#9d9d9d;margin-bottom:1.5rem;">
      Изучено движений: <strong style="color:#f4f4f4">${seen} из ${total}</strong>
    </p>`
  } else if (allDone) {
    progressHint = `<p style="font-size:.88rem;color:#9d9d9d;margin-bottom:1.5rem;">
      🎉 Ты прошёл все ${total} движений! Начинаем новый круг.
    </p>`
  }

  document.querySelector('.quiz-card').innerHTML = `
    <div class="welcome-screen">
      <p class="welcome-msg">Салют! Давай проверим насколько<br>хорошо ты знаешь базовые движения)</p>
      ${progressHint}
      <div class="name-field">
        <label for="nameInput">Как тебя зовут?</label>
        <input id="nameInput" type="text" placeholder="Введи имя..." maxlength="30" autocomplete="off"/>
      </div>
      <button id="startBtn" class="next-btn" style="display:block;">НАЧАТЬ ТЕСТ</button>
    </div>
  `

  const startBtn  = document.getElementById('startBtn')
  const nameInput = document.getElementById('nameInput')

  startBtn.addEventListener('click', () => {
    playerName = nameInput.value.trim() || 'Аноним'
    AudioFX.tick()
    startQuiz()
  })
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startBtn.click() })
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
  streak         = 0

  VideoPreloader.clear()

  document.querySelector('.quiz-card').innerHTML = `
    <div class="top-bar">
      <div class="progress-info">
        <span id="currentQuestion">1</span> / <span id="totalQuestions">${QUESTIONS.length}</span>
      </div>
      <div style="display:flex;align-items:center;gap:14px;">
        <div id="streakBox" style="font-size:1rem;min-width:48px;text-align:right;"></div>
        <div class="score-box">SCORE: <span id="score">0</span></div>
      </div>
    </div>

    <div class="progress-track">
      <div class="progress-fill" id="progressFill"></div>
    </div>

    <div class="video-wrapper" id="videoWrapper">
      <video id="quizVideo" class="quiz-video" playsinline></video>
      <button id="replayBtn" class="replay-btn">↺</button>
    </div>

    <div class="question-label">КАКОЕ ЭТО ДВИЖЕНИЕ?</div>

    <div id="feedback" class="feedback"></div>

    <div id="answers" class="answers"></div>

    <button id="nextBtn" class="next-btn" style="display:none;">ДАЛЕЕ →</button>
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
    streakBox:         document.getElementById('streakBox'),
    videoWrapper:      document.getElementById('videoWrapper'),
  })

  window.nextBtn.addEventListener('click', () => {
    AudioFX.tick()
    current++
    current >= QUESTIONS.length ? showResults() : loadQuestion()
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
  window.progressFill.style.width = `${((current + 1) / QUESTIONS.length) * 100}%`

  // Спиннер на время буферизации
  const existingSpinner = document.getElementById('videoSpinner')
  if (existingSpinner) existingSpinner.remove()
  attachSpinner(window.quizVideo, window.videoWrapper)

  window.quizVideo.src = q.video
  window.quizVideo.play().catch(() => {})

  window.answersEl.innerHTML    = ''
  window.feedbackEl.textContent = ''
  window.nextBtn.style.display  = 'none'

  q.options.forEach(option => {
    const btn       = document.createElement('button')
    btn.className   = 'answer-btn'
    btn.textContent = option
    btn.onclick     = () => selectAnswer(btn, option)
    window.answersEl.appendChild(btn)
  })

  // Грузим следующие PRELOAD_AHEAD видео
  VideoPreloader.preload(QUESTIONS, current + 1)

  updateStreakDisplay()
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
    score++
    streak++
    AudioFX.correct()
    window.feedbackEl.textContent = 'ПРАВИЛЬНО ✓'
    window.feedbackEl.style.color = '#39d98a'

  } else {

    btn.classList.add('wrong')
    streak = 0
    AudioFX.wrong()
    shakeElement(window.answersEl)
    window.feedbackEl.textContent = `ПРАВИЛЬНЫЙ ОТВЕТ: ${q.answer}`
    window.feedbackEl.style.color = '#ff6677'
    buttons.forEach(b => { if (b.textContent === q.answer) b.classList.add('correct') })

  }

  window.scoreEl.textContent   = score
  window.nextBtn.style.display = 'block'
  updateStreakDisplay()
}

/* =========================================
   STREAK DISPLAY
========================================= */

function updateStreakDisplay() {
  const el = window.streakBox
  if (!el) return

  if (streak >= 3) {
    el.textContent = `🔥 ${streak}`
    el.style.color = '#ff6630'
  } else if (streak === 2) {
    el.textContent = `⚡ ${streak}`
    el.style.color = '#ffcc00'
  } else {
    el.textContent = ''
  }
}

/* =========================================
   SHOW RESULTS
========================================= */

function showResults() {
  const percent = Math.round((score / QUESTIONS.length) * 100)
  const seen    = Queue.getProgress()
  const total   = MOVES.length

  let grade, emoji
  if (percent >= 80)      { grade = 'Отлично!';                 emoji = '🔥' }
  else if (percent >= 60) { grade = 'Хорошо!';                  emoji = '👍' }
  else if (percent >= 40) { grade = 'Надо подучить';            emoji = '📚' }
  else                    { grade = 'Не показывай это Наташе)'; emoji = '🙈' }

  const cycleMsg = cycleCompleted
    ? `<p style="font-size:.88rem;color:#9d9d9d;margin-top:.8rem;">🎉 Ты прошёл все движения! Начинаем новый круг.</p>`
    : `<p style="font-size:.88rem;color:#9d9d9d;margin-top:.8rem;">Изучено движений: <strong style="color:#f4f4f4">${seen} из ${total}</strong></p>`

  document.querySelector('.quiz-card').innerHTML = `
    <div class="results-screen">
      <p class="results-name">${playerName}</p>
      <h2 class="results-percent">${percent}%</h2>
      <p class="results-score">${score} из ${QUESTIONS.length} правильных ответов</p>
      <p class="results-grade">${emoji} ${grade}</p>
      ${cycleMsg}
      <button onclick="location.reload()" class="next-btn" style="display:block;margin-top:1.5rem;">
        ПРОЙТИ СНОВА
      </button>
    </div>
  `

  // Конфетти если результат хороший
  if (percent >= 60) Confetti.launch()
}

/* =========================================
   INIT
========================================= */

showWelcomeScreen()
