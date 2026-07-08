;(function () {
    'use strict'

    // ---------- 1. Verifica se o VegaEmbed está disponível ----------
    if (typeof vegaEmbed === 'undefined') {
        console.error('❌ VegaEmbed não carregado. Verifique as tags script.')
        document.querySelectorAll('[id^="chart-"]').forEach(el => {
            el.innerHTML =
                '<p style="color: #D4AF37; padding: 20px;">Erro: bibliotecas Vega não carregadas.</p>'
        })
        return
    }

    const temaOscarConfig = {
        background: '#0E0D0C', // Cor de fundo: fundo • #0E0D0C
        title: {
            color: '#F2EFE9',
            font: 'Playfair Display, Georgia, serif',
            fontSize: 16,
            fontWeight: 600,
            anchor: 'start',
            offset: 15
        },
        axis: {
            domainColor: '#9A958C',
            gridColor: '#1A1917',
            tickColor: '#9A958C',
            labelColor: '#9A958C', // Cor do texto secundário: #9A958C
            titleColor: '#D4AF37', // Cor do dourado: #D4AF37
            labelFont: 'Inter, sans-serif',
            titleFont: 'Inter, sans-serif',
            titleFontSize: 11
        },
        legend: {
            labelColor: '#9A958C',
            titleColor: '#D4AF37',
            labelFont: 'Inter, sans-serif',
            titleFont: 'Inter, sans-serif'
        },
        view: { stroke: 'transparent' }
    }

    // ---------- 2. Carrega Dados e Inicializa ----------
    let dados = []

    const specs = [
        { id: 'chart-top-indicados', fn: specTopIndicados },
        { id: 'chart-pessoas-premios', fn: specPessoasPremios },
        { id: 'chart-franquias', fn: specFranquias },
        { id: 'chart-multiplas-categorias', fn: specMultiplasCategorias },
        { id: 'chart-mais-indicados-sem-vit', fn: specMaisIndicadosSemVit },
        { id: 'chart-nota-media', fn: specNotaMedia },
        { id: 'chart-correlacao', fn: specCorrelacao },
        { id: 'chart-diretores', fn: specDiretores },
        { id: 'chart-orcamento-decada', fn: specOrcamentoDecada },
        { id: 'chart-roi', fn: specROI },
        { id: 'chart-bilheteria-vfx', fn: specBilheteriaVFX },
        { id: 'chart-genero', fn: specGenero },
        { id: 'chart-figurino', fn: specFigurino },
        { id: 'chart-palavras-chave', fn: specPalavrasChave },
        { id: 'chart-paises-internacional', fn: specPaisesInternacional },
        { id: 'chart-indicacoes-pais', fn: specIndicacoesPais },
        { id: 'chart-streaming', fn: specStreaming },
        { id: 'chart-bechdel-dist', fn: specBechdelDist },
        { id: 'chart-bechdel-scatter', fn: specBechdelScatter }
    ]

    function renderAllCharts(dadosProntos) {
        specs.forEach(({ id, fn }) => {
            renderizarGrafico(id, fn(dadosProntos))
        })
    }

    function gerarDadosMock() {
        return [
            {
                film: 'Avatar',
                year_film: 2009,
                year_ceremony: 2010,
                winner: 'true',
                canon_category: 'VISUAL EFFECTS',
                nota_media: 7.5,
                orcamento: 237000000,
                bilheteria: 2923000000,
                generos: ['Action'],
                paises_producao: ['United Kingdom'],
                titulo: 'Avatar'
            }
        ]
    }

    function inicializar() {
        fetch('data/filmes.json')
            .then(r => {
                if (!r.ok) throw new Error('filmes.json não encontrado')
                return r.json()
            })
            .then(data => {
                dados = data
                atualizarStatsDoHeader(dados)
                renderAllCharts(dados)
            })
            .catch(err => {
                console.warn(
                    '⚠️ Erro ao carregar filmes.json, utilizando dados de fallback.',
                    err
                )
                dados = gerarDadosMock()
                renderAllCharts(dados)
            })
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar)
    } else {
        inicializar()
    }

    // ---------- 3. Função auxiliar para renderizar gráficos ----------
    function renderizarGrafico(id, spec) {
        const container = document.getElementById(id)
        if (!container) return
        container.innerHTML =
            '<p style="color: #D4AF37; font-family: Inter, sans-serif; font-size: 0.9rem;">Carregando...</p>'

        spec.config = temaOscarConfig

        spec.width = 'container'
        spec.autosize = { type: 'fit-x', contains: 'padding', resize: true }

        vegaEmbed(container, spec, {
            actions: false,
            renderer: 'svg',
            tooltip: true
        })
            .then(result => {
                // Reajusta o gráfico quando a janela é redimensionada
                // (ex.: virar o celular, redimensionar a janela do navegador)
                const onResize = () => {
                    try {
                        result.view.resize().run()
                    } catch (e) {}
                }
                window.addEventListener('resize', onResize)
            })
            .catch(err => {
                console.error(`❌ Erro em ${id}:`, err)
                container.innerHTML = `<p style="color: #7A2E2E; padding: 10px;">Erro ao renderizar gráfico.</p>`
            })
    }

    // ---------- 4. Especificações com Tooltips e Identidade Visual ----------

    function specTopIndicados(d) {
        const clean = d.filter(
            item => item.film != null && item.year_film != null
        )

        // Agrupa indicações
        const nominationsMap = {}
        clean.forEach(item => {
            const key = `${item.film}||${item.year_film}`
            nominationsMap[key] = (nominationsMap[key] || 0) + 1
        })

        // Agrupa vitórias
        const winsMap = {}
        clean
            .filter(item => String(item.winner).toLowerCase() === 'true')
            .forEach(item => {
                const key = `${item.film}||${item.year_film}`
                winsMap[key] = (winsMap[key] || 0) + 1
            })

        const data = Object.entries(nominationsMap)
            .map(([key, nominations]) => {
                const [film, year] = key.split('||')
                const wins = winsMap[key] ?? 0
                return {
                    film,
                    year: +year,
                    nominations,
                    wins,
                    filmLabel: `${film} (${year})`
                }
            })
            .sort((a, b) => b.nominations - a.nominations)
            .slice(0, 8)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3 },
            encoding: {
                x: { field: 'nominations', type: 'quantitative', title: null },
                y: {
                    field: 'filmLabel',
                    type: 'nominal',
                    sort: '-x',
                    title: null
                },
                color: {
                    field: 'wins',
                    type: 'quantitative',
                    title: 'Vitórias',
                    scale: { range: ['#7A2E2E', '#D4AF37'] }
                },
                tooltip: [
                    { field: 'film', type: 'nominal', title: 'Filme' },
                    { field: 'year', type: 'quantitative', title: 'Ano' },
                    {
                        field: 'nominations',
                        type: 'quantitative',
                        title: 'Indicações'
                    },
                    { field: 'wins', type: 'quantitative', title: 'Vitórias' }
                ]
            },
            width: 620,
            height: 420
        }
    }

    function specPessoasPremios(d) {
        const vencedores = d.filter(
            item =>
                String(item.winner).toLowerCase() === 'true' &&
                item.name !== 'France' &&
                item.name !== 'Italy'
        )
        const counts = {}
        vencedores.forEach(item => {
            const nome = item.name || 'Desconhecido'
            counts[nome] = (counts[nome] || 0) + 1
        })
        const data = Object.entries(counts)
            .map(([name, wins]) => ({ name, wins }))
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 3)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            layer: [
                {
                    mark: { type: 'bar', cornerRadiusEnd: 3, color: '#D4AF37' },
                    encoding: {
                        y: {
                            field: 'name',
                            type: 'nominal',
                            sort: '-x',
                            title: '',
                            axis: { grid: false }
                        },
                        x: {
                            field: 'wins',
                            type: 'quantitative',
                            title: '',
                            axis: null
                        },
                        tooltip: [
                            { field: 'name', type: 'nominal', title: 'Nome' },
                            {
                                field: 'wins',
                                type: 'quantitative',
                                title: 'Vitórias Totais'
                            }
                        ]
                    }
                },
                {
                    mark: {
                        type: 'text',
                        align: 'left',
                        baseline: 'middle',
                        dx: 20, // deslocamento maior
                        color: 'black',
                        fontSize: 14,
                        fontWeight: 'bold'
                    },
                    encoding: {
                        y: { field: 'name', type: 'nominal' },
                        x: { field: 'wins', type: 'quantitative' },
                        text: { field: 'wins', type: 'quantitative' }
                    }
                }
            ],
            width: 800, // largura maior
            height: 420,
            view: {
                padding: { right: 80 }
            },
            config: { view: { stroke: null } }
        }
    }

    function specFranquias(d) {
        const vencedores = d.filter(
            item =>
                String(item.winner).toLowerCase() === 'true' &&
                item.colecao &&
                item.colecao.nome
        )
        const counts = {}
        vencedores.forEach(item => {
            let nome = item.colecao.nome
                .replace(/ Collection|Coleção$/, '')
                .trim()
            counts[nome] = (counts[nome] || 0) + 1
        })
        const data = Object.entries(counts)
            .map(([colecao, wins]) => ({ colecao, wins }))
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 10)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3 },
            encoding: {
                y: {
                    field: 'colecao',
                    type: 'nominal',
                    sort: '-x',
                    title: null
                },
                x: { field: 'wins', type: 'quantitative', title: null },
                color: {
                    field: 'wins',
                    type: 'quantitative',
                    scale: { range: ['#7A2E2E', '#D4AF37'] },
                    legend: null
                },
                tooltip: [
                    {
                        field: 'colecao',
                        type: 'nominal',
                        title: 'Coleção / Franquia'
                    },
                    {
                        field: 'wins',
                        type: 'quantitative',
                        title: 'Total de Prêmios'
                    }
                ]
            },
            width: 650,
            height: 300
        }
    }

    function specMultiplasCategorias(d) {
        const vencedores = d.filter(
            item => String(item.winner).toLowerCase() === 'true'
        )
        const map = {}
        vencedores.forEach(item => {
            const nome = item.name
            if (!nome) return
            if (!map[nome]) map[nome] = new Set()
            map[nome].add(item.canon_category)
        })
        const data = Object.entries(map)
            .map(([name, categories]) => ({
                name,
                count: categories.size,
                categorias: Array.from(categories).join(', ')
            }))
            .filter(item => item.count > 1)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3, color: '#D4AF37' },
            encoding: {
                x: {
                    field: 'count',
                    type: 'quantitative',
                    title: 'Número de categorias distintas'
                },
                y: { field: 'name', type: 'nominal', sort: '-x', title: '' },
                tooltip: [
                    { field: 'name', type: 'nominal', title: 'Pessoa' },
                    {
                        field: 'count',
                        type: 'quantitative',
                        title: 'Nº de categorias'
                    },
                    {
                        field: 'categorias',
                        type: 'nominal',
                        title: 'Categorias vencidas'
                    }
                ]
            },
            width: 700,
            height: 300
        }
    }

    function specMaisIndicadosSemVit(d) {
        const stats = {}
        d.forEach(item => {
            const name = item.name
            if (!name) return
            if (!stats[name]) stats[name] = { nom: 0, wins: 0 }
            stats[name].nom += 1
            if (String(item.winner).toLowerCase() === 'true')
                stats[name].wins += 1
        })
        const data = Object.entries(stats)
            .map(([name, s]) => ({ name, nominations: s.nom, wins: s.wins }))
            .filter(item => item.wins === 0)
            .sort((a, b) => b.nominations - a.nominations)
            .slice(0, 10)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3, color: '#7A2E2E' },
            encoding: {
                x: {
                    field: 'nominations',
                    type: 'quantitative',
                    title: 'Indicações totais'
                },
                y: { field: 'name', type: 'nominal', sort: '-x', title: '' },
                tooltip: [
                    { field: 'name', type: 'nominal', title: 'Pessoa' },
                    {
                        field: 'nominations',
                        type: 'quantitative',
                        title: 'Indicações'
                    },
                    { field: 'wins', type: 'quantitative', title: 'Vitórias' }
                ]
            },
            width: 700,
            height: 300,
            title: {
                text: 'Mais Indicados Sem Nunca Vencer',
                subtitle:
                    'Pessoas com maior número de nomeações e zero vitórias'
            }
        }
    }

    function specNotaMedia(d) {
        const bestPics = d.filter(
            item =>
                item.canon_category === 'BEST PICTURE' &&
                String(item.winner).toLowerCase() === 'true'
        )
        const data = bestPics
            .map(item => ({
                year_ceremony: item.year_ceremony || item.year_film,
                nota_media: item.nota_media || 0,
                titulo: item.titulo || item.film
            }))
            .sort((a, b) => a.year_ceremony - b.year_ceremony)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: {
                type: 'line',
                point: { color: '#D4AF37' },
                color: '#7A2E2E'
            },
            encoding: {
                x: {
                    field: 'year_ceremony',
                    type: 'quantitative',
                    title: null
                },
                y: {
                    field: 'nota_media',
                    type: 'quantitative',
                    title: 'Nota média (TMDB)'
                },
                tooltip: [
                    { field: 'titulo', type: 'nominal', title: 'Filme' },
                    {
                        field: 'year_ceremony',
                        type: 'quantitative',
                        title: 'Ano da Cerimônia'
                    },
                    {
                        field: 'nota_media',
                        type: 'quantitative',
                        title: 'Nota TMDB'
                    }
                ]
            },
            width: 800,
            height: 380
        }
    }

    function specCorrelacao(d) {
        const allowed = [
            'BEST PICTURE',
            'FILM EDITING',
            'WRITING (Adapted Screenplay)',
            'DIRECTING',
            'WRITING (Original Screenplay)',
            'CINEMATOGRAPHY',
            'VISUAL EFFECTS'
        ]
        const vencedores = d.filter(
            item =>
                String(item.winner).toLowerCase() === 'true' &&
                allowed.includes(item.canon_category)
        )
        const groups = {}
        vencedores.forEach(item => {
            const film = item.film
            if (!groups[film]) groups[film] = []
            groups[film].push(item.canon_category)
        })
        const pairs = []
        for (const film in groups) {
            const cats = groups[film]
            for (let i = 0; i < cats.length; i++) {
                for (let j = i + 1; j < cats.length; j++) {
                    pairs.push({ cat1: cats[i], cat2: cats[j] })
                }
            }
        }
        const countMap = {}
        pairs.forEach(p => {
            const key = [p.cat1, p.cat2].sort().join('||')
            countMap[key] = (countMap[key] || 0) + 1
        })
        const data = Object.entries(countMap).map(([key, count]) => {
            const [cat1, cat2] = key.split('||')
            return { cat1, cat2, count }
        })

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'rect' },
            encoding: {
                x: {
                    field: 'cat1',
                    type: 'nominal',
                    title: 'Categoria A',
                    sort: 'ascending'
                },
                y: {
                    field: 'cat2',
                    type: 'nominal',
                    title: 'Categoria B',
                    sort: 'ascending'
                },
                color: {
                    field: 'count',
                    type: 'quantitative',
                    title: 'Frequência',
                    scale: { range: ['#0E0D0C', '#D4AF37'] }
                },
                tooltip: [
                    { field: 'cat1', type: 'nominal', title: 'Categoria A' },
                    { field: 'cat2', type: 'nominal', title: 'Categoria B' },
                    {
                        field: 'count',
                        type: 'quantitative',
                        title: 'Frequência'
                    }
                ]
            },
            width: 500,
            height: 480,
            title: {
                text: 'Matriz de Correlação entre Prêmios de um Mesmo Filme'
            }
        }
    }

    function specDiretores(d) {
        const bestPicSet = new Set()
        d.forEach(item => {
            if (
                item.canon_category === 'BEST PICTURE' &&
                String(item.winner).toLowerCase() === 'true'
            ) {
                bestPicSet.add(`${item.film}|${item.year_film}`)
            }
        })
        const directing = d.filter(item => item.canon_category === 'DIRECTING')
        const stats = {}
        directing.forEach(item => {
            const name = item.name
            if (!name) return
            if (!stats[name]) {
                stats[name] = {
                    total: 0,
                    winsBestPic: 0,
                    filmesIndicados: new Set(),
                    filmesVencedores: new Set()
                }
            }
            stats[name].total += 1
            stats[name].filmesIndicados.add(item.film)
            if (bestPicSet.has(`${item.film}|${item.year_film}`)) {
                stats[name].winsBestPic += 1
                stats[name].filmesVencedores.add(item.film)
            }
        })
        const data = Object.entries(stats)
            .map(([name, s]) => ({
                name,
                total: s.total,
                winsBestPic: s.winsBestPic,
                filmesIndicados: Array.from(s.filmesIndicados).join(', '),
                filmesVencedores: Array.from(s.filmesVencedores).join(', ')
            }))
            .filter(item => item.total > 0)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'circle', size: 100, opacity: 0.7 },
            encoding: {
                x: {
                    field: 'total',
                    type: 'quantitative',
                    title: 'Indicações a Melhor Direção'
                },
                y: {
                    field: 'winsBestPic',
                    type: 'quantitative',
                    title: 'Filmes do diretor que venceram Melhor Filme'
                },
                color: {
                    field: 'winsBestPic',
                    type: 'quantitative',
                    scale: { range: ['#7A2E2E', '#D4AF37'] },
                    legend: null
                },
                tooltip: [
                    { field: 'name', type: 'nominal', title: 'Diretor' },
                    {
                        field: 'total',
                        type: 'quantitative',
                        title: 'Indicações a Direção'
                    },
                    {
                        field: 'winsBestPic',
                        type: 'quantitative',
                        title: 'Vitórias em Melhor Filme'
                    },
                    {
                        field: 'filmesIndicados',
                        type: 'nominal',
                        title: 'Filmes indicados'
                    },
                    {
                        field: 'filmesVencedores',
                        type: 'nominal',
                        title: 'Filmes que venceram Melhor Filme'
                    }
                ]
            },
            width: 700,
            height: 420
        }
    }

    function specOrcamentoDecada(d) {
        const bestPics = d.filter(
            item =>
                item.canon_category === 'BEST PICTURE' &&
                String(item.winner).toLowerCase() === 'true' &&
                item.orcamento > 0
        )
        const decadeMap = {}
        bestPics.forEach(item => {
            const decade = Math.floor(item.year_ceremony / 10) * 10
            if (!decadeMap[decade]) decadeMap[decade] = { sum: 0, count: 0 }
            decadeMap[decade].sum += item.orcamento
            decadeMap[decade].count += 1
        })
        const data = Object.entries(decadeMap).map(([dec, vals]) => ({
            decade: +dec,
            orcamento_medio: vals.sum / vals.count
        }))

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3, color: '#D4AF37' },
            encoding: {
                x: { field: 'decade', type: 'nominal', title: 'Década' },
                y: {
                    field: 'orcamento_medio',
                    type: 'quantitative',
                    title: 'Orçamento médio (US$)'
                },
                tooltip: [
                    { field: 'decade', type: 'nominal', title: 'Década' },
                    {
                        field: 'orcamento_medio',
                        type: 'quantitative',
                        title: 'Orçamento Médio (US$)'
                    }
                ]
            },
            width: 700,
            height: 280
        }
    }

    function specROI(d) {
        const bestPics = d.filter(
            item =>
                item.canon_category === 'BEST PICTURE' &&
                String(item.winner).toLowerCase() === 'true' &&
                item.orcamento > 0 &&
                item.bilheteria > 0
        )
        const data = bestPics.map(item => ({
            titulo: item.titulo || item.film,
            orcamento: item.orcamento,
            bilheteria: item.bilheteria
        }))

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            transform: [
                { calculate: 'datum.bilheteria/datum.orcamento', as: 'roi' },
                {
                    window: [{ op: 'rank', as: 'rank' }],
                    sort: [{ field: 'roi', order: 'descending' }]
                },
                { filter: 'datum.rank<=20' }
            ],
            mark: { type: 'bar', cornerRadiusEnd: 3, color: '#AA7C11' },
            encoding: {
                y: { field: 'titulo', type: 'nominal', sort: '-x', title: '' },
                x: {
                    field: 'roi',
                    type: 'quantitative',
                    title: 'Bilheteria / Orçamento'
                },
                tooltip: [
                    { field: 'titulo', type: 'nominal', title: 'Filme' },
                    {
                        field: 'orcamento',
                        type: 'quantitative',
                        title: 'Orçamento (US$)'
                    },
                    {
                        field: 'bilheteria',
                        type: 'quantitative',
                        title: 'Bilheteria (US$)'
                    },
                    {
                        field: 'roi',
                        type: 'quantitative',
                        title: 'ROI Calculado'
                    }
                ]
            },
            width: 700,
            height: 420
        }
    }

    function specBilheteriaVFX(d) {
        const vfx = d.filter(
            item =>
                item.canon_category === 'VISUAL EFFECTS' &&
                item.bilheteria != null &&
                item.bilheteria > 0
        )
        const data = vfx
            .map(item => ({
                year: item.year_ceremony,
                bilheteria: item.bilheteria,
                titulo: item.titulo || item.film
            }))
            .sort((a, b) => a.year - b.year)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: {
                type: 'point', // scatter plot
                filled: true,
                size: 80,
                color: '#D4AF37'
            },
            encoding: {
                x: {
                    field: 'year',
                    type: 'quantitative',
                    title: null,
                    scale: { domain: [1925, 2026] },
                    axis: { grid: false }
                },
                y: {
                    field: 'bilheteria',
                    type: 'quantitative',
                    title: 'Bilheteria (US$)',
                    scale: { type: 'log' },
                    axis: { grid: false }
                },
                tooltip: [
                    { field: 'titulo', type: 'nominal', title: 'Filme' },
                    { field: 'year', type: 'quantitative', title: 'Ano' },
                    {
                        field: 'bilheteria',
                        type: 'quantitative',
                        title: 'Bilheteria'
                    }
                ]
            },
            width: 800,
            height: 280
        }
    }

    function specGenero(d) {
        const bestPictureWinners = d.filter(
            item =>
                item.canon_category === 'BEST PICTURE' &&
                String(item.winner).toLowerCase() === 'true'
        )
        const firstGenres = bestPictureWinners.map(item =>
            item.generos && item.generos.length > 0 ? item.generos[0] : 'Outro'
        )

        const counts = {}
        firstGenres.forEach(g => {
            counts[g] = (counts[g] || 0) + 1
        })
        const data = Object.entries(counts)
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3, color: '#D4AF37' },
            encoding: {
                y: { field: 'genre', type: 'nominal', sort: '-x', title: '' },
                x: {
                    field: 'count',
                    type: 'quantitative',
                    title: null
                },
                tooltip: [
                    { field: 'genre', type: 'nominal', title: 'Gênero' },
                    { field: 'count', type: 'quantitative', title: 'Vitórias' }
                ]
            },
            width: 500,
            height: 280
        }
    }

    function specFigurino(d) {
        const costumeWinners = d.filter(
            item =>
                item.canon_category === 'COSTUME DESIGN' &&
                item.year_film &&
                item.year_ceremony
        )
        const mapped = costumeWinners.map(item => {
            const decade = Math.floor(item.year_ceremony / 10) * 10
            const isPeriod =
                item.year_ceremony - item.year_film > 30 ||
                (item.generos || []).some(g =>
                    ['History', 'War', 'Romance'].includes(g)
                )
            return { decade, tipo: isPeriod ? 'Época' : 'Contemporâneo' }
        })

        const countMap = {}
        mapped.forEach(({ decade, tipo }) => {
            const key = `${decade}|${tipo}`
            countMap[key] = (countMap[key] || 0) + 1
        })
        const plotData = Object.entries(countMap).map(([key, count]) => {
            const [decade, tipo] = key.split('|')
            return { decade: +decade, tipo, count }
        })

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: plotData },
            mark: { type: 'bar', opacity: 0.8 },
            encoding: {
                x: { field: 'decade', type: 'nominal', title: null },
                y: {
                    field: 'count',
                    type: 'quantitative',
                    title: 'Número de vitórias',
                    stack: 'zero'
                },
                color: {
                    field: 'tipo',
                    type: 'nominal',
                    title: 'Tipo de filme',
                    scale: { range: ['#D4AF37', '#7A2E2E'] }
                },
                tooltip: [
                    { field: 'decade', type: 'nominal', title: 'Década' },
                    { field: 'tipo', type: 'nominal', title: 'Tipo' },
                    { field: 'count', type: 'quantitative', title: 'Vitórias' }
                ]
            },
            width: 700,
            height: 280
        }
    }

    function specPalavrasChave(d) {
        const bestPics = d.filter(
            item =>
                item.canon_category === 'BEST PICTURE' &&
                String(item.winner).toLowerCase() === 'true'
        )
        const keywordCount = {}
        bestPics.forEach(item => {
            ;(item.palavras_chave || []).forEach(k => {
                keywordCount[k] = (keywordCount[k] || 0) + 1
            })
        })
        const data = Object.entries(keywordCount)
            .map(([palavra, count]) => ({ palavra, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 9)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3, color: '#f1c40f' },
            encoding: {
                y: {
                    field: 'palavra',
                    type: 'nominal',
                    title: null,
                    sort: '-x'
                },
                x: { field: 'count', type: 'quantitative', title: null },
                tooltip: [
                    {
                        field: 'palavra',
                        type: 'nominal',
                        title: 'Palavra-Chave'
                    },
                    { field: 'count', type: 'quantitative', title: 'Contagem' }
                ]
            },
            width: 600,
            height: 400
        }
    }

    function specPaisesInternacional(d) {
        const intl = d.filter(
            item =>
                item.canon_category === 'INTERNATIONAL FEATURE FILM' &&
                String(item.winner).toLowerCase() === 'true'
        )
        const countryCount = {}
        intl.forEach(item => {
            ;(item.paises_producao || []).forEach(p => {
                countryCount[p] = (countryCount[p] || 0) + 1
            })
        })
        const data = Object.entries(countryCount)
            .map(([pais, total]) => ({ pais, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'bar', cornerRadiusEnd: 3, color: '#D4AF37' },
            encoding: {
                y: { field: 'pais', type: 'nominal', sort: '-x', title: '' },
                x: { field: 'total', type: 'quantitative', title: '' },
                tooltip: [
                    { field: 'pais', type: 'nominal', title: 'País' },
                    {
                        field: 'total',
                        type: 'quantitative',
                        title: 'Total Vencido'
                    }
                ]
            },
            width: 700,
            height: 300
        }
    }

    function specIndicacoesPais(d) {
        const countryStats = {}
        d.forEach(row => {
            const countries = row.paises_producao || []
            const isWinner = row.winner === 'True' || row.winner === true
            countries.forEach(pais => {
                if (!countryStats[pais])
                    countryStats[pais] = { indicacoes: 0, vitorias: 0 }
                countryStats[pais].indicacoes += 1
                if (isWinner) countryStats[pais].vitorias += 1
            })
        })

        const countryStatsArray = Object.entries(countryStats)
            .map(([pais, stats]) => ({
                pais,
                indicacoes: stats.indicacoes,
                vitorias: stats.vitorias
            }))
            .filter(
                d =>
                    d.pais !== 'United States of America' &&
                    d.pais !== 'USA' &&
                    d.pais !== 'U.S.A.'
            )

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            layer: [
                {
                    mark: {
                        type: 'geoshape',
                        fill: '#1A1917',
                        stroke: '#9A958C',
                        strokeWidth: 0.5
                    },
                    data: {
                        url: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
                        format: { type: 'topojson', feature: 'countries' }
                    }
                },
                {
                    mark: {
                        type: 'geoshape',
                        stroke: '#0E0D0C',
                        strokeWidth: 0.5
                    },
                    data: {
                        url: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
                        format: { type: 'topojson', feature: 'countries' }
                    },
                    transform: [
                        {
                            lookup: 'properties.name',
                            from: {
                                data: { values: countryStatsArray },
                                key: 'pais',
                                fields: ['indicacoes', 'vitorias']
                            }
                        },
                        { filter: 'datum.indicacoes != null' }
                    ],
                    encoding: {
                        color: {
                            field: 'indicacoes',
                            type: 'quantitative',
                            title: 'Indicações',
                            scale: { range: ['#7A2E2E', '#D4AF37'] }
                        },
                        tooltip: [
                            {
                                field: 'properties.name',
                                type: 'nominal',
                                title: 'País'
                            },
                            {
                                field: 'indicacoes',
                                type: 'quantitative',
                                title: 'Indicações'
                            },
                            {
                                field: 'vitorias',
                                type: 'quantitative',
                                title: 'Vitórias'
                            }
                        ]
                    }
                }
            ],
            projection: { type: 'equalEarth' },
            //   title: 'Indicações por País (excluindo EUA)',
            width: 800,
            height: 500
        }
    }

    function specStreaming(d) {
        let disp = 0,
            indisp = 0
        d.forEach(item => {
            if (item.streaming && item.streaming.length > 0) disp++
            else indisp++
        })
        const data = [
            { status: 'Disponivel', total: disp },
            { status: 'Indisponivel', total: indisp }
        ]

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            mark: { type: 'arc', innerRadius: 70 },
            encoding: {
                theta: { field: 'total', type: 'quantitative' },
                color: {
                    field: 'status',
                    type: 'nominal',
                    scale: { range: ['#D4AF37', '#7A2E2E'] }
                },
                tooltip: [
                    { field: 'status', type: 'nominal', title: 'Status' },
                    { field: 'total', type: 'quantitative', title: 'Total' }
                ]
            },
            width: 500,
            height: 300
            //   title: { text: 'Filmes Ganhadores Disponíveis em Streaming' }
        }
    }

    function specBechdelDist(d) {
        const winners = d.filter(
            item =>
                item.canon_category === 'BEST PICTURE' &&
                item.winner === 'True' &&
                item.bt_score != null
        )

        const counts = [0, 1, 2, 3].map(score => ({
            score,
            count: winners.filter(f => f.bt_score === score).length
        }))

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: counts },
            mark: {
                type: 'bar',
                cornerRadiusTopLeft: 4,
                cornerRadiusTopRight: 4
            },
            encoding: {
                x: {
                    field: 'score',
                    type: 'ordinal',
                    title: 'Pontuação Bechdel',
                    axis: { labelAngle: 0 }
                },
                y: {
                    field: 'count',
                    type: 'quantitative',
                    title: 'Número de Filmes'
                },
                color: {
                    field: 'score',
                    type: 'ordinal',
                    scale: {
                        domain: [0, 1, 2, 3],
                        range: ['#7A2E2E', '#9A958C', '#AA7C11', '#D4AF37']
                    },
                    legend: null
                },
                tooltip: [
                    { field: 'score', title: 'Pontuação' },
                    { field: 'count', title: 'Filmes' }
                ]
            },
            width: 400,
            height: 260
            // title: {
            //     text: 'Distribuição do Teste de Bechdel (Vencedores de Melhor Filme)'
            // }
        }
    }

    function specBechdelScatter(d) {
        const winners = d
            .filter(
                item =>
                    item.canon_category === 'BEST PICTURE' &&
                    item.winner === 'True' &&
                    item.bt_score != null
            )
            .map(item => ({
                year: Number(item.year_film),
                score: item.bt_score,
                score_jitter: item.bt_score + (Math.random() - 0.5) * 0.18,
                film: item.film
            }))

        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: winners },
            mark: {
                type: 'circle',
                size: 70,
                opacity: 0.65
            },
            encoding: {
                x: {
                    field: 'year',
                    type: 'quantitative',
                    title: 'Ano de Lançamento',
                    scale: { domain: [1927, 2025] }
                },
                y: {
                    field: 'score_jitter',
                    type: 'quantitative',
                    title: 'Pontuação Bechdel',
                    scale: { domain: [-0.2, 3.2] },
                    axis: {
                        values: [0, 1, 2, 3]
                    }
                },
                color: {
                    field: 'score',
                    type: 'ordinal',
                    legend: null,
                    scale: {
                        domain: [0, 1, 2, 3],
                        range: ['#7A2E2E', '#9A958C', '#AA7C11', '#D4AF37']
                    }
                },
                tooltip: [
                    { field: 'film', title: 'Filme' },
                    { field: 'year', title: 'Ano' },
                    { field: 'score', title: 'Pontuação Bechdel' }
                ]
            },
            width: 850,
            height: 320
            // title: {
            //     text: 'Evolução Histórica do Teste de Bechdel (Vencedores de Melhor Filme)'
            // }
        }
    }
})()

function atualizarStatsDoHeader(dadosProntos) {
    // 1. Calcular Anos Analisados (Diferença entre o maior e menor ano de cerimônia)
    const anos = dadosProntos.map(d => d.year_ceremony).filter(Boolean)
    const minAno = Math.min(...anos)
    const maxAno = Math.max(...anos)
    const totalAnos = maxAno - minAno + 1

    // 2. Calcular Filmes Únicos (Baseado no título ou id único do filme)
    const filmesUnicos = new Set(dadosProntos.map(d => d.film || d.titulo)).size

    // 3. Selecionar os elementos do DOM pelos textos explicativos correspondentes
    const statsElements = document.querySelectorAll('.page-stats .stat')

    statsElements.forEach(stat => {
        const label = stat.querySelector('span').innerText.toLowerCase()
        const bTag = stat.querySelector('b')

        if (label.includes('anos analisados')) {
            bTag.setAttribute('data-count', totalAnos)
            bTag.innerText = totalAnos
        } else if (label.includes('filmes únicos')) {
            bTag.setAttribute('data-count', filmesUnicos)
            bTag.innerText = filmesUnicos
        }
    })
}
