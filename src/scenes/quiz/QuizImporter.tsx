import MarkdownIt from 'markdown-it'
import toml from 'toml'
import { Box, TextArea, Button } from 'grommet'
import React, { useCallback, useRef } from 'react'
import { useActionRunner } from '../../core/ui'
import { VError } from 'verror'
const md = MarkdownIt({ html: true })

export function QuizImporter(props: { import: (data: any) => Promise<any> }) {
  const [running, run] = useActionRunner()
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const submit = useCallback(e => {
    e.preventDefault()
    run(
      'import questions',
      async () => {
        const result = toml.parse(ref.current!.value)
        let qs = 0
        for (const key of Object.keys(result)) {
          try {
            const q = result[key]
            let correct = 0
            q.text = md.renderInline(q.text)
            for (const a of q.answers) {
              a.text = md.renderInline(a.text)
              if (a.correct) correct++
            }
            if (!correct) {
              throw new Error('No correct answer!')
            }
          } catch (e) {
            throw new VError(e, 'Cannot process question "%s"', key)
          }
          qs++
        }
        if (!qs) {
          throw new Error('No questions found.')
        }
        await props.import(result)
      },
      'Done importing questions!'
    )
  }, [])
  return (
    <form onSubmit={submit}>
      <Box>
        <TextArea ref={ref} />
        <Button disabled={running} type="submit" label="Import" />
      </Box>
    </form>
  )
}

export default QuizImporter
