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
        const output = {} as any
        let qs = 0
        let i = 1
        for (const q of result.questions) {
          const key = `question${i++}`
          let j = 1
          try {
            let correct = 0
            output[key] = {
              ...q,
              text: md.renderInline(q.text),
              answers: {}
            }
            for (const a of q.answers) {
              output[key].answers[`answer${j++}`] = {
                ...a,
                text: md.renderInline(a.text),
                correct: !!a.correct
              }
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
        await props.import(output)
      },
      'Done importing questions!'
    )
  }, [])
  return (
    <form onSubmit={submit}>
      <Box>
        <TextArea ref={ref} />
        <Box margin={{ top: 'xsmall' }}>
          <Button disabled={running} type="submit" label="Import" />
        </Box>
      </Box>
    </form>
  )
}

export default QuizImporter
