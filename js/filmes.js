// ─────────────────────────────────────────────────────────────
//  filmes.js — Decifrando o Oscar
//  Catálogo de filmes — carrega filmes.json e agrupa por filme
// ─────────────────────────────────────────────────────────────

const PER_PAGE = 32

// ── HELPERS ───────────────────────────────────────────────────
function fmt(n) {
  if (!n) return null
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1).replace('.',',') + 'B'
  if (n >= 1e6) return '$' + Math.round(n / 1e6) + 'M'
  return '$' + n.toLocaleString('pt-BR')
}

function initials(name) {
  return (name || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}

// ── AGRUPA ROWS EM FILMES ─────────────────────────────────────
function buildFilms(data) {
  const map = {}
  data.forEach(row => {
    const key = row.tmdb_id != null ? row.tmdb_id : row.film
    if (!map[key]) map[key] = []
    map[key].push(row)
  })

  return Object.values(map).map(rows => {
    const b = rows[0]
    const nominations = rows.map(r => ({
      category: r.canon_category || r.category,
      winner:   r.winner === 'True' || r.winner === true,
    }))
    const wins = nominations.filter(n => n.winner).length
    return {
      tmdb_id:    b.tmdb_id,
      imdb_id:    b.imdb_id,
      slug:       encodeURIComponent(b.film || '').replace(/%20/g,'+'),
      titulo:     b.titulo || b.film,
      year_film:  b.year_film,
      ceremony:   b.ceremony,
      director:   (b.equipe_tecnica || []).find(e => e.departamento === 'Directing')?.nome || '',
      genres:     b.generos || [],
      nominations,
      total_nominations: nominations.length,
      total_wins: wins,
      winner:     wins > 0,
      box:        fmt(b.bilheteria),
      poster_url: b.poster_url,
      nota_media: b.nota_media,
    }
  })
}

// ── ESTADO ────────────────────────────────────────────────────
let ALL_FILMS = []
const state = { search:'', resultado:'todos', genero:'', periodo:'', page:1 }

// ── FILTROS ───────────────────────────────────────────────────
function getFiltered() {
  const q = state.search.toLowerCase()
  return ALL_FILMS.filter(f => {
    if (q && !f.titulo.toLowerCase().includes(q) && !f.director.toLowerCase().includes(q)) return false
    if (state.resultado === 'vencedores' && !f.winner)  return false
    if (state.resultado === 'indicados'  &&  f.winner)  return false
    if (state.genero) {
      const g = state.genero.charAt(0).toUpperCase() + state.genero.slice(1)
      const map = { Comedia:'Comédia' }
      const gn = map[g] || g
      if (!f.genres.some(fg => fg.toLowerCase() === gn.toLowerCase())) return false
    }
    if (state.periodo) {
      const [from, to] = state.periodo.split('-').map(Number)
      if (f.year_film < from || f.year_film > to) return false
    }
    return true
  })
}

// ── RENDERIZAR CARD ───────────────────────────────────────────
function renderCard(film) {
  const art = document.createElement('article')
  art.className = 'film-card'
  art.setAttribute('role', 'listitem')
  art.style.cursor = 'pointer'
  art.addEventListener('click', () => {
    const id = film.tmdb_id || film.imdb_id || film.slug
    window.location.href = 'filme.html?id=' + encodeURIComponent(id)
  })

  const winsText = film.total_wins === 1 ? '1 vitória' : film.total_wins + ' vitórias'
  const winsColor = film.total_wins > 0 ? 'var(--c-gold)' : 'var(--c-text-muted)'

  art.innerHTML = `
    <div class="film-card__poster">
      <img src="${film.poster_url || ''}" alt="Pôster de ${film.titulo}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
      <div class="film-card__poster-placeholder" style="display:none">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>
      <div class="film-card__hover-overlay">
        <p class="film-card__hover-title">${film.titulo}</p>
      </div>
    </div>
    <div class="film-card__body">
      <div class="film-card__top">
        <h3 class="film-card__title">${film.titulo}</h3>
        <span class="${film.winner ? 'badge--win' : 'badge--nom'}">${film.winner ? '★ vencedor' : 'indicado'}</span>
      </div>
      <p class="film-card__meta">
        ${film.year_film}${film.director ? ' · ' + film.director : ''}
      </p>
      <div class="film-card__genres">
        ${film.genres.slice(0,3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
      </div>
      <div class="film-card__stats">
        <span class="film-card__noms">
          ${film.total_nominations} ind. · <span style="color:${winsColor}">${winsText}</span>
        </span>
        ${film.box ? `<span class="film-card__box">${film.box}</span>` : ''}
      </div>
    </div>
  `
  return art
}

// ── PAGINAÇÃO ─────────────────────────────────────────────────
function renderPagination(total, current) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const pag = document.getElementById('pagination')
  if (totalPages <= 1) { pag.innerHTML = ''; return }

  const items = []
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) items.push(i) }
  else {
    items.push(1)
    if (current > 3) items.push('…')
    for (let i = Math.max(2, current-1); i <= Math.min(totalPages-1, current+1); i++) items.push(i)
    if (current < totalPages - 2) items.push('…')
    items.push(totalPages)
  }

  const inner = document.createElement('div')
  inner.className = 'pagination__inner'

  const arrowBtn = (dir, disabled, onClick) => {
    const btn = document.createElement('button')
    btn.className = 'page-btn'
    btn.disabled = disabled
    btn.setAttribute('aria-label', dir === 'left' ? 'Página anterior' : 'Próxima página')
    btn.innerHTML = dir === 'left'
      ? '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    if (!disabled) btn.addEventListener('click', onClick)
    return btn
  }

  inner.appendChild(arrowBtn('left', current === 1, () => { state.page--; render(); window.scrollTo({top:0,behavior:'smooth'}) }))

  items.forEach(item => {
    if (item === '…') {
      const s = document.createElement('span'); s.className = 'page-ellipsis'; s.textContent = '…'
      inner.appendChild(s)
    } else {
      const btn = document.createElement('button')
      btn.className = 'page-btn' + (item === current ? ' page-btn--active' : '')
      btn.textContent = item
      if (item === current) btn.setAttribute('aria-current', 'page')
      btn.addEventListener('click', () => { state.page = item; render(); window.scrollTo({top:0,behavior:'smooth'}) })
      inner.appendChild(btn)
    }
  })

  inner.appendChild(arrowBtn('right', current === totalPages, () => { state.page++; render(); window.scrollTo({top:0,behavior:'smooth'}) }))

  pag.innerHTML = ''
  pag.appendChild(inner)
}

// ── RENDER PRINCIPAL ──────────────────────────────────────────
function render() {
  const filtered   = getFiltered()
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  if (state.page > totalPages) state.page = 1
  const paged = filtered.slice((state.page-1)*PER_PAGE, state.page*PER_PAGE)

  document.getElementById('films-count').textContent = filtered.length.toLocaleString('pt-BR')

  const grid       = document.getElementById('films-grid')
  const emptyState = document.getElementById('empty-state')

  grid.innerHTML = ''
  if (paged.length === 0) {
    grid.style.display = 'none'; emptyState.style.display = 'flex'
  } else {
    grid.style.display = ''; emptyState.style.display = 'none'
    paged.forEach(f => grid.appendChild(renderCard(f)))
    // entrada animada
    requestAnimationFrame(() => {
      grid.querySelectorAll('.film-card').forEach((card, i) => {
        card.style.opacity = '0'; card.style.transform = 'translateY(8px)'
        card.style.transition = `opacity 0.3s ease ${i*30}ms, transform 0.3s ease ${i*30}ms`
        requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)' })
      })
    })
  }

  renderPagination(filtered.length, state.page)

  // botão limpar
  const hasFilter = state.genero || state.periodo || state.resultado !== 'todos' || state.search
  document.getElementById('clear-filters').hidden = !hasFilter
}

// ── FILTROS ───────────────────────────────────────────────────
document.querySelectorAll('.filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group
    const value = btn.dataset.value
    if (group === 'resultado') {
      state.resultado = value
      document.querySelectorAll('[data-group="resultado"]').forEach(b =>
        b.classList.toggle('filter-pill--active', b.dataset.value === value))
    } else {
      if (state[group] === value) {
        state[group] = ''; btn.classList.remove('filter-pill--active')
      } else {
        state[group] = value
        document.querySelectorAll(`[data-group="${group}"]`).forEach(b =>
          b.classList.toggle('filter-pill--active', b.dataset.value === value))
      }
    }
    state.page = 1; render()
  })
})

// ── BUSCA ─────────────────────────────────────────────────────
let searchTimer
document.getElementById('search-input').addEventListener('input', e => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { state.search = e.target.value.trim(); state.page = 1; render() }, 220)
})

// ── LIMPAR ─────────────────────────────────────────────────────
document.getElementById('clear-filters').addEventListener('click', () => {
  state.search = ''; state.resultado = 'todos'; state.genero = ''; state.periodo = ''; state.page = 1
  document.getElementById('search-input').value = ''
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('filter-pill--active'))
  document.querySelector('[data-value="todos"]').classList.add('filter-pill--active')
  render()
})

// ── NAV MOBILE ────────────────────────────────────────────────
const toggle   = document.querySelector('.nav__toggle')
const navLinks = document.querySelector('.nav__links')
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open')
    toggle.setAttribute('aria-expanded', open)
    const [a, b, c] = toggle.querySelectorAll('span')
    if (open) { a.style.transform = 'translateY(6.5px) rotate(45deg)'; b.style.opacity = '0'; c.style.transform = 'translateY(-6.5px) rotate(-45deg)' }
    else { [a, b, c].forEach(s => { s.style.transform = ''; s.style.opacity = '' }) }
  })
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false')
    toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '' })
  }))
}

// ── LOADING STATE ─────────────────────────────────────────────
function showGridLoading() {
  const _es = document.getElementById('empty-state'); if (_es) _es.style.display = 'none'
  document.getElementById('films-grid').innerHTML = Array(6).fill(`
    <div style="background:var(--c-surface);border:0.5px solid var(--c-border);border-radius:10px;overflow:hidden;animation:pulse 1.5s ease-in-out infinite">
      <div style="aspect-ratio:2/3;background:var(--c-surface-2)"></div>
      <div style="padding:14px">
        <div style="height:14px;background:var(--c-surface-2);border-radius:3px;margin-bottom:8px"></div>
        <div style="height:11px;background:var(--c-surface-2);border-radius:3px;width:60%"></div>
      </div>
    </div>`).join('')
  document.getElementById('films-count').textContent = '…'
  const style = document.createElement('style')
  style.textContent = '@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}'
  document.head.appendChild(style)
}

// ── INIT ──────────────────────────────────────────────────────
showGridLoading()

fetch('filmes.json')
  .then(r => { if (!r.ok) throw new Error('filmes.json não encontrado'); return r.json() })
  .then(data => {
    ALL_FILMS = buildFilms(data)
    // ordena: mais vitórias primeiro, depois mais indicações
    ALL_FILMS.sort((a, b) => b.total_wins - a.total_wins || b.total_nominations - a.total_nominations)
    render()
  })
  .catch(err => {
    document.getElementById('films-grid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--c-text-faint)">
        <p style="font-family:var(--f-display);font-size:18px;color:var(--c-text-muted);margin-bottom:8px">
          Erro ao carregar dados
        </p>
        <p style="font-size:13px">${err.message}</p>
        <p style="font-size:12px;margin-top:12px;color:var(--c-text-faint)">
          Coloque o arquivo <code style="color:var(--c-gold)">filmes.json</code> na mesma pasta.
        </p>
      </div>`
    document.getElementById('films-count').textContent = '0'
  })
