import React, { useMemo, useState } from 'react'
import { TextArea } from '@ngrok/mantle/text-area'
import { CodeBlock, supportedLanguages } from '@ngrok/mantle/code-block'
import { Select } from '@ngrok/mantle/select'
import { Label } from '@ngrok/mantle/label'
import { Input } from '@ngrok/mantle/input'
import { Button } from '@ngrok/mantle/button'
import { format } from 'date-fns'
import PrismCore from 'prismjs'
// URL for the WASM binary so Vite bundles it correctly
import resvgWasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url'

const defaultCode = `# Try editing this YAML or paste your own\nname: Snipprok\nfeatures:\n  - syntax highlighting\n  - YAML by default\n  - Mantle UI\n`

const langAlias = {
  html: 'markup',
  xml: 'markup',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  json: 'json',
  jsx: 'jsx',
  tsx: 'tsx',
  css: 'css',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  shell: 'bash',
  python: 'python',
  py: 'python',
  ruby: 'ruby',
  rb: 'ruby',
  go: 'go',
  rust: 'rust',
  text: 'markup',
  plain: 'markup',
  plaintext: 'markup',
  txt: 'markup',
}

function mapLanguage(l) {
  return langAlias[l] || l || 'markup'
}

let prismReady = false
async function ensurePrismLanguages() {
  if (prismReady) return
  // Make Prism available to component modules that expect a global
  // eslint-disable-next-line no-undef
  globalThis.Prism = PrismCore
  await Promise.all([
    import('prismjs/components/prism-markup'),
    import('prismjs/components/prism-css'),
    import('prismjs/components/prism-clike'),
    import('prismjs/components/prism-javascript'),
    import('prismjs/components/prism-typescript'),
    import('prismjs/components/prism-jsx'),
    import('prismjs/components/prism-tsx'),
    import('prismjs/components/prism-json'),
    import('prismjs/components/prism-yaml'),
    import('prismjs/components/prism-bash'),
    import('prismjs/components/prism-python'),
    import('prismjs/components/prism-ruby'),
    import('prismjs/components/prism-go'),
    import('prismjs/components/prism-rust'),
  ])
  prismReady = true
}

// Robust color normalizer using canvas (handles oklch/display-p3 -> sRGB rgba/hex)
let __colorCtx = null
function normalizeCssColor(input) {
  try {
    if (!__colorCtx) {
      const c = document.createElement('canvas')
      c.width = c.height = 1
      __colorCtx = c.getContext('2d')
    }
    const ctx = __colorCtx
    // Reset to a sentinel, then set to input. If invalid, it won't change.
    ctx.fillStyle = '#000000'
    ctx.fillStyle = String(input || '')
    const parsed = ctx.fillStyle
    // parsed is standardized (e.g., 'rgba(r, g, b, a)' or '#rrggbb')
    return parsed || 'rgba(0, 0, 0, 0)'
  } catch {
    return String(input || '')
  }
}

function buildTokenColorMap(snippetEl) {
  // Use the actual code element so token styles match Mantle/Prism selectors
  const codeEl = snippetEl.querySelector('pre code, code') || snippetEl

  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.visibility = 'hidden'
  container.style.pointerEvents = 'none'
  container.style.inset = '0'

  const tokenTypes = [
    'comment','punctuation','operator','keyword','atrule','string','number','boolean','function','class-name','attr-name','attr-value','tag','property','symbol','regex','important','char','builtin','constant','namespace','parameter','variable','key'
  ]
  const colors = {}
  tokenTypes.forEach((t) => {
    const span = document.createElement('span')
    span.className = `token ${t}`
    span.textContent = 'x'
    container.appendChild(span)
  })
  codeEl.appendChild(container)
  const spans = Array.from(container.children)
  spans.forEach((span, i) => {
    const t = tokenTypes[i]
    const c = getComputedStyle(span).color
    colors[t] = normalizeCssColor(c)
  })
  const defaultColor = normalizeCssColor(getComputedStyle(codeEl).color)
  container.remove()
  return { colors, defaultColor }
}

function readMantleCodeBlockStyles(snippetEl) {
  const preEl = snippetEl.querySelector('pre')
  const bodyEl = preEl?.parentElement || null // CodeBlock.Body
  const rootEl = bodyEl?.parentElement || preEl?.parentElement || snippetEl // CodeBlock.Root
  const preStyle = preEl ? getComputedStyle(preEl) : null
  const rootStyle = rootEl ? getComputedStyle(rootEl) : null
  const px = (v) => (v ? parseFloat(v) || 0 : 0)
  const parseRadius = (v) => {
    if (!v) return 8
    const first = String(v).split(/[\s\/]/)[0]
    const n = parseFloat(first)
    return Number.isFinite(n) ? n : 8
  }
  return {
    // inner pre paddings
    paddingTop: preStyle ? px(preStyle.paddingTop) : 16,
    paddingRight: preStyle ? px(preStyle.paddingRight) : 16,
    paddingBottom: preStyle ? px(preStyle.paddingBottom) : 16,
    paddingLeft: preStyle ? px(preStyle.paddingLeft) : 16,
    // root border & bg (normalized to rgb/rgba)
    codeBg: normalizeCssColor(rootStyle ? rootStyle.backgroundColor : 'transparent'),
    codeBorderColor: normalizeCssColor(rootStyle ? rootStyle.borderLeftColor : 'transparent'),
    codeBorderWidth: rootStyle ? px(rootStyle.borderLeftWidth || rootStyle.borderTopWidth) : 1,
    codeBorderRadius: parseRadius(rootStyle ? rootStyle.borderRadius : '0.75rem'),
  }
}

function flattenTokensToLines(tokens) {
  const lines = [[]]
  function mergeTypes(type, alias) {
    const arr = []
    if (type) arr.push(type)
    if (alias) {
      if (Array.isArray(alias)) arr.push(...alias)
      else arr.push(alias)
    }
    // De-duplicate while preserving order
    return Array.from(new Set(arr))
  }
  function walk(token, types) {
    if (typeof token === 'string') {
      const parts = token.split('\n')
      parts.forEach((part, idx) => {
        if (idx > 0) lines.push([])
        if (part.length) lines[lines.length - 1].push({ text: part, types })
      })
    } else if (typeof token.content === 'string') {
      const merged = mergeTypes(token.type, token.alias)
      walk(token.content, merged)
    } else if (Array.isArray(token.content)) {
      const merged = mergeTypes(token.type, token.alias)
      token.content.forEach((t) => walk(t, merged))
    }
  }
  tokens.forEach((t) => walk(t, typeof t === 'string' ? [] : mergeTypes(t.type, t.alias)))
  // Trim trailing empty lines (no segments) to match visual rendering
  while (lines.length > 1 && lines[lines.length - 1].length === 0) {
    lines.pop()
  }
  return lines
}

function preserveSpaces(s) {
  return s.replace(/\t/g, '  ').replace(/ /g, '\u00A0')
}

// ngrok-style linear gradient (matches homepage gradient)
// Returns a CSS linear-gradient string for use in backgroundImage
const NGROK_GRADIENT = 'linear-gradient(98deg, #f59e0b 1.35%, #a3e635 18.48%, #34d399 38.35%, #0ea5e9 58.63%, #a855f7 79.7%, #f43f5e 100%)'

// SVG filter for soft gradient blur (similar to ngrok's gradient-blur filter)
function GradientBlurFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="gradient-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
        </filter>
      </defs>
    </svg>
  )
}

async function fetchFontData() {
  // Prefer a local TTF to satisfy satori's font parser
  const localTtf = '/fonts/JetBrainsMono-Regular.ttf'
  const cdnTtf = 'https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf/JetBrainsMono-Regular.ttf'
  // Additional fallback through jsdelivr npm mirror (fontsource)
  const cdnTtf2 = 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.21/files/jetbrains-mono-latin-400-normal.ttf'

  const tryFetch = async (url) => {
    try {
      const resp = await fetch(url, { mode: 'cors' })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      return await resp.arrayBuffer()
    } catch (e) {
      return null
    }
  }

  return (
    (await tryFetch(localTtf)) ||
    (await tryFetch(cdnTtf)) ||
    (await tryFetch(cdnTtf2))
  )
}

// Ensure resvg wasm is initialized once per session
let resvgInitialized = false

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

// Shared style constants for UI and export
const CODE_BLOCK_BG = 'rgb(23, 23, 23)'
const CODE_BLOCK_BORDER_COLOR = 'rgb(64, 64, 64)'
const CODE_BLOCK_BORDER_RADIUS = 12 // rounded-xl
const CODE_BLOCK_PADDING = 24 // p-6
const GRADIENT_WIDTH = '90%'
const GRADIENT_OPACITY = 0.15

export default function App() {
  const [code, setCode] = useState(defaultCode)
  const [lang, setLang] = useState('yaml')

  // Stylization controls
  const [fontSize, setFontSize] = useState(13)
  const [background, setBackground] = useState('#121212')
  const [padding, setPadding] = useState(48)
  const [scale, setScale] = useState('2') // 1x, 2x, 3x
  const [width, setWidth] = useState(640) // px width of the snippet

  // Edit-friendly string states to allow empty while typing
  const [widthInput, setWidthInput] = useState(String(width))
  const [paddingInput, setPaddingInput] = useState(String(padding))

  const languages = useMemo(() => Array.from(supportedLanguages), [])

  function colorForTypes(types, colors, defaultColor) {
    // Prefer atrule/keyword/tag when present; otherwise first matching known token
    const priority = ['atrule','keyword','tag','function','class-name','property','attr-name','attr-value','string','number','boolean','operator','comment','punctuation','variable','parameter','namespace','builtin','constant','symbol','regex','important','char','key']
    for (const p of priority) if (types?.includes(p) && colors[p]) return colors[p]
    if (types) {
      for (const t of types) if (colors[t]) return colors[t]
    }
    return defaultColor
  }

  function handleWidthChange(e) {
    const v = e.target.value
    setWidthInput(v)
    if (v === '') return
    const n = Number(v)
    if (Number.isFinite(n)) {
      const c = clamp(Math.round(n), 320, 1600)
      setWidth(c)
    }
  }

  function handleWidthBlur() {
    if (widthInput === '') {
      setWidthInput(String(width))
      return
    }
    const n = Number(widthInput)
    if (!Number.isFinite(n)) {
      setWidthInput(String(width))
      return
    }
    const c = clamp(Math.round(n), 320, 1600)
    setWidth(c)
    setWidthInput(String(c))
  }

  function handlePaddingChange(e) {
    const v = e.target.value
    setPaddingInput(v)
    if (v === '') return
    const n = Number(v)
    if (Number.isFinite(n)) {
      const c = clamp(Math.round(n), 0, 96)
      setPadding(c)
    }
  }

  function handlePaddingBlur() {
    if (paddingInput === '') {
      setPaddingInput(String(padding))
      return
    }
    const n = Number(paddingInput)
    if (!Number.isFinite(n)) {
      setPaddingInput(String(padding))
      return
    }
    const c = clamp(Math.round(n), 0, 96)
    setPadding(c)
    setPaddingInput(String(c))
  }

  async function handleDownload() {
    const el = document.getElementById('snippet')
    if (!el) return

    try {
      // Ensure web fonts are loaded (JetBrains Mono from page CSS)
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }

      // Load Prism and grammars dynamically and set global
      await ensurePrismLanguages()

      // Build token colors from current theme (read from actual code element)
      const { colors, defaultColor } = buildTokenColorMap(el)

      // Read Mantle CodeBlock computed styles (bg, border, padding)
      const mantle = readMantleCodeBlockStyles(el)

      // Resolve language and tokenize
      const prismLang = mapLanguage(lang)
      const grammar = PrismCore.languages[prismLang] || PrismCore.languages.markup
      const tokens = PrismCore.tokenize(code, grammar)
      const lines = flattenTokensToLines(tokens)

      // Determine export size deterministically, independent of DOM rounding
      const rect = el.getBoundingClientRect()
      const widthPx = Math.max(1, Math.ceil(rect.width))
      const lineHeight = 1.5
      const lineHeightPx = fontSize * lineHeight
      const outerPaddingV = padding * 2
      // Use our constant for inner padding (p-6 = 24px)
      const innerPaddingV = CODE_BLOCK_PADDING * 2
      const innerBorderV = 2 // 1px border top + bottom
      const contentV = lines.length * lineHeightPx
      const heightPx = Math.max(1, Math.ceil(outerPaddingV + innerPaddingV + innerBorderV + contentV))

      // Build a React-like tree for satori with layered gradient
      // Outer container with position relative for gradient positioning
      const tree = (
        React.createElement(
          'div',
          {
            style: {
              position: 'relative',
              width: widthPx,
              height: heightPx,
              backgroundColor: normalizeCssColor(background),
              color: defaultColor,
              padding,
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize,
              lineHeight,
              boxSizing: 'border-box',
              overflow: 'hidden',
            },
          },
          // Gradient layer (absolutely positioned, behind content)
          React.createElement(
            'div',
            {
              style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: GRADIENT_WIDTH,
                aspectRatio: '16 / 9',
                borderRadius: '100%',
                background: NGROK_GRADIENT,
                opacity: GRADIENT_OPACITY,
              },
            }
          ),
          // Code block container
          React.createElement(
            'div',
            {
              style: {
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: CODE_BLOCK_BG,
                color: defaultColor,
                borderRadius: CODE_BLOCK_BORDER_RADIUS,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: CODE_BLOCK_BORDER_COLOR,
                padding: CODE_BLOCK_PADDING,
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
              },
            },
            lines.map((segments, i) => (
              React.createElement(
                'div',
                { key: i, style: { display: 'flex', flexDirection: 'row', alignItems: 'baseline', minHeight: lineHeightPx } },
                segments.map((seg, j) => (
                  React.createElement(
                    'span',
                    { key: j, style: { color: colorForTypes(seg.types, colors, defaultColor) } },
                    preserveSpaces(seg.text || '')
                  )
                ))
              )
            ))
          )
        )
      )

      // Lazy-load satori & resvg-wasm
      const [{ default: satori }, { Resvg, initWasm }] = await Promise.all([
        import('satori'),
        import('@resvg/resvg-wasm'),
      ])

      // Initialize resvg wasm once
      if (!resvgInitialized) {
        await initWasm(resvgWasmUrl)
        resvgInitialized = true
      }

      // Load font bytes (TTF only; WOFF2 is not supported by satori's font parser)
      const fontData = await fetchFontData()
      if (!fontData) throw new Error('Failed to load font (TTF) for rendering')

      // Generate SVG with satori
      const svg = await satori(tree, {
        width: widthPx,
        height: heightPx,
        fonts: [
          {
            name: 'JetBrains Mono',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      })

      // Rasterize SVG to PNG with zoom
      const zoom = Number(scale) || 1
      const resvg = new Resvg(svg, {
        fitTo: { mode: 'zoom', value: zoom },
      })
      const pngData = resvg.render()
      const pngBuffer = pngData.asPng()

      const blob = new Blob([pngBuffer], { type: 'image/png' })
      const blobUrl = URL.createObjectURL(blob)
      triggerDownload(blobUrl, zoom)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('PNG export failed:', err)
      alert('PNG export failed. See console for details.')
    }
  }

  function triggerDownload(url, pixelRatio) {
    const a = document.createElement('a')
    const date = format(new Date(), 'yyyy-MM-dd')
    const suffix = pixelRatio > 1 ? `@${pixelRatio}x` : ''
    a.href = url
    a.download = `snipprok-${date}${suffix}.png`
    a.click()
  }

  return (
    <div className="h-screen bg-surface text-body grid grid-cols-[320px_1fr]">
      {/* SVG filter definition for gradient blur */}
      <GradientBlurFilter />

      {/* Left control panel */}
      <aside className="border-r border-border p-4 overflow-y-auto bg-surface/60">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Snipprok</h1>
            <p className="opacity-70">React Code Snippet Stylizer</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select.Root value={lang} onValueChange={setLang}>
              <Select.Trigger aria-label="Language">
                <Select.Value placeholder="Select language" />
              </Select.Trigger>
              <Select.Content width="content">
                {languages.map((l) => (
                  <Select.Item key={l} value={l}>{l}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="font-size">Font size (px)</Label>
            <Input
              id="font-size"
              type="number"
              min={8}
              max={48}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value) || 0)}
            />
          </div>

          {/* Background picker removed per request */}

          <div className="grid gap-2">
            <Label htmlFor="padding">Padding (px)</Label>
            <Input
              id="padding"
              type="number"
              min={0}
              max={96}
              value={paddingInput}
              onChange={handlePaddingChange}
              onBlur={handlePaddingBlur}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="width-number">Width (px)</Label>
            <Input
              id="width-number"
              type="number"
              min={320}
              max={1600}
              value={widthInput}
              onChange={handleWidthChange}
              onBlur={handleWidthBlur}
            />
            <input
              id="width-range"
              type="range"
              min={320}
              max={1600}
              step={10}
              value={width}
              onChange={(e) => { const val = Number(e.target.value) || width; setWidth(val); setWidthInput(String(val)); }}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scale">Scale</Label>
            <Select.Root value={scale} onValueChange={setScale}>
              <Select.Trigger aria-label="Scale">
                <Select.Value placeholder="Select scale" />
              </Select.Trigger>
              <Select.Content width="content">
                <Select.Item value="1">1x</Select.Item>
                <Select.Item value="2">2x</Select.Item>
                <Select.Item value="3">3x</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <Button appearance="primary" onClick={handleDownload} className="w-full">Download PNG</Button>
        </div>
      </aside>

      {/* Right content: merged editor + preview */}
      <main className="overflow-auto p-6">
        <div className="mx-auto" style={{ width }}>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <TextArea
                id="code"
                appearance="monospaced"
                rows={12}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here"
              />
            </div>

            {/* Snippet container with ngrok-style gradient */}
            <div
              id="snippet"
              className="relative overflow-hidden"
              style={{
                backgroundColor: background,
                padding: `${padding}px`,
                borderRadius: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                whiteSpace: 'pre',
              }}
            >
              {/* ngrok-style gradient blur layer */}
              <div
                className="pointer-events-none absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  width: GRADIENT_WIDTH,
                  maxWidth: '670px',
                  aspectRatio: '16 / 9',
                  borderRadius: '100%',
                  background: NGROK_GRADIENT,
                  opacity: GRADIENT_OPACITY,
                  filter: 'url(#gradient-blur)',
                  backfaceVisibility: 'hidden',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              {/* Code block (above gradient) */}
              <CodeBlock.Root
                className="relative rounded-xl border"
                style={{
                  backgroundColor: CODE_BLOCK_BG,
                  borderColor: CODE_BLOCK_BORDER_COLOR,
                }}
              >
                <CodeBlock.Body>
                  <CodeBlock.Code className="!p-6" language={lang} value={code} style={{ fontSize: `${fontSize}px` }} />
                </CodeBlock.Body>
              </CodeBlock.Root>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
