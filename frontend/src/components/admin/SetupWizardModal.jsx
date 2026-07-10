import React, { useState, useEffect } from 'react'
import { useBranding } from '../../context/BrandingContext'
import { IconBuilding, IconPhoto, IconDeviceFloppy, IconChevronRight, IconChevronLeft, IconUpload, IconSparkles } from '@tabler/icons-react'
import Button from '../ui/Button'
import { TextInput } from '../ui/Input'

export default function SetupWizardModal() {
  const { configured, loading: loadingBranding, universityName, systemName, logoBase64, coverBase64, updateBranding } = useBranding()
  
  // Solo se abre automáticamente si no está configurado y ya se cargó el estado
  const [isOpen, setIsOpen] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Estados del formulario
  const [formUniversity, setFormUniversity] = useState('')
  const [formSystem, setFormSystem] = useState('')
  const [logo, setLogo] = useState(null)
  const [cover, setCover] = useState(null)

  // Inicializar estados una vez que la carga de branding termine
  useEffect(() => {
    if (!loadingBranding && !hasInitialized) {
      setIsOpen(!configured)
      setFormUniversity(universityName || '')
      setFormSystem(systemName || '')
      setLogo(logoBase64 || null)
      setCover(coverBase64 || null)
      setHasInitialized(true)
    }
  }, [loadingBranding, configured, universityName, systemName, logoBase64, coverBase64, hasInitialized])

  if (loadingBranding || !isOpen) return null

  const handleFileChange = (e, setFileState) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG).')
      return
    }

    // Validar tamaño (máx 3MB para evitar saturar base de datos y localStorage)
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Elige una de menos de 3MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFileState(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateBranding({
        universityName: formUniversity,
        systemName: formSystem,
        logoBase64: logo,
        coverBase64: cover
      })
      setIsOpen(false)
    } catch (err) {
      alert('Error al guardar la configuración: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none translate-x-10 -translate-y-10" />
          <div className="flex items-center gap-2 mb-1.5">
            <IconSparkles className="w-5 h-5 text-sky-300 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">Asistente de Configuración Inicial</span>
          </div>
          <h2 className="text-xl font-black tracking-tight leading-tight">
            Personaliza tu Portal
          </h2>
          <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
            Dale identidad a tu plataforma de colas configurando la identidad institucional.
          </p>
        </div>

        {/* Indicador de Pasos */}
        <div className="flex border-b border-slate-100 text-center font-bold text-xs select-none">
          <div className={`flex-1 py-3 border-b-2 transition-all ${step === 1 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
            1. Textos
          </div>
          <div className={`flex-1 py-3 border-b-2 transition-all ${step === 2 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
            2. Logo
          </div>
          <div className={`flex-1 py-3 border-b-2 transition-all ${step === 3 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
            3. Portada
          </div>
        </div>

        {/* Cuerpo del paso */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[350px] min-h-[250px]">
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <IconBuilding className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Información Principal</h3>
              </div>

              <TextInput
                label="Nombre de la Universidad / Institución"
                placeholder="Ej. Universidad Nacional de Ingeniería"
                value={formUniversity}
                onChange={(e) => setFormUniversity(e.target.value)}
                required
              />

              <TextInput
                label="Nombre del Sistema"
                placeholder="Ej. QueueFlow UNI"
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value)}
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <IconPhoto className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Logotipo Institucional</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-1">
                Sube el logotipo de tu institución para las pantallas generales, cabecera de administración y el monitor de TV. Se recomienda fondo transparente.
              </p>

              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 rounded-2xl p-4 transition-colors cursor-pointer text-slate-500">
                    <IconUpload className="w-6 h-6 mb-1.5 text-slate-400" />
                    <span className="text-xs font-bold">Seleccionar archivo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG o SVG (máx 3MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setLogo)}
                    />
                  </label>
                </div>

                <div className="w-24 h-24 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-center p-2.5 overflow-hidden shrink-0">
                  {logo ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <img src={logo} alt="Preview Logo" className="object-contain max-w-full max-h-full" />
                      <button
                        type="button"
                        onClick={() => setLogo(null)}
                        className="absolute inset-0 bg-red-600/80 text-white font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Sin Logo</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <IconPhoto className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Fondo de Inicio de Sesión</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-1">
                Sube una foto de portada o campus para mostrar en el panel izquierdo de la página de Login. Se aplicará un filtro de contraste oscuro automáticamente.
              </p>

              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 rounded-2xl p-4 transition-colors cursor-pointer text-slate-500">
                    <IconUpload className="w-6 h-6 mb-1.5 text-slate-400" />
                    <span className="text-xs font-bold">Seleccionar archivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setCover)}
                    />
                  </label>
                </div>

                <div className="w-24 h-24 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                  {cover ? (
                    <div className="relative group w-full h-full">
                      <img src={cover} alt="Preview Portada" className="object-cover w-full h-full rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setCover(null)}
                        className="absolute inset-0 bg-red-600/80 text-white font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Fondo default</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con controles */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-between gap-3 shrink-0">
          <div>
            {step > 1 && (
              <Button
                variant="white"
                onClick={() => setStep(step - 1)}
                leftSection={<IconChevronLeft className="w-4 h-4" />}
              >
                Atrás
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                rightSection={<IconChevronRight className="w-4 h-4" />}
                disabled={step === 1 && (!formUniversity.trim() || !formSystem.trim())}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                loading={loading}
                leftSection={<IconDeviceFloppy className="w-4 h-4" />}
              >
                Guardar y Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
