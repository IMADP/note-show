import { Markdown } from '@/lib/markdown'
import type { Page } from '@/store/use-app-store'

export function PageView({ page }: { page: Page }) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <Markdown source={page.content} />
      </article>
    </div>
  )
}
