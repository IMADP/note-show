import type { ComponentProps, ReactElement } from 'react'
import { isValidElement, useMemo, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { createHighlighterCoreSync, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

import githubLight from 'shiki/themes/github-light.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'

import bash from 'shiki/langs/bash.mjs'
import css from 'shiki/langs/css.mjs'
import diff from 'shiki/langs/diff.mjs'
import go from 'shiki/langs/go.mjs'
import html from 'shiki/langs/html.mjs'
import java from 'shiki/langs/java.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import jsx from 'shiki/langs/jsx.mjs'
import markdown from 'shiki/langs/markdown.mjs'
import python from 'shiki/langs/python.mjs'
import rust from 'shiki/langs/rust.mjs'
import sql from 'shiki/langs/sql.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import xml from 'shiki/langs/xml.mjs'
import yaml from 'shiki/langs/yaml.mjs'

/*
 * Sync Shiki highlighter, called directly from the <pre> override below.
 *
 * react-markdown processes plugins via unified's synchronous runSync(), so
 * any async rehype plugin throws. We sidestep rehype-pretty-code entirely:
 * the highlighter is built up-front with statically-imported themes and
 * grammars on Shiki's JS regex engine (no WASM, no async), and codeToHtml()
 * runs synchronously inside the React component.
 *
 * Languages outside this list render as plain text.
 */
const highlighter: HighlighterCore = createHighlighterCoreSync({
  themes: [githubLight, githubDark],
  langs: [
    bash,
    css,
    diff,
    go,
    html,
    java,
    javascript,
    json,
    jsx,
    markdown,
    python,
    rust,
    sql,
    tsx,
    typescript,
    xml,
    yaml,
  ],
  engine: createJavaScriptRegexEngine({ forgiving: true }),
})

const loadedLangs = new Set(highlighter.getLoadedLanguages())

const isExternalLink = (href: string | undefined) =>
  !!href && /^https?:\/\//i.test(href)

const isMailtoLink = (href: string | undefined) =>
  !!href && /^mailto:/i.test(href)

type CodeChildProps = {
  className?: string
  children?: string
}

function CodeBlock({ children }: ComponentProps<'pre'>) {
  // react-markdown renders fenced code as <pre><code class="language-foo">...</code></pre>.
  // The <code> element is the single child of pre.
  const codeChild: ReactElement<CodeChildProps> | null =
    isValidElement<CodeChildProps>(children) ? children : null
  const codeProps = codeChild?.props
  const className = codeProps?.className ?? ''
  const rawLang = className.replace(/^language-/, '')
  const lang = rawLang && loadedLangs.has(rawLang) ? rawLang : 'plaintext'
  const code = String(codeProps?.children ?? '').replace(/\n$/, '')

  const html = useMemo(
    () =>
      highlighter.codeToHtml(code, {
        lang,
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
      }),
    [code, lang],
  )

  const wrapperRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = wrapperRef.current?.querySelector('code')?.textContent ?? code
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className="code-block" data-lang={lang}>
      <div ref={wrapperRef} dangerouslySetInnerHTML={{ __html: html }} />
      <button
        type="button"
        className="code-block-copy"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

const components: ComponentProps<typeof ReactMarkdown>['components'] = {
  a({ href, children, ...rest }) {
    if (isMailtoLink(href)) {
      // GFM autolinks emails. We want bare URLs autolinked but not emails.
      return <>{children}</>
    }
    if (isExternalLink(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
          {children}
        </a>
      )
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
  pre: CodeBlock,
}

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {source}
    </ReactMarkdown>
  )
}
