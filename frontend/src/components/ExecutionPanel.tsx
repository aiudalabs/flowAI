import { useState, useEffect, useRef } from 'react'
import { useExecutionStore } from '@/store/executionStore'
import { X, ChevronDown, ChevronUp, Terminal, AlertCircle, Info, CheckCircle } from 'lucide-react'

export default function ExecutionPanel() {
  const { executionLogs, isExecuting, currentExecutionId, resetExecution } = useExecutionStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [executionLogs, isExpanded])

  if (!currentExecutionId && executionLogs.length === 0) {
    return null
  }

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
        >
          <Terminal className="w-4 h-4" />
          <span>Execution Logs ({executionLogs.length})</span>
          {isExecuting && (
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-sm">Execution Logs</span>
          {isExecuting && (
            <span className="flex items-center gap-1 text-xs text-yellow-600">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Running
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={resetExecution}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {executionLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No logs yet. Execute a workflow to see logs here.
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {executionLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border text-sm ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.node_id && (
                          <span className="px-2 py-0.5 bg-white rounded text-xs font-mono">
                            {log.node_id}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{log.message}</p>
                      {log.data && Object.keys(log.data).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                            View data
                          </summary>
                          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Invisible div for auto-scroll */}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
