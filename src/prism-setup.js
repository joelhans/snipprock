// Ensure Prism is available globally before any components (like Mantle CodeBlock)
// that expect a global Prism run.
import PrismCore from 'prismjs'

// Attach to globalThis so libraries that look for a global Prism can find it
// eslint-disable-next-line no-undef
globalThis.Prism = PrismCore

// Load a reasonable set of languages used by this app
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
