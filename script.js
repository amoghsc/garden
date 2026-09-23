(function () {
  var root = document.documentElement, body = document.body
  var work = document.querySelector('.work'), side = document.querySelector('.side')
  var list = document.querySelector('.side-list'), input = document.querySelector('.side-search')
  var empty = list.querySelector('.empty')
  var rows = [].slice.call(list.querySelectorAll('li[data-path]'))
  var narrow = window.matchMedia('(max-width: 800px)')
  var SUN = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"></circle><path d=\"M12 2v2\"></path><path d=\"M12 20v2\"></path><path d=\"m4.93 4.93 1.41 1.41\"></path><path d=\"m17.66 17.66 1.41 1.41\"></path><path d=\"M2 12h2\"></path><path d=\"M20 12h2\"></path><path d=\"m6.34 17.66-1.41 1.41\"></path><path d=\"m19.07 4.93-1.41 1.41\"></path></svg>", MOON = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"></path></svg>"
  var set = function (k, v) { try { localStorage.setItem(k, v) } catch (e) {} }

  // theme: follows the system until the reader picks one
  var isDark = function () { var t = root.dataset.theme; return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches }
  var themeBtn = document.querySelector('[data-action=theme]')
  var paint = function () { themeBtn.innerHTML = isDark() ? SUN : MOON; themeBtn.title = isDark() ? 'Light theme' : 'Dark theme' }
  paint()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint)

  // sidebar search (titles, then note text once the index has loaded)
  var q = '', index = null
  var loadIndex = function () {
    if (index) return
    index = {}
    fetch(body.dataset.root + 'search.json').then(function (r) { return r.json() }).then(function (a) {
      a.forEach(function (e) { index[e.p] = e.x }); apply()
    }).catch(function () {})
  }
  var apply = function () {
    var shown = 0
    rows.forEach(function (li) {
      var ok = true
      if (q) {
        var t = li.textContent.toLowerCase(), x = index && index[li.dataset.path]
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
    if (e.key === 'Enter') { var first = rows.filter(function (li) { return !li.hidden })[0]; if (first) location.href = first.querySelector('a').href }
  })
  apply()
  var on = list.querySelector('li.on'); if (on) on.scrollIntoView({ block: 'nearest' })

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]'); if (!a) return
    var act = a.dataset.action
    if (act === 'theme') { var next = isDark() ? 'light' : 'dark'; root.dataset.theme = next; set('sj-theme', next); paint() }
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
