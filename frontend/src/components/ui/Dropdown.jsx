import React from 'react'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

export default function Dropdown({
  trigger,
  children,
  align = 'right', // left, right
  className = '',
}) {
  const alignments = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  }

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <div>
        <MenuButton className="inline-flex justify-center items-center rounded-lg focus:outline-none cursor-pointer">
          {trigger}
        </MenuButton>
      </div>

      <MenuItems
        transition
        className={`absolute mt-1.5 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg focus:outline-none z-30 transition-all duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 ${alignments[align]}`}
      >
        {children}
      </MenuItems>
    </Menu>
  )
}

export function DropdownItem({
  children,
  onClick,
  color = 'default', // default, danger, success
  leftSection,
  ...props
}) {
  const colorClasses = {
    default: 'text-slate-700 data-[focus]:bg-slate-50 data-[focus]:text-slate-900',
    danger: 'text-rose-600 data-[focus]:bg-rose-50 data-[focus]:text-rose-800',
    success: 'text-emerald-600 data-[focus]:bg-emerald-50 data-[focus]:text-emerald-800',
  }

  return (
    <MenuItem>
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-left transition-colors focus:outline-none cursor-pointer ${colorClasses[color]}`}
        {...props}
      >
        {leftSection && <span className="shrink-0 text-current">{leftSection}</span>}
        <span className="flex-1 min-w-0">{children}</span>
      </button>
    </MenuItem>
  )
}
