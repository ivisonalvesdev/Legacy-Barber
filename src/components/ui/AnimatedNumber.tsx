import { useState, useEffect } from 'react'

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
}

export function AnimatedNumber({ value, prefix = '', suffix = '' }: AnimatedNumberProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let start: number | undefined
    const duration = 1400
    const step = (ts: number) => {
      if (start === undefined) start = ts
      const prog = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - prog, 4)
      setCurrent(Math.round(value * ease))
      if (prog < 1) requestAnimationFrame(step)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [value])

  return <>{prefix}{current.toLocaleString('pt-BR')}{suffix}</>
}
