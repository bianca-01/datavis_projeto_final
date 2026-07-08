// ─────────────────────────────────────────────
//  tema-oscar.js
//  Tema escuro dourado para todos os gráficos
//  Vega-Lite do site "Decifrando o Oscar"
// ─────────────────────────────────────────────

const CORES = {
  fundo:         "transparent",
  dourado:       "#D4AF37",
  douradoClaro:  "#EFD06A",
  douradoEscuro: "#B8963A",
  vermelho:      "#7A2E2E",
  texto:         "#F2EFE9",
  textoSec:      "#D8D4CC",
  textoCinza:    "#9A958C",
  grade:         "#1E1C19",
  eixo:          "#2A2825",
  superficie:    "#171512",
}

// Paleta categórica para séries múltiplas
// (ex: categorias do Oscar, gêneros de filme)
const PALETA_CATEGORICA = [
  "#D4AF37",  // dourado   — série principal
  "#7A2E2E",  // vermelho  — série secundária
  "#3A6A9A",  // azul      — série terciária
  "#5C8A5C",  // verde     — série quaternária
  "#8A5C8A",  // roxo      — série quinária
  "#B8963A",  // âmbar     — série senária
]

// Paleta sequencial (ex: escala de vitórias, anos)
const PALETA_SEQUENCIAL = [
  "#3A3020",
  "#5A4A28",
  "#7A6030",
  "#9A7838",
  "#B8963A",
  "#D4AF37",
  "#EFD06A",
]

// ─────────────────────────────────────────────
//  Objeto de configuração principal
//  Passado como segundo argumento no vegaEmbed
// ─────────────────────────────────────────────

const temaOscar = {
  background: CORES.fundo,

  config: {

    // Fundo de cada view
    view: {
      background:  CORES.fundo,
      stroke:      "transparent",
    },

    // Eixos X e Y
    axis: {
      labelColor:      CORES.textoCinza,
      labelFontSize:   11,
      labelFont:       "Inter, sans-serif",
      titleColor:      CORES.textoSec,
      titleFontSize:   12,
      titleFont:       "Inter, sans-serif",
      titleFontWeight: 400,
      tickColor:       CORES.eixo,
      domainColor:     CORES.eixo,
      gridColor:       CORES.grade,
      gridOpacity:     0.6,
      gridDash:        [2, 4],
    },

    // Eixo X especificamente (sem grade vertical por padrão)
    axisX: {
      grid: false,
    },

    // Eixo Y especificamente (com grade horizontal)
    axisY: {
      grid: true,
    },

    // Legenda
    legend: {
      labelColor:      CORES.textoCinza,
      labelFontSize:   11,
      labelFont:       "Inter, sans-serif",
      titleColor:      CORES.textoSec,
      titleFontSize:   11,
      titleFont:       "Inter, sans-serif",
      titleFontWeight: 500,
      symbolOpacity:   0.9,
      padding:         6,
    },

    // Títulos de gráfico (se usados)
    title: {
      color:      CORES.texto,
      fontSize:   14,
      font:       "Playfair Display, serif",
      fontWeight: 500,
      anchor:     "start",
      offset:     12,
    },

    // Marks padrão por tipo
    bar: {
      fill:         CORES.dourado,
      opacity:      0.85,
      cornerRadius: 3,
    },

    line: {
      color:       CORES.dourado,
      strokeWidth: 2,
    },

    point: {
      color:   CORES.dourado,
      size:    50,
      opacity: 0.85,
    },

    circle: {
      color:   CORES.dourado,
      opacity: 0.85,
    },

    text: {
      color:    CORES.textoSec,
      fontSize: 11,
      font:     "Inter, sans-serif",
    },

    rule: {
      color: CORES.eixo,
    },

    // Tooltip
    tooltip: {
      theme: "dark",
    },

    // Escala de cores categórica padrão
    range: {
      category:   PALETA_CATEGORICA,
      ordinal:    PALETA_CATEGORICA,
      sequential: PALETA_SEQUENCIAL,
      ramp:       PALETA_SEQUENCIAL,
    },
  },
}


// ─────────────────────────────────────────────
//  Variantes pré-montadas pra casos específicos
// ─────────────────────────────────────────────

// Para gráficos com barras horizontais (ex: top filmes)
const temaOscarHorizontal = {
  ...temaOscar,
  config: {
    ...temaOscar.config,
    axisX: { grid: true  },
    axisY: { grid: false },
  },
}

// Para gráficos onde vencedores e indicados têm cores distintas
const coresCategoria = {
  vencedor: CORES.dourado,
  indicado: CORES.vermelho,
}

// Opções padrão pra vegaEmbed (esconde botões de exportar)
const opcoesEmbed = {
  actions:  false,
  renderer: "svg",
}


// ─────────────────────────────────────────────
//  Função auxiliar — renderiza qualquer spec
//  com o tema aplicado automaticamente
// ─────────────────────────────────────────────

/**
 * Renderiza um gráfico Vega-Lite com o tema Oscar.
 *
 * @param {string}  seletor  - Seletor CSS do elemento container
 * @param {object}  spec     - Spec Vega-Lite (objeto JS ou URL de .json)
 * @param {object}  extra    - Opções adicionais para o vegaEmbed (opcional)
 * @returns {Promise}        - Promise do vegaEmbed
 *
 */
async function renderGrafico(seletor, spec, extra = {}) {
  const tema = extra.tema ?? temaOscar
  delete extra.tema

  const specFinal = typeof spec === "string"
    ? spec   // URL — vegaEmbed busca o JSON
    : {
        ...spec,
        background: tema.background,
        config: {
          ...tema.config,
          ...(spec.config ?? {}),   // spec pode sobrescrever partes do tema
        },
      }

  return vegaEmbed(seletor, specFinal, {
    ...opcoesEmbed,
    ...extra,
  })
}

function renderTodosGraficos(seletor = ".grafico") {
  document.querySelectorAll(seletor).forEach(el => {
    const specUrl = el.dataset.spec
    if (!specUrl) return
    renderGrafico(`#${el.id}`, specUrl)
  })
}