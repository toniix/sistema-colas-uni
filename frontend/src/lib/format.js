import dayjs from 'dayjs'
import 'dayjs/locale/es'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('es')
dayjs.extend(relativeTime)

export const fmtHora = (d) => (d ? dayjs(d).format('HH:mm') : '—')
export const fmtFechaHora = (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—')
export const fmtRelativo = (d) => (d ? dayjs(d).fromNow() : '—')

// Duración en minutos entre dos fechas, formateada legible
export function fmtDuracion(desde, hasta) {
  if (!desde) return '—'
  const mins = dayjs(hasta || new Date()).diff(dayjs(desde), 'minute')
  if (mins < 1) return '<1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export const minutosEntre = (desde, hasta) =>
  desde ? dayjs(hasta || new Date()).diff(dayjs(desde), 'minute') : 0

export default dayjs
