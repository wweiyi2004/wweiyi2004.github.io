(() => {
  'use strict'

  // PJAX can load this script more than once. Release the previous scene first.
  if (window.blogMagicCleanup) window.blogMagicCleanup()
  const root = document.querySelector('#page-header.magic-home')
  if (!root) return

  const events = new AbortController()
  const listen = (target, type, fn, options = {}) => target.addEventListener(type, fn, { ...options, signal: events.signal })
  const canvas = root.querySelector('.magic-embers')
  const backdrop = root.querySelector('.magic-backdrop')
  const context = canvas.getContext('2d')
  const cast = root.querySelector('.magic-cast')
  const castLabel = root.querySelector('.magic-cast-label')
  const status = root.querySelector('.magic-status')
  const motion = root.querySelector('.magic-motion')
  const subtitle = root.querySelector('#subtitle')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const pointer = window.matchMedia('(pointer: fine)')
  let paused = false
  try { paused = localStorage.getItem('blog-magic-paused') === 'true' } catch (_) { /* Storage is optional. */ }

  let visible = root.getBoundingClientRect().bottom > 0
  let width = 0
  let height = 0
  let frame = 0
  let scrollFrame = 0
  let lastFrame = 0
  let typeTimer = 0
  let castTimer = 0
  let phase = 'idle'
  let particles = []
  let sparks = []
  let mouseX = 0
  let mouseY = 0
  let easedX = 0
  let easedY = 0
  let lines = []
  try { lines = JSON.parse(root.dataset.magicSubtitles || '[]').map(line => Array.from(line)) } catch (_) { /* Keep the rendered subtitle. */ }
  let lineIndex = 0
  let letterIndex = lines[0]?.length || 0
  let deleting = true
  const active = () => visible && !document.hidden && !paused && !reduced.matches

  function makeEmber(randomHeight = true) {
    return { x: Math.random() * width, y: randomHeight ? Math.random() * height : height + 12,
      size: .6 + Math.random() * 1.5, speed: 12 + Math.random() * 27,
      drift: (Math.random() - .5) * 16, alpha: .2 + Math.random() * .5, seed: Math.random() * Math.PI * 2 }
  }

  function fit() {
    const rect = root.getBoundingClientRect()
    width = rect.width
    height = rect.height
    // Match the existing halo in the 1920 × 1080 artwork, including cover cropping.
    // The seal is inside the image layer so parallax and scaling stay registered.
    const imageScale = Math.max(backdrop.offsetWidth / 1920, backdrop.offsetHeight / 1080)
    const imageLeft = (backdrop.offsetWidth - 1920 * imageScale) * (width <= 900 ? .55 : .5)
    const imageTop = (backdrop.offsetHeight - 1080 * imageScale) * .5
    backdrop.style.setProperty('--magic-seal-size', `${600 * imageScale}px`)
    backdrop.style.setProperty('--magic-seal-left', `${imageLeft + 966 * imageScale}px`)
    backdrop.style.setProperty('--magic-seal-top', `${imageTop + 498 * imageScale}px`)
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0)
    particles = Array.from({ length: width < 900 ? 22 : 52 }, () => makeEmber())
    sparks = []
    updateScroll()
  }

  function render(now) {
    frame = 0
    if (!active()) return
    frame = requestAnimationFrame(render)
    if (now - lastFrame < 32) return
    const dt = Math.min((now - lastFrame) / 1000 || .032, .065)
    lastFrame = now
    easedX += (mouseX - easedX) * .065
    easedY += (mouseY - easedY) * .065
    root.style.setProperty('--magic-x', `${easedX.toFixed(2)}px`)
    root.style.setProperty('--magic-y', `${easedY.toFixed(2)}px`)
    if (!context) return
    context.clearRect(0, 0, width, height)
    context.globalCompositeOperation = 'lighter'
    for (let i = 0; i < particles.length; i++) {
      const ember = particles[i]
      ember.y -= ember.speed * dt
      ember.x += (ember.drift + Math.sin(now / 1900 + ember.seed) * 8) * dt
      if (ember.y < -15 || ember.x < -20 || ember.x > width + 20) particles[i] = makeEmber(false)
      context.globalAlpha = ember.alpha * (.7 + Math.sin(now / 900 + ember.seed) * .3)
      context.fillStyle = '#f7b976'
      context.beginPath()
      context.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2)
      context.fill()
    }
    sparks = sparks.filter(spark => spark.life > 0)
    for (const spark of sparks) {
      spark.life -= dt
      spark.x += spark.vx * dt
      spark.y += spark.vy * dt
      spark.vx *= .97
      spark.vy *= .97
      context.globalAlpha = Math.max(0, spark.life / 1.4)
      context.strokeStyle = '#ffcb8c'
      context.lineWidth = spark.size
      context.beginPath()
      context.moveTo(spark.x, spark.y)
      context.lineTo(spark.x - spark.vx * .035, spark.y - spark.vy * .035)
      context.stroke()
    }
    context.globalAlpha = 1
  }

  function typeNext() {
    typeTimer = 0
    if (!active() || !subtitle || !lines.length) return
    const line = lines[lineIndex]
    letterIndex += deleting ? -1 : 1
    subtitle.textContent = line.slice(0, Math.max(0, letterIndex)).join('')
    let delay = deleting ? 40 : 110
    if (letterIndex <= 0) {
      deleting = false
      lineIndex = (lineIndex + 1) % lines.length
      delay = 350
    } else if (letterIndex >= line.length) {
      deleting = true
      delay = 2600
    }
    typeTimer = window.setTimeout(typeNext, delay)
  }

  function finishCast() {
    clearTimeout(castTimer)
    castTimer = 0
    phase = 'idle'
    sparks = []
    root.classList.remove('is-charging', 'is-bursting')
    cast.setAttribute('aria-disabled', 'false')
    castLabel.textContent = 'Explosion!'
  }

  function syncMotion() {
    const running = active()
    root.classList.toggle('is-paused', paused)
    root.classList.toggle('is-reduced', reduced.matches)
    root.classList.toggle('is-offscreen', !visible || document.hidden)
    motion.setAttribute('aria-pressed', String(paused || reduced.matches))
    motion.setAttribute('aria-disabled', String(reduced.matches))
    motion.setAttribute('aria-label', reduced.matches ? '已跟随系统减少动态效果' : paused ? '播放首页动效' : '暂停首页动效')
    motion.querySelector('.magic-motion-label').textContent = reduced.matches ? '静态模式' : paused ? '播放动效' : '暂停动效'
    motion.querySelector('.magic-motion-icon').textContent = paused || reduced.matches ? '▷' : 'Ⅱ'
    subtitle?.classList.toggle('magic-typing', running)
    if (running) {
      if (!frame) { lastFrame = performance.now(); frame = requestAnimationFrame(render) }
      if (!typeTimer && lines.length) typeTimer = window.setTimeout(typeNext, 2600)
    } else {
      cancelAnimationFrame(frame)
      frame = 0
      clearTimeout(typeTimer)
      typeTimer = 0
      finishCast()
      context?.clearRect(0, 0, width, height)
      root.style.setProperty('--magic-x', '0px')
      root.style.setProperty('--magic-y', '0px')
      mouseX = mouseY = easedX = easedY = 0
      if (subtitle && lines.length) {
        letterIndex = lines[lineIndex].length
        deleting = true
        subtitle.textContent = lines[lineIndex].join('')
      }
    }
  }

  function updateScroll() {
    scrollFrame = 0
    const rect = root.getBoundingClientRect()
    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height * .8)))
    root.style.setProperty('--magic-fade', reduced.matches || paused ? '1' : String(1 - progress))
  }

  function explode(event) {
    // Avoid also triggering Butterfly's global click-text effect on this button.
    event.stopPropagation()
    if (phase !== 'idle') return
    cast.setAttribute('aria-disabled', 'true')
    if (!active()) {
      phase = 'quiet'
      status.textContent = 'Explosion！愿每一份热爱，都有回响。'
      castLabel.textContent = '已释放 ✧'
      castTimer = window.setTimeout(finishCast, 1400)
      return
    }
    const sealRect = root.querySelector('.magic-seal-position').getBoundingClientRect()
    const heroRect = root.getBoundingClientRect()
    const centerX = sealRect.left + sealRect.width / 2 - heroRect.left
    const centerY = sealRect.top + sealRect.height / 2 - heroRect.top
    root.style.setProperty('--magic-origin-x', `${centerX}px`)
    root.style.setProperty('--magic-origin-y', `${centerY}px`)
    root.style.setProperty('--magic-burst-size', `${sealRect.width}px`)
    phase = 'charging'
    root.classList.add('is-charging')
    castLabel.textContent = '咏唱中…'
    status.textContent = '比黑更黑、比暗更暗的深红，汇聚于此。'
    castTimer = window.setTimeout(() => {
      if (!active()) { finishCast(); return }
      phase = 'bursting'
      root.classList.replace('is-charging', 'is-bursting')
      castLabel.textContent = 'Explosion!'
      status.textContent = 'Explosion！愿每一份热爱，都有回响。'
      const small = width < 900
      sparks = Array.from({ length: small ? 38 : 90 }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = 150 + Math.random() * 400
        return { x: centerX, y: centerY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: .8 + Math.random() * 1.4, life: 1.4 }
      })
      castTimer = window.setTimeout(finishCast, 1600)
    }, 850)
  }

  listen(cast, 'click', explode)
  listen(motion, 'click', event => {
    event.stopPropagation()
    if (reduced.matches) return
    paused = !paused
    try { localStorage.setItem('blog-magic-paused', String(paused)) } catch (_) { /* Continue without saving. */ }
    syncMotion()
    updateScroll()
  })
  listen(root, 'pointermove', event => {
    if (!active() || !pointer.matches || width < 900) return
    const rect = root.getBoundingClientRect()
    mouseX = ((event.clientX - rect.left) / width - .5) * 18
    mouseY = ((event.clientY - rect.top) / height - .5) * 12
  }, { passive: true })
  listen(root, 'pointerleave', () => { mouseX = mouseY = 0 })
  listen(window, 'scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll) }, { passive: true })
  listen(window, 'resize', fit, { passive: true })
  listen(document, 'visibilitychange', syncMotion)
  listen(reduced, 'change', () => { syncMotion(); updateScroll() })
  for (const link of root.querySelectorAll('a[href="#content-inner"]')) {
    listen(link, 'click', event => {
      const content = document.getElementById('content-inner')
      if (!content) return
      event.preventDefault()
      event.stopPropagation()
      content.scrollIntoView({ behavior: reduced.matches || paused ? 'instant' : 'smooth', block: 'start' })
      content.setAttribute('tabindex', '-1')
      content.focus({ preventScroll: true })
    })
  }

  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio > 0
    syncMotion()
  }, { threshold: [0, .01] })
  observer.observe(root)
  fit()
  cast.hidden = false
  motion.hidden = false
  syncMotion()

  const cleanup = () => {
    events.abort()
    observer.disconnect()
    cancelAnimationFrame(frame)
    cancelAnimationFrame(scrollFrame)
    clearTimeout(typeTimer)
    finishCast()
    window.blogMagicCleanup = null
  }
  window.blogMagicCleanup = cleanup
  listen(document, 'pjax:send', cleanup, { once: true })
})()
