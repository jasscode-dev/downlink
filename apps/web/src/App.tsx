import { useState } from 'react'
import { Dropdown } from './components/dropdown'
import {
  Copy,
  Download,
  Loader2,
  CheckCircle2,
  Save,
  Search,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDownload } from './hooks/useDownload'
import { downloadService } from './services/download.service'
import type { OutputFormat, VideoInfo } from '@video-converter/shared/types/video.js'

function App() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState<OutputFormat>('mp4')
  const [previewInfo, setPreviewInfo] = useState<VideoInfo | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const {
    videoId,
    isDownloading,
    isDownloaded,
    progress,
    statusText,
    startDownload,
    resetDownload
  } = useDownload()

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
    } catch (err) {
      console.error('Falha ao colar:', err)
    }
  }

  const handleSearch = async () => {
    if (!url) return
    setIsSearching(true)
    try {
      const info = await downloadService.getVideoInfo(url)
      setPreviewInfo(info)
    } catch (error) {
      console.error('Erro ao buscar:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCancelSearch = () => {
    setPreviewInfo(null)
    setUrl('')
  }

  const handleDownload = () => {
    startDownload(url, format)
  }

  const handleSave = () => {
    if (videoId) {
      const a = document.createElement('a')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      a.href = `${baseUrl}/api/videos/${videoId}/download`
      a.download = ''
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }

    setTimeout(() => {
      setPreviewInfo(null)
      resetDownload()
      setUrl('')
    }, 100)
  }

  const showStatus = isDownloading || isDownloaded

  return (
    <div className="bg-bg-main min-h-screen flex flex-col items-center justify-center p-4">
      <div className="border border-border rounded-xl shadow-lg p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-gray-100">
          MO<span className="text-primary">A</span>
        </h1>

        <p className="text-text-faded mb-8">
          turn links into files.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              className="border border-border rounded-lg p-3 w-full bg-transparent text-gray-200 outline-none focus:border-primary transition-colors pr-12 disabled:opacity-50"
              type="text"
              placeholder="paste your link here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isDownloading || isDownloaded || isSearching || !!previewInfo}
            />

            {!previewInfo && (
              <button
                onClick={handlePaste}
                title="Colar da área de transferência"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-faded hover:text-primary transition-colors disabled:opacity-50"
                disabled={isDownloading || isDownloaded || isSearching}
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
          </div>

          {!previewInfo && (
            <button
              onClick={handleSearch}
              disabled={!url || isSearching}
              className="flex items-center justify-center text-gray-200 cursor-pointer bg-primary hover:bg-opacity-90 font-semibold py-3 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSearching ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Search className="w-6 h-6" />
              )}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {previewInfo && !showStatus && (
            <motion.div
              key="preview-card"
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mt-8 border border-border rounded-xl bg-bg-main/50 backdrop-blur-sm flex flex-col md:flex-row p-4 gap-6 items-center"
            >
              <div className="w-full md:w-56 h-32 bg-black/40 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  src={previewInfo.thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-contain object-top rounded-md"
                />
              </div>
              <div className="flex-1 w-full flex flex-col justify-center">
                <h3 className="text-gray-100 font-semibold text-lg line-clamp-2 mb-4" title={previewInfo.title}>
                  {previewInfo.title}
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Dropdown options={['mp4', 'gif']} value={format} onChange={setFormat} />
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    Baixar
                  </button>
                  <button
                    onClick={handleCancelSearch}
                    title="Cancelar"
                    className="flex-none px-4 flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-faded hover:text-primary rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showStatus && (
            <motion.div
              key="download-status"
              initial={{
                opacity: 0,
                y: -30,
                scale: 0.98,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                height: 'auto',
              }}
              exit={{
                opacity: 0,
                y: -40,
                height: 0,
                marginTop: 0,
              }}
              transition={{
                height: { duration: 0.4 },
                opacity: { duration: 0.25 },
                y: { duration: 0.35 },
                scale: { duration: 0.4 },
              }}
              style={{ overflow: 'hidden' }}
              className="mt-8"
            >
              <div className="p-5 border border-border rounded-xl bg-bg-main/50 backdrop-blur-sm flex items-center gap-5">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      {isDownloaded ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {statusText}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {Math.floor(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1a1a1e] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-2 rounded-full bg-primary"
                      animate={{ width: `${progress}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 40,
                        damping: 15,
                        mass: 0.8
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!isDownloaded}
                  className={`flex-shrink-0 p-3 rounded-xl transition-all flex items-center justify-center ${isDownloaded
                    ? 'text-primary hover:bg-white/5'
                    : 'text-text-faded opacity-30 cursor-not-allowed'
                    }`}
                >
                  <Save className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App