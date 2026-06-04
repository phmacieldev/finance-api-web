'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'

type ToastType = 'success' | 'error'
interface ToastItem { id: number; message: string; type: ToastType }
type ToastFn = (message: string, type?: ToastType) => void

const ToastContext = createContext<ToastFn>(() => {})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const toast = useCallback<ToastFn>((message, type = 'error') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white max-w-xs pointer-events-auto ${
              t.type === 'error' ? 'bg-red-500' : 'bg-green-600'
            }`}
          >
            {t.type === 'error'
              ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
              : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            }
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="flex-shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
