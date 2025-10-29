'use client'

import React from 'react'
import { Sidebar } from './Sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
}

export function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile spacing */}
        <div className="lg:hidden h-16"></div>

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}