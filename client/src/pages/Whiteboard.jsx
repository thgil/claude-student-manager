import { useState, useEffect, useCallback } from 'react'
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw'

const STORAGE_KEY = 'tutoring-whiteboard'

export default function Whiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)
  const [initialData, setInitialData] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [saving, setSaving] = useState(false)

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setInitialData({
          elements: parsed.elements || [],
          appState: {
            viewBackgroundColor: parsed.appState?.viewBackgroundColor || '#ffffff',
            currentItemFontFamily: parsed.appState?.currentItemFontFamily || 1,
          },
        })
        setLastSaved(parsed.savedAt ? new Date(parsed.savedAt) : null)
      } catch (e) {
        console.error('Failed to load whiteboard:', e)
      }
    } else {
      setInitialData({ elements: [], appState: {} })
    }
  }, [])

  // Auto-save on changes
  const handleChange = useCallback((elements, appState) => {
    // Debounced save
    if (saving) return
    setSaving(true)

    setTimeout(() => {
      const data = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemFontFamily: appState.currentItemFontFamily,
        },
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setLastSaved(new Date())
      setSaving(false)
    }, 1000)
  }, [saving])

  const handleClear = () => {
    if (window.confirm('Clear the whiteboard? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY)
      window.location.reload()
    }
  }

  const handleExport = async () => {
    if (!excalidrawAPI) return

    try {
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
        mimeType: 'image/png',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `whiteboard-${new Date().toISOString().split('T')[0]}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Failed to export:', e)
      alert('Failed to export whiteboard')
    }
  }

  if (!initialData) {
    return <div className="text-center py-8">Loading whiteboard...</div>
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Whiteboard</h2>
          {lastSaved && (
            <p className="text-xs text-gray-500">
              Auto-saved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export PNG
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden bg-white" style={{ height: '100%', width: '100%' }}>
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
          theme="light"
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
              saveToActiveFile: false,
            },
          }}
        />
      </div>
    </div>
  )
}
