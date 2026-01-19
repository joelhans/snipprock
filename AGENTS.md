AGENTS.md — Snipprok project guide for future prompting

Purpose
- Fast reference to the app’s structure, key files, and important functions so agents can jump directly to the right place when implementing changes.

Overview
- App: Single‑page React app that stylizes and exports code snippets. UI built with ngrok’s Mantle, styling via Tailwind. Syntax highlighting via Prism. PNG export renders via satori + resvg‑wasm (WASM).
- Dev: Vite + React. Dark theme is forced on load and via Mantle ThemeProvider.
- Run scripts (see package.json):
  - pnpm dev — start dev server
  - pnpm build — production build
  - pnpm preview — preview build
- Docker: Multi‑stage build to nginx (see Dockerfile, README.md for usage).

Tech stack
- React 18, Vite, Tailwind (via @tailwindcss/vite), Mantle UI (@ngrok/mantle), PrismJS, satori (SVG renderer), @resvg/resvg‑wasm (SVG→PNG), date‑fns. Fonts: JetBrains Mono (served from public/fonts with CDN fallbacks).

File map (top level)
- index.html — App shell; forces dark theme pre‑paint and loads src/main.jsx.
- vite.config.ts — React + Tailwind plugins.
- README.md — Basics, Docker notes.
- PROMPT.md — Phase plan/spec and goals.
- Dockerfile, .dockerignore — Containerization.
- package.json — deps and scripts.
- public/fonts — JetBrains Mono (TTF/WOFF2) + README.
- src/ — App source.

src/
- main.jsx — App entry and Mantle theme setup.
- App.jsx — Main UI, state, and PNG export pipeline.
- prism-setup.js — Global Prism init + language components.
- polyfills.js — Minimal browser polyfills for Node‑style globals.
- index.css — Tailwind import + default mono font stack.

Key components and functions

src/main.jsx
- Imports polyfills, Mantle CSS, Tailwind CSS, and prism-setup.js so Prism is globally available before Mantle’s CodeBlock renders.
- ThemeProvider from @ngrok/mantle/theme wraps the app.
- ForceDark()
  - const [, setTheme] = useTheme()
  - useEffect(() => setTheme('dark')) to force dark mode at runtime (defensive try/catch).
- ReactDOM.createRoot(...).render(<ThemeProvider><ForceDark /><App /></ThemeProvider>)

src/App.jsx
Top‑level constants/utilities
- defaultCode — Initial YAML snippet displayed in editor.
- langAlias (object) + mapLanguage(l)
  - Normalizes various language names/aliases to Prism grammar keys (e.g., js→javascript, yml→yaml, html/xml→markup).

Prism loading
- prismReady (module flag)
- ensurePrismLanguages()
  - Sets globalThis.Prism = PrismCore and dynamically imports a set of common Prism language components once per session.

Color + style helpers (export pipeline)
- normalizeCssColor(input)
  - Uses a 2D canvas context to normalize any CSS color (including oklch/display‑p3 where supported) to a standardized string (#rrggbb or rgba()). Returns a safe fallback on errors.
- buildTokenColorMap(snippetEl)
  - Inspects the actual rendered code element to compute token colors that match current Mantle/Prism theme. Injects hidden spans with token classes under the code element, reads computed color for each token type, then removes the container. Returns { colors, defaultColor }.
- readMantleCodeBlockStyles(snippetEl)
  - Reads computed styles from Mantle’s CodeBlock (Root/Body/pre) to capture inner paddings, border color/width/radius, and background color. Returns a plain object of numeric paddings and normalized colors.

Token processing
- flattenTokensToLines(tokens)
  - Converts Prism token list into an array of lines, each line being an array of segments: { text, types }. Splits on newlines, deduplicates/merges token types, and trims trailing empty lines to match visual rendering.
- preserveSpaces(s)
  - Replaces tabs with two spaces and spaces with NBSP so whitespace is preserved in satori rendering.

Font loading
- fetchFontData()
  - Attempts to fetch a TTF font as ArrayBuffer. Order: local /fonts/JetBrainsMono-Regular.ttf, then two CDN fallbacks. Returns first successful ArrayBuffer or null.

Main component: export default function App()
State
- code (string), lang (string)
- fontSize (number, px)
- background (CSS color string)
- borderWidth (number, px)
- padding (number, px)
- scale (string for 1/2/3 used as PNG pixel ratio)
- languages = useMemo(() => Array.from(supportedLanguages), []) from Mantle CodeBlock.

Color selection for segments
- colorForTypes(types, colors, defaultColor)
  - Priority‑based lookup favoring atrule/keyword/tag/etc.; falls back to first matched known token type, else defaultColor.

PNG export pipeline
- handleDownload()
  - Ensures document fonts are ready.
  - await ensurePrismLanguages().
  - Build token colors with buildTokenColorMap(el) and Mantle computed styles via readMantleCodeBlockStyles(el), where el = #snippet container.
  - Resolve Prism grammar from lang via mapLanguage; tokenize with PrismCore.tokenize(code, grammar). Flatten tokens to lines with flattenTokensToLines.
  - Measure DOM size of #snippet (rect.width/height) to match on‑screen dimensions for 1x export.
  - Build a React‑like tree describing outer wrapper (background, border, padding) and inner code area (Mantle bg/border/paddings). Each line renders as a row of spans with computed colors via colorForTypes.
  - Dynamically import satori and @resvg/resvg‑wasm. Initialize resvg WASM once using resvgWasmUrl (imported as ?url so Vite bundles it).
  - Load font bytes via fetchFontData() and supply to satori as a JetBrains Mono font.
  - Generate SVG (satori), then rasterize to PNG with new Resvg(svg, { fitTo: { mode: 'zoom', value: pixelRatio } }).asPng().
  - Create a Blob URL and trigger browser download.
- triggerDownload(url, pixelRatio)
  - Uses date‑fns format(new Date(), 'yyyy-MM-dd') to produce filename: snipprok-YYYY-MM-DD[@{ratio}x].png.

UI structure (JSX)
- Left control panel (<aside>):
  - Language (Mantle Select; values from supportedLanguages)
  - Font size (Mantle Input number)
  - Background color (native input[type=color], styled)
  - Border width (Mantle Input number)
  - Padding (Mantle Input number)
  - Scale (Mantle Select: 1x/2x/3x)
- Right content:
  - Code editor (Mantle TextArea appearance="monospaced") bound to state.
  - Preview section:
    - Outer <div id="snippet"> reflects background, borderWidth, padding, font settings.
    - Mantle CodeBlock composition: <CodeBlock.Root><CodeBlock.Body><CodeBlock.Code language={lang} value={code} /></CodeBlock.Body></CodeBlock.Root>
- Header with title and a Mantle Button to trigger handleDownload().

Notes vs. PROMPT.md
- README says PNG export implemented; code uses satori + resvg‑wasm instead of html2canvas (PROMPT Phase 4 example dependency). The export matches current on‑screen size (at 1x) and supports scale multipliers.
- Phase 6 (UX changes like merging input and preview, left panel full‑screen, removing border width control) is not yet reflected in code. Current app has a left panel and keeps a border width control.

src/prism-setup.js
- globalThis.Prism = PrismCore; statically imports common language components so Mantle CodeBlock can highlight immediately at runtime.

src/polyfills.js
- Minimal Node‑style globals for browser: process.env.NODE_ENV (from import.meta.env), process.versions, and global alias.

index.html
- Preconnect/dns‑prefetch to assets.ngrok.com (Mantle assets).
- Inline script forces dark theme before first paint to avoid flash.

vite.config.ts
- Plugins: react(), tailwindcss(). No custom asset handling beyond defaults.

CSS & fonts
- src/index.css imports Tailwind. Defines --font-mono and sets it on body and code‑related elements, using JetBrains Mono (loaded via Google Fonts and a local copy in public/fonts).

Public assets
- public/fonts/JetBrainsMono-Regular.ttf (primary for satori), JetBrainsMono-Regular.woff2, README.txt.

Where to edit for common tasks
- Change default theme: src/main.jsx (ForceDark) and index.html boot script.
- Add/remove style controls: src/App.jsx (state, controls JSX, style application in #snippet and in satori tree).
- Change export behavior (size, quality, fonts): src/App.jsx (handleDownload, fetchFontData, readMantleCodeBlockStyles, buildTokenColorMap, satori/resvg config).
- Add a new language alias: src/App.jsx (langAlias + ensure that Prism component is imported; prism-setup.js or ensurePrismLanguages list).
- Tweak syntax highlighting theme: Adjust Mantle theme or override CSS; buildTokenColorMap reads computed styles so exports stay in sync.

Gotchas
- satori requires TTF/OTF fonts (not WOFF2); fetchFontData prioritizes local TTF under /public/fonts.
- resvg‑wasm must be initialized with the ?url resource (resvgWasmUrl) before first use.
- Export size uses the live DOM #snippet box; ensure it reflects desired dimensions prior to exporting.
- Prism languages must be loaded before tokenizing; ensure ensurePrismLanguages() runs before tokenize in handleDownload().

Quick references
- Export container selector: #snippet
- Mantle CodeBlock composition used: Root → Body → Code
- supportedLanguages source: import { supportedLanguages } from '@ngrok/mantle/code-block'

End of AGENTS.md
