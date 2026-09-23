(function () {
  var root = document.documentElement, body = document.body
  var SUN = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"></circle><path d=\"M12 2v2\"></path><path d=\"M12 20v2\"></path><path d=\"m4.93 4.93 1.41 1.41\"></path><path d=\"m17.66 17.66 1.41 1.41\"></path><path d=\"M2 12h2\"></path><path d=\"M20 12h2\"></path><path d=\"m6.34 17.66-1.41 1.41\"></path><path d=\"m19.07 4.93-1.41 1.41\"></path></svg>", MOON = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"></path></svg>"
  var set = function (k, v) { try { localStorage.setItem(k, v) } catch (e) {} }

  // theme: follows the system until the reader picks one
  var isDark = function () { var t = root.dataset.theme; return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches }
  var themeBtn = document.querySelector('[data-action=theme]')
  var paint = function () { if (!themeBtn) return; themeBtn.innerHTML = isDark() ? SUN : MOON; themeBtn.title = isDark() ? 'Light theme' : 'Dark theme' }
  paint()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint)
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-action=theme]')) { var next = isDark() ? 'light' : 'dark'; root.dataset.theme = next; set('sj-theme', next); paint() }
  })

  var side = document.querySelector('.side')
  if (!side) return   // landing page: theme only

  var work = document.querySelector('.work'), pane = document.querySelector('.pane')
  var list = side.querySelector('.side-list'), input = side.querySelector('.side-search')
  var empty = list.querySelector('.empty')
  var rows = [].slice.call(list.querySelectorAll('li[data-path]'))
  var narrow = window.matchMedia('(max-width: 800px)')
  var baseUrl = new URL(body.dataset.base || './', location.href).href

  // links in the chrome become absolute, so they stay right when the address changes without a reload
  document.querySelectorAll('.side a[href], .top a[href]').forEach(function (a) { a.setAttribute('href', a.href) })

  // ---- search: titles at once, note text once the index has loaded ----
  var q = '', index = null
  var loadIndex = function () {
    if (index) return
    index = {}
    fetch(baseUrl + 'search.json').then(function (r) { return r.json() }).then(function (a) {
      a.forEach(function (e) { index[baseUrl + e.p + '/'] = e.x }); apply()
    }).catch(function () {})
  }
  var apply = function () {
    var shown = 0
    rows.forEach(function (li) {
      var ok = true
      if (q) {
        var t = li.textContent.toLowerCase(), x = index && index[li.querySelector('a').href]
        ok = t.indexOf(q) >= 0 || (!!x && x.indexOf(q) >= 0)
      }
      li.hidden = !ok; if (ok) shown++
    })
    empty.hidden = shown > 0 || !q
  }
  var openSearch = function (open) {
    side.classList.toggle('searching', open); input.hidden = !open
    var btn = side.querySelector('[data-action=search]')
    btn.innerHTML = open ? "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M18 6 6 18\"></path><path d=\"m6 6 12 12\"></path></svg>" : "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m21 21-4.34-4.34\"></path><circle cx=\"11\" cy=\"11\" r=\"8\"></circle></svg>"
    if (open) { input.focus(); loadIndex() } else { input.value = ''; q = ''; apply() }
  }
  input.addEventListener('input', function () { q = input.value.trim().toLowerCase(); apply() })
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') openSearch(false)
    if (e.key === 'Enter') { var first = rows.filter(function (li) { return !li.hidden })[0]; if (first) go(first.querySelector('a').href, true) }
  })
  var on = list.querySelector('li.on'); if (on) on.scrollIntoView({ block: 'nearest' })

  // ---- pages are kept for the whole visit: switching back to a note is instant, with no refetch ----
  var PREFIX = 'sj-page:'
  var key = function (u) { var x = new URL(u, location.href); x.hash = ''; x.search = ''; return x.href }
  var cache = new Map(), inflight = {}, scrolls = {}
  try {   // pages cached by an older publish are dropped
    if (sessionStorage.getItem('sj-build') !== body.dataset.build) {
      for (var i = sessionStorage.length - 1; i >= 0; i--) { var k = sessionStorage.key(i); if (k && k.indexOf(PREFIX) === 0) sessionStorage.removeItem(k) }
      sessionStorage.setItem('sj-build', body.dataset.build)
    }
  } catch (e) {}
  var remember = function (u, entry) { cache.set(u, entry); try { sessionStorage.setItem(PREFIX + u, JSON.stringify(entry)) } catch (e) {} }
  var recall = function (u) {
    if (cache.has(u)) return cache.get(u)
    try { var s = sessionStorage.getItem(PREFIX + u); if (s) { var e = JSON.parse(s); cache.set(u, e); return e } } catch (e) {}
    return null
  }
  var absolutise = function (el, from) { el.querySelectorAll('a[href]').forEach(function (a) { a.setAttribute('href', new URL(a.getAttribute('href'), from).href) }) }
  var current = key(location.href)
  absolutise(pane, location.href)
  remember(current, { title: document.title, html: pane.innerHTML })

  var load = function (u) {
    var hit = recall(u)
    if (hit) return Promise.resolve(hit)
    if (!inflight[u]) {
      inflight[u] = fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text() }).then(function (t) {
        var doc = new DOMParser().parseFromString(t, 'text/html'), p = doc.querySelector('main.pane')
        if (!p) throw new Error('not a note page')
        absolutise(p, u)
        var entry = { title: doc.title, html: p.innerHTML }
        remember(u, entry); return entry
      })
      inflight[u].then(function () { delete inflight[u] }, function () { delete inflight[u] })
    }
    return inflight[u]
  }
  var show = function (u, entry, restore) {
    pane.innerHTML = entry.html; document.title = entry.title
    rows.forEach(function (li) { li.classList.toggle('on', li.querySelector('a').href === u) })
    pane.scrollTop = restore && scrolls[u] ? scrolls[u] : 0
    current = u
    if (narrow.matches) work.classList.remove('side-open')
  }
  var go = function (href, push) {
    var u = key(href)
    scrolls[current] = pane.scrollTop
    load(u).then(function (entry) { if (push) history.pushState({ sj: 1 }, '', u); show(u, entry, !push) })
      .catch(function () { location.href = u })
  }
  var inVault = function (u) { return u.indexOf(baseUrl) === 0 && /\/$/.test(u) }
  history.replaceState({ sj: 1 }, '')
  window.addEventListener('popstate', function () {
    var u = key(location.href)
    if (!inVault(u)) { location.reload(); return }
    scrolls[current] = pane.scrollTop
    load(u).then(function (entry) { show(u, entry, true) }).catch(function () { location.reload() })
  })

  // warm the cache just before a click
  var hoverTimer = null
  var prefetch = function (a) { var u = key(a.href); if (inVault(u) && !recall(u)) load(u).catch(function () {}) }
  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return
    clearTimeout(hoverTimer); hoverTimer = setTimeout(function () { prefetch(a) }, 70)
  })
  document.addEventListener('touchstart', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) prefetch(a) }, { passive: true })

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    var a = e.target.closest('a[href]')
    if (a && !a.target && !a.hasAttribute('download')) {
      var u = key(a.href)
      if (inVault(u)) {
        if (a.hash && u === current) return   // in-page anchor
        e.preventDefault()
        if (u === current) { if (narrow.matches) work.classList.remove('side-open'); return }
        go(a.href, true); return
      }
    }
    var btn = e.target.closest('[data-action]'); if (!btn) return
    var act = btn.dataset.action
    if (act === 'search') openSearch(input.hidden)
    if (act === 'sidebar') {
      if (narrow.matches) work.classList.toggle('side-open')
      else { var closed = root.dataset.side === 'closed'; if (closed) delete root.dataset.side; else root.dataset.side = 'closed'; set('sj-side', closed ? '1' : '0') }
    }
  })
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'k')) { e.preventDefault(); if (narrow.matches) work.classList.add('side-open'); delete root.dataset.side; openSearch(true) }
  })
})()
