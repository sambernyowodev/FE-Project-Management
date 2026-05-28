import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Unified date formatting helper
 */
export type DateFormatVariant = 'long' | 'short' | 'input' | 'iso' | 'datetime' | 'time'

export function formatDate(
  date: Date | string | undefined | null,
  variant: DateFormatVariant = 'long',
  locale = 'id-ID'
): string {
  if (!date) return (variant === 'input' || variant === 'iso') ? '' : '-'

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return (variant === 'input' || variant === 'iso') ? '' : '-'

    switch (variant) {
      case 'short':
        return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
      case 'input':
      case 'iso':
        // Returns YYYY-MM-DD (safe for database DATE columns and <input type="date">)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      case 'time':
        return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d)
      case 'datetime':
        return new Intl.DateTimeFormat(locale, {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }).format(d)
      case 'long':
      default:
        return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
    }
  } catch (e) {
    return (variant === 'input' || variant === 'iso') ? '' : '-'
  }
}

// Backward compatibility aliases
export const formatDateShort = (date: any) => formatDate(date, 'short')
export const formatDateInput = (date: any) => formatDate(date, 'input')
export const toISODateString = (date: any) => formatDate(date, 'iso')
export const formatTime = (date: any) => formatDate(date, 'time')
export const formatDateTime = (date: any) => formatDate(date, 'datetime')

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
