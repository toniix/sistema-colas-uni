import React from 'react'
import { Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
