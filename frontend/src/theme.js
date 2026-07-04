import { createTheme } from '@mantine/core'

// Paleta institucional teal, sobria y sin gradientes.
// Escala teal de 10 tonos requerida por Mantine.
const teal = [
  '#e6fbf7',
  '#c9f3ec',
  '#98e6da',
  '#63d8c6',
  '#3bccb6',
  '#22c4ab',
  '#0f9e88',
  '#0d8a77',
  '#0b7565',
  '#065e52',
]

export const theme = createTheme({
  primaryColor: 'teal',
  primaryShade: { light: 7, dark: 5 },
  colors: { teal },
  defaultRadius: 'md',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
  },
  components: {
    Card: {
      defaultProps: { withBorder: true, shadow: 'none' },
    },
    Paper: {
      defaultProps: { withBorder: true, shadow: 'none' },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
  },
})
