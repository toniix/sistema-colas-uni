import React from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

export default function Modal({
  opened,
  onClose,
  title,
  children,
  size = 'md', // sm, md, lg, xl
  centered = true,
}) {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <Dialog open={opened} onClose={onClose} className="relative z-50" transition>
      {/* Backdrop */}
      <DialogBackdrop 
        transition
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out data-[closed]:opacity-0" 
      />

      {/* Container */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4 overflow-y-auto">
        <DialogPanel 
          transition
          className={`w-full ${maxWidths[size]} rounded-2xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col gap-4 transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0`}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-bold text-slate-800 tracking-wide">
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="text-sm text-slate-600 leading-relaxed">
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
