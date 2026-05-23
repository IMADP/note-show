import { Markdown } from '@/lib/markdown'
import type { Page } from '@/store/use-app-store'

export function PageView({ page }: { page: Page }) {
  return (
    <div className="note-prose-surface h-full overflow-y-scroll">
      <article className="note-prose prose prose-neutral dark:prose-invert relative w-full max-w-none px-8 py-10">
        <Markdown source={page.content} />
      </article>
    </div>
  )
}
