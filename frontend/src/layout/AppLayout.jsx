import React, { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  IconLogout, 
  IconMenu2, 
  IconX,
  IconChevronRight,
  IconAlertTriangle
} from '@tabler/icons-react'
import { useAuth } from '../auth/AuthContext'
import { ROL_LABEL } from '../lib/constants'
import { NAV } from './navConfig'
import Brand from '../components/Brand'
import Dropdown, { DropdownItem } from '../components/ui/Dropdown'
import { useNotification } from '../hooks/useNotification'

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const items = NAV[user.rol] || []
  const initials = user.nombre
    ? user.nombre
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : 'U'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const universityName = import.meta.env.VITE_UNIVERSITY_NAME || 'Universidad Nacional'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="sm:hidden text-slate-500 hover:text-slate-700 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <IconMenu2 className="w-6 h-6" />
          </button>
          <div className="sm:hidden">
            <Brand size="sm" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {ROL_LABEL[user.rol]} Portal
            </span>
          </div>
        </div>

        {/* User Account Dropdown */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                {initials}
              </div>
              <div className="text-left hidden md:block pr-1 leading-tight">
                <p className="text-sm font-bold text-slate-800">{user.nombre}</p>
                <p className="text-[10px] font-medium text-slate-500">{ROL_LABEL[user.rol]}</p>
              </div>
            </div>
          }
        >
          <div className="px-3.5 py-2 border-b border-slate-100 flex flex-col gap-0.5">
            <p className="text-xs font-bold text-slate-700 truncate">{user.nombre}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
          <DropdownItem onClick={handleLogout} color="danger" leftSection={<IconLogout className="w-4 h-4" />}>
            Cerrar sesión
          </DropdownItem>
        </Dropdown>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex relative">
        {/* Sidebar Desktop */}
        <aside className="hidden sm:flex flex-col w-64 bg-indigo-800 text-white shrink-0 border-r border-indigo-900 shadow-xl">
          <div className="p-5 border-b border-indigo-900">
            <Brand size="md" dark />
          </div>
          
          <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto no-scrollbar">
            {items.map((item) => {
              const active =
                location.pathname === item.to ||
                location.pathname.startsWith(item.to + '/')
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-700 text-white shadow-md shadow-indigo-950/20'
                        : 'text-indigo-200 hover:bg-indigo-700/50 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5.5 h-5.5 shrink-0" stroke={1.8} />
                    <span>{item.label}</span>
                  </div>
                  {active && <IconChevronRight className="w-4 h-4 opacity-70" />}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer Info */}
          <div className="p-4 bg-indigo-950/40 border-t border-indigo-900 text-center flex flex-col gap-0.5">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{universityName}</p>
            <p className="text-[9px] text-indigo-400">QueueFlow v1.0.0</p>
          </div>
        </aside>

        {/* Sidebar Mobile Drawer Overlay */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 sm:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            {/* Drawer Body */}
            <aside 
              className="absolute left-0 top-0 bottom-0 w-72 bg-indigo-800 text-white flex flex-col shadow-2xl animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-indigo-900 flex justify-between items-center">
                <Brand size="md" dark />
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-indigo-200 hover:text-white p-1 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {items.map((item) => {
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-indigo-700 text-white shadow-md shadow-indigo-950/20'
                            : 'text-indigo-200 hover:bg-indigo-700/50 hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5.5 h-5.5 shrink-0" stroke={1.8} />
                        <span>{item.label}</span>
                      </div>
                    </NavLink>
                  )
                })}
              </nav>

              <div className="p-4 bg-indigo-950/40 border-t border-indigo-900 text-center flex flex-col gap-0.5">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{universityName}</p>
                <p className="text-[9px] text-indigo-400">QueueFlow v1.0.0</p>
              </div>
            </aside>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
