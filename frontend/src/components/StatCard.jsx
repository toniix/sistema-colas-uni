import React, { useEffect, useState } from 'react'
import Card from './ui/Card'

export default function StatCard({ label, value, unit, icon: Icon, color = 'indigo' }) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    // Basic counter animation for numbers
    if (typeof value === 'number') {
      let start = 0
      const end = value
      if (start === end) return
      
      const duration = 800
      const increment = Math.ceil(end / (duration / 16))
      
      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          clearInterval(timer)
          setAnimatedValue(end)
        } else {
          setAnimatedValue(start)
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [value])

  const colorVariants = {
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-sky-50 text-sky-600',
    red: 'bg-rose-50 text-rose-600',
    teal: 'bg-indigo-50 text-indigo-600',
  }

  const displayValue = typeof value === 'number' ? animatedValue : value

  return (
    <Card padding="md" className="hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-2 tracking-tight">
            {displayValue}
            {unit && (
              <span className="text-xs font-semibold text-slate-400 ml-1">
                {unit}
              </span>
            )}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl transition-all duration-300 ${colorVariants[color] || colorVariants.indigo}`}>
            <Icon className="w-5.5 h-5.5" stroke={1.8} />
          </div>
        )}
      </div>
    </Card>
  )
}
