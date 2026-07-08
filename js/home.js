// 1. CONTAGEM
function animateCount(el) {
    const target = parseInt(el.dataset.target, 10)
    const duration = 1600
    const start = performance.now()

    function step(now) {
        const progress = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        el.textContent = Math.round(ease * target).toLocaleString('pt-BR')
        if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
}

const statEls = document.querySelectorAll('.hero__stat-num[data-target]')
if (statEls.length) {
    const io = new IntersectionObserver(
        entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    animateCount(e.target)
                    io.unobserve(e.target)
                }
            })
        },
        { threshold: 0.5 }
    )
    statEls.forEach(el => io.observe(el))
}

// 2. REVEAL DAS BARRAS
const barItems = document.querySelectorAll('.bar-item')
if (barItems.length) {
    const barIO = new IntersectionObserver(
        entries => {
            entries.forEach((e, i) => {
                if (e.isIntersecting) {
                    setTimeout(() => e.target.classList.add('visible'), i * 130)
                    barIO.unobserve(e.target)
                }
            })
        },
        { threshold: 0.2, rootMargin: '0px 0px -30px 0px' }
    )
    barItems.forEach(el => barIO.observe(el))
}

// 3. MENU MOBILE
const toggle = document.querySelector('.nav__toggle')
const navLinks = document.querySelector('.nav__links')

if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open')
        toggle.setAttribute('aria-expanded', open)
        const [a, b, c] = toggle.querySelectorAll('span')
        if (open) {
            a.style.transform = 'translateY(6.5px) rotate(45deg)'
            b.style.opacity = '0'
            c.style.transform = 'translateY(-6.5px) rotate(-45deg)'
        } else {
            ;[a, b, c].forEach(s => {
                s.style.transform = ''
                s.style.opacity = ''
            })
        }
    })

    navLinks.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => {
            navLinks.classList.remove('open')
            toggle.setAttribute('aria-expanded', 'false')
            toggle.querySelectorAll('span').forEach(s => {
                s.style.transform = ''
                s.style.opacity = ''
            })
        })
    )
}

// 4. LINK ATIVO
const page = window.location.pathname.split('/').pop() || 'index.html'
document.querySelectorAll('.nav__links a').forEach(a => {
    if (a.getAttribute('href').split('/').pop() === page)
        a.setAttribute('aria-current', 'page')
})

const sortear = document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('random-poster-grid')
    if (!gridContainer) return

    fetch('data/filmes.json')
        .then(response => {
            if (!response.ok) throw new Error('Erro ao carregar filmes.json')
            return response.json()
        })
        .then(data => {
            const filmMap = {}
            data.forEach(row => {
                const key = row.tmdb_id || row.imdb_id || row.film
                if (!filmMap[key]) {
                    // Simplifica a estrutura para o grid
                    const nominations = data.filter(
                        r => (r.tmdb_id || r.imdb_id || r.film) === key
                    )
                    const totalWins = nominations.filter(
                        r => r.winner === 'True' || r.winner === true
                    ).length

                    filmMap[key] = {
                        id: encodeURIComponent(
                            row.tmdb_id || row.imdb_id || row.film || ''
                        ),
                        titulo: row.titulo || row.film || 'Sem título',
                        poster:
                            row.poster_url ||
                            'https://image.tmdb.org/t/p/w342/' +
                                row.poster_path, // Fallback caso use path
                        vitorias: totalWins
                    }
                }
            })

            const uniqueFilms = Object.values(filmMap)

            // Embaralha e seleciona 4 filmes aleatórios
            const shuffled = uniqueFilms.sort(() => 0.5 - Math.random())
            const selectedFilms = shuffled.slice(0, 4)

            // Renderiza os filmes sorteados no Grid envoltos em um link <a>
            gridContainer.innerHTML = selectedFilms
                .map(
                    movie => `
        <div class="poster-grid__item">
          <a href="filme.html?id=${movie.id}" target="_blank" rel="noopener noreferrer">
            <img src="${movie.poster}" alt="Poster de ${movie.titulo}" loading="lazy" />
            <div class="poster-grid__overlay">
              <span class="badge ${movie.vitorias > 0 ? 'badge--win' : 'badge--nom'}">
                ${movie.vitorias > 0 ? `★ ${movie.vitorias} ${movie.vitorias === 1 ? 'vitória' : 'vitórias'}` : 'Indicado'}
              </span>
              <p class="poster-grid__title">${movie.titulo}</p>
            </div>
          </a>
        </div>
      `
                )
                .join('')
        })
        .catch(error =>
            console.error(
                'Não foi possível carregar a prévia dos filmes:',
                error
            )
        )
})
