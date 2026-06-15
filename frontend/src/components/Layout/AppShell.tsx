import React from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'

const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070A13] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute left-1/4 bottom-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      <TopNav />
      <main className="relative pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
