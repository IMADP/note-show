import aiInstructions from './ai-instructions.md?raw'

export function AiRoute() {
  return (
    <pre
      style={{
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        padding: '2rem',
        margin: 0,
      }}
    >
      {aiInstructions}
    </pre>
  )
}
