import React from 'react'

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-pulse ${className}`}>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-6 bg-slate-200 rounded-full w-16" />
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
        <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-10 bg-slate-200 rounded-xl w-28" />
        <div className="h-10 bg-slate-200 rounded-xl w-20" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-slate-200" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
            <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
          </div>
          <div className="h-6 bg-slate-200 rounded-full w-16" />
        </div>
      ))}
    </div>
  )
}
