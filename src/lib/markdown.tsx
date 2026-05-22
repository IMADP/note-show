import type { ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

const isExternalLink = (href: string | undefined) =>
  !!href && /^https?:\/\//i.test(href)

const components: ComponentProps<typeof ReactMarkdown>['components'] = {
  a({ href, children, ...rest }) {
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
}

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={components}
    >
      {source}
    </ReactMarkdown>
  )
}
