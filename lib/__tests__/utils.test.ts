import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatPercent, monthName } from '../utils'

describe('formatCurrency', () => {
  it('formats positive integer', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00')
  })

  it('formats negative value', () => {
    expect(formatCurrency(-500)).toBe('-R$ 500,00')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })

  it('formats decimal value', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })
})

describe('formatDate', () => {
  it('converts ISO date to dd/mm/yyyy', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024')
  })

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })
})

describe('formatPercent', () => {
  it('shows + sign for positive values', () => {
    expect(formatPercent(12.5)).toBe('+12.5%')
  })

  it('shows - sign for negative values', () => {
    expect(formatPercent(-8.3)).toBe('-8.3%')
  })

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('+0.0%')
  })
})

describe('monthName', () => {
  it('returns january for month 1', () => {
    expect(monthName(1)).toBe('janeiro')
  })

  it('returns december for month 12', () => {
    expect(monthName(12)).toBe('dezembro')
  })

  it('returns june for month 6', () => {
    expect(monthName(6)).toBe('junho')
  })
})
