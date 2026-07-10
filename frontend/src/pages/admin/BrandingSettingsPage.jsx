import React, { useState, useEffect } from 'react'
import { useBranding } from '../../context/BrandingContext'
import { useNotification } from '../../hooks/useNotification'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Input'
import { IconBuilding, IconPhoto, IconDeviceFloppy, IconCheck, IconUpload, IconTrash } from '@tabler/icons-react'

export default function BrandingSettingsPage() {
  const { universityName, systemName, logoBase64, coverBase64, updateBranding } = useBranding()
  const { showNotification } = useNotification()

  const [formUniversity, setFormUniversity] = useState(universityName)
  const [formSystem, setFormSystem] = useState(systemName)
  const [logo, setLogo] = useState(logoBase64)
  const [cover, setCover] = useState(coverBase64)
  const [loading, setLoading] = useState(false)

  // Sincronizar estados si cambian en el contexto global
  useEffect(() => {
    setFormUniversity(universityName)
    setFormSystem(systemName)
    setLogo(logoBase64)
    setCover(coverBase64)
  }, [universityName, systemName, logoBase64, coverBase64])

  const handleFileChange = (e, setFileState) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification({
        title: 'Archivo no válido',
        message: 'Por favor selecciona un archivo de imagen (PNG, JPG, SVG).',
        color: 'red'
      })
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      showNotification({
        title: 'Archivo muy grande',
        message: 'La imagen es demasiado grande. Elige una de menos de 3MB.',
        color: 'red'
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFileState(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateBranding({
        universityName: formUniversity,
        systemName: formSystem,
        logoBase64: logo,
        coverBase64: cover
      })
      showNotification({
        title: 'Configuración Guardada',
        message: 'La identidad institucional se ha actualizado correctamente.',
        color: 'green',
        icon: <IconCheck className="w-5 h-5" />
      })
    } catch (err) {
      showNotification({
        title: 'Error al Guardar',
        message: err.message,
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Personalización del Portal" 
        subtitle="Configura la marca, el logotipo, los nombres y la imagen de portada del sistema."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-slide-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Panel Izquierdo: Configuración General */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <Card padding="lg" className="border-slate-200 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <IconBuilding className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Información Institucional</h3>
              </div>

              <TextInput
                label="Nombre de la Universidad"
                placeholder="Ej. Universidad Nacional de Ingeniería"
                value={formUniversity}
                onChange={(e) => setFormUniversity(e.target.value)}
                required
              />

              <TextInput
                label="Nombre del Sistema"
                placeholder="Ej. Sistema de Colas UNI"
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value)}
                required
              />
            </Card>

            <Card padding="lg" className="border-slate-200 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <IconPhoto className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Imagen de Portada de Acceso</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Esta imagen se aplicará de fondo en el panel lateral de la pantalla de inicio de sesión. Si se remueve, se mostrará el gradiente azul estándar con destellos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label className="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 rounded-2xl p-6 transition-colors cursor-pointer text-slate-500 text-center">
                  <IconUpload className="w-8 h-8 mb-2 text-slate-400" />
                  <span className="text-xs font-bold">Subir nueva portada</span>
                  <span className="text-[10px] text-slate-400 mt-1">Arrastra o selecciona un archivo (máx 3MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setCover)}
                  />
                </label>

                {cover && (
                  <div className="w-36 h-28 border border-slate-200 rounded-2xl overflow-hidden relative group shrink-0 shadow-sm">
                    <img src={cover} alt="Preview Portada" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCover(null)}
                      className="absolute inset-0 bg-red-600/90 text-white font-bold text-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconTrash className="w-4 h-4" />
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Panel Derecho: Logotipo */}
          <div className="flex flex-col gap-6">
            <Card padding="lg" className="border-slate-200 shadow-sm flex flex-col gap-5 h-full">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <IconPhoto className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Logotipo Oficial</h3>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl relative min-h-[160px]">
                {logo ? (
                  <div className="relative group w-full h-full flex flex-col items-center justify-center p-2">
                    <img src={logo} alt="Logo Institucional" className="max-h-24 object-contain shadow-xs bg-white p-1 rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="absolute inset-0 bg-red-600/90 text-white font-bold text-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                    >
                      <IconTrash className="w-4 h-4" />
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 flex flex-col items-center gap-1">
                    <IconPhoto className="w-10 h-10 opacity-40" />
                    <span className="text-xs font-bold">Sin Logo Personalizado</span>
                    <span className="text-[10px]">Se usará el ícono por defecto</span>
                  </div>
                )}
              </div>

              <label className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl py-2 px-3 transition-colors cursor-pointer text-xs font-bold text-slate-600 hover:text-indigo-600 text-center">
                <IconUpload className="w-4 h-4 shrink-0" />
                <span>Seleccionar Imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setLogo)}
                />
              </label>
            </Card>
          </div>
        </div>

        {/* Barra de Acciones */}
        <div className="flex justify-end gap-3 mt-2">
          <Button
            type="submit"
            loading={loading}
            size="lg"
            leftSection={<IconDeviceFloppy className="w-5 h-5" />}
            className="px-6"
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
