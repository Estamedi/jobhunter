import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileText, Loader2, Sparkles } from 'lucide-react'

const STEPS = [
  'Uploading your CV',
  'Reading the document',
  'Finding your experience',
  'Collecting education and skills',
  'Structuring your profile',
]

const STEP_MS = 5000

export function ImportProgress({ fileName }: { fileName?: string }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => Math.min(i + 1, STEPS.length - 1)),
      STEP_MS
    )
    return () => clearInterval(id)
  }, [])

  return (
    <div className='flex flex-col items-center gap-6 py-6' aria-live='polite'>
      <div className='relative flex h-32 w-28 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 shadow-sm'>
        <FileText className='h-14 w-14 text-muted-foreground/60' />
        <motion.div
          className='absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-primary/30 to-transparent'
          initial={{ top: '-30%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className='absolute inset-x-0 h-0.5 bg-primary'
          initial={{ top: '0%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className='absolute text-primary'
            style={{ top: `${15 + i * 25}%`, right: `${8 + i * 6}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
            }}
          >
            <Sparkles className='h-3.5 w-3.5' />
          </motion.span>
        ))}
      </div>

      <div className='text-center'>
        <p className='font-semibold'>Analyzing your CV…</p>
        <p className='text-sm text-muted-foreground'>
          {fileName ? `${fileName} · ` : ''}This can take up to a minute. Please
          keep this window open.
        </p>
      </div>

      <div className='h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted'>
        <motion.div
          className='h-full w-1/3 rounded-full bg-primary'
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <ul className='w-full max-w-sm space-y-2'>
        {STEPS.map((label, i) => {
          const done = i < active
          const current = i === active
          return (
            <li
              key={label}
              className={`flex items-center gap-3 text-sm transition-opacity ${
                i > active ? 'opacity-40' : ''
              }`}
            >
              <span className='flex h-5 w-5 items-center justify-center'>
                <AnimatePresence mode='wait' initial={false}>
                  {done ? (
                    <motion.span
                      key='done'
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                    >
                      <Check className='h-3 w-3' />
                    </motion.span>
                  ) : current ? (
                    <Loader2
                      key='current'
                      className='h-4 w-4 animate-spin text-primary'
                    />
                  ) : (
                    <span
                      key='todo'
                      className='h-2 w-2 rounded-full bg-muted-foreground/40'
                    />
                  )}
                </AnimatePresence>
              </span>
              <span className={current ? 'font-medium' : ''}>{label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
