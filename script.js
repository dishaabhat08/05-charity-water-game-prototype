const game = document.getElementById('game')
const player = document.getElementById('player')
const overlay = document.getElementById('overlay')
const scoreDisplay = document.getElementById('score')
const timeDisplay = document.getElementById('time')
const waterDisplay = document.getElementById('water')
const meterFill = document.getElementById('meterFill')
const feedback = document.getElementById('feedback')
const startBtn = document.getElementById('startBtn')
const pauseBtn = document.getElementById('pauseBtn')
const resetBtn = document.getElementById('resetBtn')
const jumpBtn = document.getElementById('jumpBtn')
const duckBtn = document.getElementById('duckBtn')

let score = 0
let water = 0
let timeLeft = 60
let running = false
let paused = false
let jumping = false
let ducking = false
let jumpTime = 0
let spawnTime = 0
let lastFrame = 0
let clockTime = 0
let items = []
let frameId = null

function updateStats() {
  scoreDisplay.textContent = score
  timeDisplay.textContent = timeLeft
  waterDisplay.textContent = water
  meterFill.style.width = `${water * 10}%`
}

function clearItems() {
  items.forEach((item) => item.element.remove())
  items = []
}

function resetGame() {
  running = false
  paused = false
  cancelAnimationFrame(frameId)
  clearItems()
  score = 0
  water = 0
  timeLeft = 60
  jumping = false
  ducking = false
  jumpTime = 0
  spawnTime = 0
  clockTime = 0
  player.style.bottom = '52px'
  player.classList.remove('duck')
  document.getElementById('confetti').replaceChildren()
  overlay.classList.remove('hidden')
  document.getElementById('overlayTitle').textContent = 'Ready to run?'
  document.getElementById('overlayText').textContent =
    'Collect 10 clean drops before the 60-second timer ends!'
  startBtn.disabled = false
  startBtn.textContent = 'Start Game'
  pauseBtn.disabled = true
  pauseBtn.textContent = 'Pause'
  feedback.textContent = 'Press Start Game to begin.'
  updateStats()
}

function startGame() {
  if (running) return
  resetGame()
  running = true
  overlay.classList.add('hidden')
  startBtn.disabled = true
  pauseBtn.disabled = false
  feedback.textContent = 'Collect blue water drops!'
  lastFrame = performance.now()
  frameId = requestAnimationFrame(loop)
  game.focus()
}

function jump() {
  if (!running || paused || jumping) return
  jumping = true
  ducking = false
  player.classList.remove('duck')
  jumpTime = 0
}

function setDuck(value) {
  if (!running || paused || jumping) return
  ducking = value
  player.classList.toggle('duck', value)
}

function spawnItem() {
  const roll = Math.random()
  const type =
    roll < 0.57 ? 'clean' : roll < 0.77 ? 'dirty' : roll < 0.9 ? 'rock' : 'bird'
  const element = document.createElement('div')
  element.className = `item ${type === 'bird' ? 'high' : ''}`
  element.textContent = { clean: '💧', dirty: '🟤', rock: '🪨', bird: '🐦' }[
    type
  ]
  element.setAttribute('aria-label', type)
  game.appendChild(element)
  items.push({ element, type, x: game.clientWidth + 30, hit: false })
}

function finish(won) {
  running = false
  paused = false
  cancelAnimationFrame(frameId)
  overlay.classList.remove('hidden')
  document.getElementById('overlayTitle').textContent = won
    ? 'You did it! 🎉'
    : 'Game Over'
  document.getElementById('overlayText').textContent =
    `Final score: ${score}. Clean drops collected: ${water}/10. ${won ? 'You reached the clean water goal!' : 'Try again and collect more clean water!'}`
  feedback.textContent = won
    ? 'Amazing work collecting clean water!'
    : 'You can try again!'
  startBtn.disabled = false
  startBtn.textContent = 'Play Again'
  pauseBtn.disabled = true
  if (won) celebrate()
}

function celebrate() {
  const confetti = document.getElementById('confetti')
  for (let i = 0; i < 55; i++) {
    const piece = document.createElement('span')
    piece.className = 'piece'
    piece.style.left = `${Math.random() * 100}%`
    piece.style.background = ['#ffc907', '#20a6df', '#17212a', '#ffffff'][i % 4]
    piece.style.animationDelay = `${Math.random() * 0.8}s`
    confetti.appendChild(piece)
  }
}

function loop(now) {
  if (!running || paused) return
  const delta = Math.min((now - lastFrame) / 1000, 0.05)
  lastFrame = now
  clockTime += delta
  if (clockTime >= 1) {
    timeLeft = Math.max(0, timeLeft - 1)
    clockTime -= 1
    updateStats()
    if (timeLeft === 0) {
      finish(false)
      return
    }
  }
  if (jumping) {
    jumpTime += delta
    const duration = 0.8
    const height = Math.sin(Math.PI * Math.min(jumpTime / duration, 1)) * 105
    player.style.bottom = `${52 + height}px`
    if (jumpTime >= duration) {
      jumping = false
      player.style.bottom = '52px'
    }
  }
  spawnTime += delta
  if (spawnTime > Math.max(0.75, 1.45 - (60 - timeLeft) * 0.009)) {
    spawnItem()
    spawnTime = 0
  }
  const speed = 190 + (60 - timeLeft) * 2
  const playerX = player.offsetLeft
  const playerBottom = parseFloat(player.style.bottom) || 52
  const playerHeight = ducking ? 37 : 58
  for (const item of items) {
    item.x -= speed * delta
    item.element.style.left = `${item.x}px`
    const itemBottom = item.type === 'bird' ? 135 : 52
    const touchingX = item.x < playerX + 42 && item.x + 32 > playerX + 10
    const touchingY =
      playerBottom < itemBottom + 38 &&
      playerBottom + playerHeight > itemBottom + 5
    if (!item.hit && touchingX && touchingY) {
      item.hit = true
      if (item.type === 'clean') {
        water++
        score += 10
        feedback.textContent = '+10! Clean water collected! 💧'
      } else {
        score = Math.max(0, score - 10)
        feedback.textContent = '-10! Watch out for hazards!'
      }
      item.element.remove()
      updateStats()
      if (water >= 10) {
        finish(true)
        return
      }
    }
  }
  items = items.filter((item) => {
    if (item.hit || item.x < -50) {
      item.element.remove()
      return false
    }
    return true
  })
  frameId = requestAnimationFrame(loop)
}

startBtn.addEventListener('click', startGame)
resetBtn.addEventListener('click', resetGame)
pauseBtn.addEventListener('click', () => {
  if (!running) return
  paused = !paused
  pauseBtn.textContent = paused ? 'Resume' : 'Pause'
  overlay.classList.toggle('hidden', !paused)
  if (paused) {
    document.getElementById('overlayTitle').textContent = 'Paused'
    document.getElementById('overlayText').textContent =
      'Press Resume to continue.'
  } else {
    lastFrame = performance.now()
    frameId = requestAnimationFrame(loop)
    game.focus()
  }
})
jumpBtn.addEventListener('click', jump)
duckBtn.addEventListener('pointerdown', () => setDuck(true))
for (const eventName of ['pointerup', 'pointerleave', 'pointercancel']) {
  duckBtn.addEventListener(eventName, () => setDuck(false))
}
document.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code))
    event.preventDefault()
  if (event.code === 'Space' || event.code === 'ArrowUp') jump()
  if (event.code === 'ArrowDown') setDuck(true)
})
document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowDown') setDuck(false)
})
resetGame()
