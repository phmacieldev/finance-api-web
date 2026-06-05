'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './theme'
import { ToastProvider } from './Toast'
import { queryClient } from '@/lib/queryClient'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
