// ── MAPEAMENTOS ───────────────────────────────────────────────
const LANGS = {
    en: 'Inglês',
    pt: 'Português',
    fr: 'Francês',
    es: 'Espanhol',
    de: 'Alemão',
    it: 'Italiano',
    ja: 'Japonês',
    ko: 'Coreano',
    zh: 'Mandarim',
    ar: 'Árabe',
    ru: 'Russo',
    sv: 'Sueco',
    da: 'Dinamarquês',
    nl: 'Holandês',
    no: 'Norueguês',
    hi: 'Hindi'
}
const COUNTRIES = {
    'United States of America': 'EUA',
    'United Kingdom': 'Reino Unido',
    France: 'França',
    Germany: 'Alemanha',
    Italy: 'Itália',
    Japan: 'Japão',
    'South Korea': 'Coreia do Sul',
    Spain: 'Espanha',
    Australia: 'Austrália',
    Canada: 'Canadá',
    Ireland: 'Irlanda',
    Mexico: 'México',
    Brazil: 'Brasil',
    India: 'Índia',
    'New Zealand': 'Nova Zelândia',
    Austria: 'Áustria',
    China: 'China',
    Argentina: 'Argentina',
    Poland: 'Polônia',
    Sweden: 'Suécia',
    Denmark: 'Dinamarca',
    Netherlands: 'Holanda'
}
const STREAMING_ICONS = {
    Netflix: 'N',
    'Prime Video': '▶',
    'Disney+': '✦',
    'Apple TV+': '',
    'Apple TV': '',
    Max: 'M',
    Peacock: 'P',
    Mubi: 'M',
    Tubi: 'T',
    'Paramount+': '★',
    Hulu: 'H'
}
const DEPT_PT = {
    Directing: 'Direção',
    Writing: 'Roteiro',
    Production: 'Produção',
    Camera: 'Fotografia',
    Art: 'Arte',
    'Costume & Make-Up': 'Figurino',
    Sound: 'Som',
    Editing: 'Montagem',
    'Visual Effects': 'Efeitos Visuais',
    Crew: 'Equipe',
    Lighting: 'Iluminação'
}
const DEPT_ORDER = [
    'Directing',
    'Writing',
    'Production',
    'Camera',
    'Art',
    'Costume & Make-Up',
    'Sound',
    'Editing',
    'Visual Effects'
]

// ── HELPERS ───────────────────────────────────────────────────
function fmt(n) {
    if (!n) return null
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1).replace('.', ',') + 'B'
    if (n >= 1e6) return '$' + Math.round(n / 1e6) + 'M'
    return '$' + n.toLocaleString('pt-BR')
}
function pct(b, r) {
    if (!b || !r || b === 0) return null
    return (r / b).toFixed(1).replace('.', ',') + '×'
}
function lang(code) {
    return LANGS[code] || code || '—'
}
function country(arr) {
    return (
        (arr || [])
            .slice(0, 2)
            .map(c => COUNTRIES[c] || c)
            .join(' / ') || '—'
    )
}
function runtime(min) {
    if (!min) return null
    const h = Math.floor(min / 60),
        m = min % 60
    return h > 0 ? h + 'h' + (m > 0 ? ' ' + m + 'min' : '') : m + 'min'
}
function ordinal(n) {
    return n + 'ª ed.'
}
function initials(name) {
    return (name || '?')
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
}

// ── LÊ O PARÂMETRO ?id= ──────────────────────────────────────
function parseId() {
    const raw = new URLSearchParams(window.location.search).get('id') || ''
    return decodeURIComponent(raw)
}

// ── RESOLVE QUAL FILME corresponde ao ID ──────────────────────
// Aceita: tmdb_id numérico, imdb_id (ttXXX), ou slug (título)
function findFilmRows(data, idStr) {
    if (!idStr || idStr === 'null' || idStr === 'undefined') return null

    // Tenta tmdb_id numérico
    const num = parseInt(idStr, 10)
    if (!isNaN(num) && num > 0) {
        const rows = data.filter(r => r.tmdb_id == num)
        if (rows.length) return rows
    }

    // Tenta imdb_id (ttXXXXXX)
    if (/^tt\d+$/i.test(idStr)) {
        const rows = data.filter(r => r.imdb_id === idStr)
        if (rows.length) return rows
    }

    // Tenta slug (título encodado)
    const slug = idStr.replace(/\+/g, ' ').toLowerCase()
    const rows = data.filter(r => (r.film || '').toLowerCase() === slug)
    if (rows.length) return rows

    return null
}

// ── AGRUPA ROWS NUM OBJETO FILME ──────────────────────────────
function buildFilm(rows) {
    const base = rows[0]
    const nominations = rows.map(r => ({
        category: r.canon_category || r.category || '',
        name: r.name || '',
        winner: r.winner === 'True' || r.winner === true
    }))
    const wins = nominations.filter(n => n.winner).length
    return {
        tmdb_id: base.tmdb_id,
        imdb_id: base.imdb_id,
        film: base.film,
        titulo: base.titulo || base.film || 'Sem título',
        titulo_en: base.titulo_en || base.film,
        year_film: base.year_film,
        year_ceremony: base.year_ceremony,
        ceremony: base.ceremony,
        duracao_min: base.duracao_min,
        orcamento: base.orcamento,
        bilheteria: base.bilheteria,
        idioma_original: base.idioma_original,
        paises_producao: base.paises_producao || [],
        sinopse: base.sinopse,
        nota_media: base.nota_media,
        quantidade_votos: base.quantidade_votos,
        popularidade: base.popularidade,
        generos: base.generos || [],
        palavras_chave: base.palavras_chave || [],
        elenco: base.elenco || [],
        equipe_tecnica: base.equipe_tecnica || [],
        streaming: base.streaming || [],
        poster_url: base.poster_url,
        background_url: base.background_url,
        colecao: base.colecao,
        nominations,
        total_nominations: nominations.length,
        total_wins: wins,
        winner: wins > 0
    }
}

// ── RENDERIZA PÁGINA COMPLETA ──────────────────────────────────
function render(film, allFilms) {
    document.title = film.titulo + ' — Decifrando o Oscar'

    const el = id => document.getElementById(id)
    if (el('breadcrumb-title')) el('breadcrumb-title').textContent = film.titulo

    // Equipe técnica
    const dir = film.equipe_tecnica.find(e => e.departamento === 'Directing')
    const writers = film.equipe_tecnica
        .filter(e => e.departamento === 'Writing')
        .slice(0, 3)

    const crewMap = {}
    film.equipe_tecnica.forEach(e => {
        if (!crewMap[e.departamento]) crewMap[e.departamento] = []
        crewMap[e.departamento].push(e)
    })
    const depts = [
        ...DEPT_ORDER.filter(d => crewMap[d]),
        ...Object.keys(crewMap).filter(d => !DEPT_ORDER.includes(d))
    ]

    // Indicações
    const wonCats = film.nominations.filter(n => n.winner)
    const nomCats = film.nominations.filter(n => !n.winner)

    // Dados formatados
    const fmtBudget = fmt(film.orcamento)
    const fmtBox = fmt(film.bilheteria)
    const fmtRoi = pct(film.orcamento, film.bilheteria)
    const rt = runtime(film.duracao_min)
    const countries = country(film.paises_producao)
    const langName = lang(film.idioma_original)

    // Prev / Next
    const idx = allFilms.findIndex(
        f => f.tmdb_id === film.tmdb_id || f.film === film.film
    )
    const prev = idx > 0 ? allFilms[idx - 1] : null
    const next = idx < allFilms.length - 1 ? allFilms[idx + 1] : null

    function navId(f) {
        return encodeURIComponent(f.tmdb_id || f.imdb_id || f.film || '')
    }

    // ── HERO ───────────────────────────────────────────────────
    el('main-content').innerHTML = `
    <section class="detail-hero"
      ${film.background_url ? `style="background-image:url('${film.background_url}')"` : ''}
      aria-label="Cabeçalho do filme">
      <div class="detail-hero__content">

        <div class="detail-hero__poster">
          ${
              film.poster_url
                  ? `<img src="${film.poster_url}" alt="Pôster de ${film.titulo}"
                   onerror="this.style.display='none'" />`
                  : ''
          }
        </div>

        <div class="detail-hero__info">
          <p class="detail-hero__eyebrow">
            ${film.ceremony ? ordinal(film.ceremony) + ' cerimônia' : ''}
            ${film.year_ceremony ? ' · ' + film.year_ceremony : ''}
          </p>

          <h1 class="detail-hero__title">${film.titulo}</h1>

          ${
              film.titulo_en && film.titulo_en !== film.titulo
                  ? `<p class="detail-hero__title-en">${film.titulo_en}</p>`
                  : ''
          }

          <div class="detail-hero__meta">
            ${[film.year_film, rt, countries]
                .filter(Boolean)
                .map((v, i) =>
                    i === 0
                        ? v
                        : `<span class="detail-hero__meta-sep">·</span>${v}`
                )
                .join(' ')}
          </div>

          <div class="detail-hero__badges">
            <span class="${film.winner ? 'badge--win' : 'badge--nom'}">
              ${film.winner ? '★ vencedor' : 'indicado'}
            </span>
            ${
                film.nota_media
                    ? `
            <div class="tmdb-badge">
              <span class="tmdb-badge__star">★</span>
              <span class="tmdb-badge__score">${film.nota_media.toFixed(1)}</span>
              ${
                  film.quantidade_votos
                      ? `<span class="tmdb-badge__votes">${Math.round(film.quantidade_votos / 1000)}k votos</span>`
                      : ''
              }
            </div>`
                    : ''
            }
          </div>
        </div>

      </div>
    </section>

    <div class="detail-body">

      ${
          film.sinopse
              ? `
      <section class="detail-section">
        <p class="detail-synopsis">${film.sinopse}</p>
      </section>`
              : ''
      }

      <!-- Direção / Roteiro / Idioma / País -->
      <section class="detail-section">
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <p class="detail-info-item__label">direção</p>
            <p class="detail-info-item__value">${dir ? dir.nome : '—'}</p>
          </div>
          <div class="detail-info-item">
            <p class="detail-info-item__label">roteiro</p>
            <p class="detail-info-item__value">${writers.length ? writers.map(w => w.nome).join(', ') : '—'}</p>
          </div>
          <div class="detail-info-item">
            <p class="detail-info-item__label">idioma original</p>
            <p class="detail-info-item__value">${langName}</p>
          </div>
          <div class="detail-info-item">
            <p class="detail-info-item__label">país de produção</p>
            <p class="detail-info-item__value">${countries}</p>
          </div>
        </div>
      </section>

      <!-- Stats financeiros -->
      <section class="detail-section">
        <div class="detail-stats">
          <div class="detail-stat">
            <p class="detail-stat__label">orçamento</p>
            <p class="detail-stat__value">${fmtBudget || '—'}</p>
          </div>
          <div class="detail-stat">
            <p class="detail-stat__label">bilheteria</p>
            <p class="detail-stat__value">${fmtBox || '—'}</p>
          </div>
          <div class="detail-stat">
            <p class="detail-stat__label">retorno (ROI)</p>
            <p class="detail-stat__value">${fmtRoi || '—'}</p>
          </div>
          <div class="detail-stat">
            <p class="detail-stat__label">nota TMDB</p>
            <p class="detail-stat__value">${film.nota_media ? film.nota_media.toFixed(1) : '—'}</p>
            ${
                film.quantidade_votos
                    ? `<p class="detail-stat__sub">${film.quantidade_votos.toLocaleString('pt-BR')} votos</p>`
                    : ''
            }
          </div>
          <div class="detail-stat">
            <p class="detail-stat__label">popularidade</p>
            <p class="detail-stat__value">${film.popularidade ? film.popularidade.toFixed(1) : '—'}</p>
          </div>
        </div>
      </section>

      <!-- Gêneros + palavras-chave -->
      ${
          film.generos.length || film.palavras_chave.length
              ? `
      <section class="detail-section">
        <p class="detail-section__label">gêneros e palavras-chave</p>
        <div class="detail-tags">
          ${film.generos.map(g => `<span class="tag-genre">${g}</span>`).join('')}
          ${film.palavras_chave
              .slice(0, 12)
              .map(k => `<span class="tag-keyword">${k}</span>`)
              .join('')}
        </div>
      </section>`
              : ''
      }

      <!-- Indicações e vitórias -->
      ${
          film.nominations.length
              ? `
      <section class="detail-section">
        <p class="detail-section__label">indicações e vitórias</p>
        <p class="cats-heading">
          <strong>${film.total_nominations}</strong> indicações ·
          <strong>${film.total_wins}</strong> vitórias
        </p>
        <div class="cats-grid">
          ${wonCats
              .map(
                  c => `
            <span class="cat-pill--won">
              <span class="cat-star">★</span>
              ${c.category}
              ${c.name ? `<em style="opacity:.7;font-size:10px;font-style:normal"> · ${c.name}</em>` : ''}
            </span>`
              )
              .join('')}
          ${nomCats
              .map(
                  c => `
            <span class="cat-pill--nom">
              ${c.category}
              ${c.name ? `<em style="opacity:.6;font-size:10px;font-style:normal"> · ${c.name}</em>` : ''}
            </span>`
              )
              .join('')}
        </div>
      </section>`
              : ''
      }

      <!-- Elenco -->
      ${
          film.elenco.length
              ? `
      <section class="detail-section">
        <p class="detail-section__label">elenco principal</p>
        <div class="cast-grid">
          ${film.elenco
              .slice(0, 10)
              .map(
                  c => `
            <div class="cast-card">
              <div class="cast-photo-wrap">
                ${
                    c.foto_url
                        ? `<img src="${c.foto_url}" alt="${c.nome}" loading="lazy"
                          onerror="this.parentElement.innerHTML='<div class=cast-photo-placeholder>${initials(c.nome)}</div>'" />`
                        : `<div class="cast-photo-placeholder">${initials(c.nome)}</div>`
                }
              </div>
              <p class="cast-name">${c.nome}</p>
              ${c.personagem ? `<p class="cast-role">${c.personagem}</p>` : ''}
            </div>`
              )
              .join('')}
        </div>
      </section>`
              : ''
      }

      <!-- Equipe técnica -->
      ${
          depts.length
              ? `
      <section class="detail-section">
        <p class="detail-section__label">equipe técnica</p>
        <div class="crew-groups">
          ${depts
              .map(
                  dept => `
            <div>
              <p class="crew-group__label">${DEPT_PT[dept] || dept}</p>
              <div class="crew-list">
                ${crewMap[dept]
                    .slice(0, 4)
                    .map(
                        e => `
                  <div class="crew-item">
                    <div class="crew-avatar">
                      ${
                          e.foto_url
                              ? `<img src="${e.foto_url}" alt="${e.nome}" loading="lazy"
                                onerror="this.parentElement.innerHTML='<div class=crew-avatar__init>${initials(e.nome)}</div>'" />`
                              : `<div class="crew-avatar__init">${initials(e.nome)}</div>`
                      }
                    </div>
                    <div>
                      <p class="crew-name">${e.nome}</p>
                      <p class="crew-role">${e.funcao}</p>
                    </div>
                  </div>`
                    )
                    .join('')}
              </div>
            </div>`
              )
              .join('')}
        </div>
      </section>`
              : ''
      }

      <!-- Streaming -->
      ${
          film.streaming && film.streaming.length
              ? `
      <section class="detail-section">
        <p class="detail-section__label">disponível em streaming</p>
        <div class="streaming-list">
          ${film.streaming
              .map(
                  s => `
            <div class="streaming-pill">
              <span class="streaming-icon">${STREAMING_ICONS[s] || '▶'}</span>
              <span>${s}</span>
            </div>`
              )
              .join('')}
        </div>
      </section>`
              : ''
      }

      ${
          film.colecao
              ? `
      <section class="detail-section" style="padding-bottom:8px">
        <p class="detail-section__label">coleção</p>
        <p style="font-size:13px;color:var(--c-text-muted)">${film.colecao}</p>
      </section>`
              : ''
      }

    </div>
  `

    // Rodapé com prev/next
    el('detail-footer').innerHTML = `
    <p class="detail-footer__sources">
      fontes:
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB API</a>
      ·
      <a href="https://www.kaggle.com" target="_blank" rel="noopener">Oscar dataset (Kaggle)</a>
      ${
          film.imdb_id
              ? ` · <a href="https://www.imdb.com/title/${film.imdb_id}" target="_blank" rel="noopener">IMDb</a>`
              : ''
      }
    </p>
    <div class="detail-footer__nav">
      ${
          prev
              ? `<a href="filme.html?id=${navId(prev)}" class="detail-nav-btn">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        filme anterior
      </a>`
              : ''
      }
      ${
          next
              ? `<a href="filme.html?id=${navId(next)}" class="detail-nav-btn">
        próximo filme
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>`
              : ''
      }
    </div>
  `
}

// ── ESTADOS UI ────────────────────────────────────────────────
function showLoading() {
    document.getElementById('main-content').innerHTML = `
    <div class="detail-loading">
      <div class="detail-loading__spinner"></div>
      <p class="detail-loading__text">Carregando dados…</p>
    </div>`
}

function showError(title, msg) {
    document.getElementById('main-content').innerHTML = `
    <div class="detail-error">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="0.75">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4m0 4h.01" stroke-linecap="round"/>
      </svg>
      <p class="detail-error__title">${title}</p>
      <p class="detail-error__sub">${msg}</p>
      <a href="filmes.html"
         style="margin-top:12px;font-size:13px;color:#D4AF37;
                border-bottom:1px solid rgba(212,175,55,0.35);padding-bottom:2px">
        ← voltar ao catálogo
      </a>
    </div>`
}

// ── NAV MOBILE ────────────────────────────────────────────────
const toggle = document.querySelector('.nav__toggle')
const navLinks = document.querySelector('.nav__links')
if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open')
        toggle.setAttribute('aria-expanded', open)
        const spans = toggle.querySelectorAll('span')
        if (open) {
            spans[0].style.transform = 'translateY(6.5px) rotate(45deg)'
            spans[1].style.opacity = '0'
            spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)'
        } else {
            spans.forEach(s => {
                s.style.transform = ''
                s.style.opacity = ''
            })
        }
    })
}

// ── INIT ──────────────────────────────────────────────────────
showLoading()

const idStr = parseId()

if (!idStr || idStr === 'null' || idStr === 'undefined') {
    showError(
        'Parâmetro ausente',
        'Nenhum filme foi selecionado. Escolha um na lista.'
    )
} else {
    fetch('filmes.json')
        .then(r => {
            if (!r.ok)
                throw new Error(
                    'Arquivo filmes.json não encontrado (HTTP ' +
                        r.status +
                        ').'
                )
            return r.json()
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error(
                    'filmes.json precisa ser um array de registros.'
                )
            }

            // Encontra as rows deste filme
            const rows = findFilmRows(data, idStr)
            if (!rows || rows.length === 0) {
                showError(
                    'Filme não encontrado',
                    'ID "' +
                        idStr +
                        '" não existe no dataset. Verifique se o arquivo filmes.json está correto.'
                )
                return
            }

            // Constrói lista de todos os filmes (para prev/next)
            const filmMap = {}
            data.forEach(r => {
                const k = r.tmdb_id != null ? r.tmdb_id : r.imdb_id || r.film
                if (!filmMap[k]) filmMap[k] = []
                filmMap[k].push(r)
            })
            const allFilms = Object.values(filmMap)
                .map(buildFilm)
                .sort(
                    (a, b) =>
                        b.total_wins - a.total_wins ||
                        b.total_nominations - a.total_nominations
                )

            const film = buildFilm(rows)
            document.title = film.titulo + ' — Decifrando o Oscar'
            render(film, allFilms)
        })
        .catch(err => {
            showError('Erro ao carregar dados', err.message)
        })
}
