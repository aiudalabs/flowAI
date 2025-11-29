import { useState } from 'react'
import { X, ChevronDown, ChevronRight, Database } from 'lucide-react'

interface StateInspectorProps {
  isOpen: boolean
  onClose: () => void
  currentState: Record<string, any>
  executionHistory: Array<{
    nodeId: string
    nodeName: string
    timestamp: string
    stateSnapshot: Record<string, any>
  }>
}

export default function StateInspector({
  isOpen,
  onClose,
  currentState,
  executionHistory
}: StateInspectorProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [selectedSnapshot, setSelectedSnapshot] = useState<number | null>(null)

  if (!isOpen) return null

  const toggleKey = (key: string) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedKeys(newExpanded)
  }

  const renderValue = (value: any): JSX.Element => {
    // const indent = depth * 16

    if (value === null) {
      return <span className="text-gray-400">null</span>
    }

    if (value === undefined) {
      return <span className="text-gray-400">undefined</span>
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600">{value.toString()}</span>
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600">{value}</span>
    }

    if (typeof value === 'string') {
      return (
        <span className="text-green-600">
          "{value.length > 100 ? value.substring(0, 100) + '...' : value}"
        </span>
      )
    }

    if (Array.isArray(value)) {
      return (
        <span className="text-gray-600">
          Array[{value.length}] {value.length > 0 && '...'}
        </span>
      )
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value)
      return (
        <span className="text-gray-600">
          Object {'{'}
          {keys.length}
          {'}'}
        </span>
      )
    }

    return <span className="text-gray-600">{String(value)}</span>
  }

  const displayState = selectedSnapshot !== null
    ? executionHistory[selectedSnapshot]?.stateSnapshot
    : currentState

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">State Inspector</h2>
            {selectedSnapshot !== null && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                Snapshot #{selectedSnapshot + 1}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Execution History Sidebar */}
          {executionHistory.length > 0 && (
            <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
              <div className="p-3 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-sm text-gray-700">Execution History</h3>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedSnapshot === null
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-100'
                    }`}
                >
                  <div className="font-medium">Current State</div>
                  <div className="text-xs text-gray-500">Latest</div>
                </button>
                {executionHistory.map((entry, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSnapshot(index)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedSnapshot === index
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-100'
                      }`}
                  >
                    <div className="font-medium">{entry.nodeName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* State Display */}
          <div className="flex-1 overflow-y-auto p-6">
            {!displayState || Object.keys(displayState).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No state data available</p>
                <p className="text-sm mt-1">Execute a workflow to see state updates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(displayState).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleKey(key)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedKeys.has(key) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="font-mono font-medium text-sm">{key}</span>
                        <span className="text-xs text-gray-500">
                          {typeof value === 'object' && value !== null
                            ? Array.isArray(value)
                              ? `Array[${value.length}]`
                              : `Object{${Object.keys(value).length}}`
                            : typeof value}
                        </span>
                      </div>
                      {!expandedKeys.has(key) && (
                        <div className="text-sm truncate max-w-md">
                          {renderValue(value)}
                        </div>
                      )}
                    </button>
                    {expandedKeys.has(key) && (
                      <div className="p-4 bg-white">
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              {displayState && Object.keys(displayState).length > 0 ? (
                <>
                  <span className="font-medium">{Object.keys(displayState).length}</span> state
                  field{Object.keys(displayState).length !== 1 ? 's' : ''}
                </>
              ) : (
                'No state data'
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
