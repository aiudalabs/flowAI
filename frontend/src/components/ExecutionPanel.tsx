import { useState, useEffect, useRef } from 'react'
import { useExecutionStore } from '@/store/executionStore'
import { useWorkflowStore } from '@/store/workflowStore'
import { X, ChevronDown, ChevronUp, Terminal, AlertCircle, Info, CheckCircle, History, Play, Clock, Activity } from 'lucide-react'
import ExecutionDetails from './ExecutionDetails'
import { formatDistanceToNow } from 'date-fns'

export default function ExecutionPanel() {
  const {
    executionLogs,
    isExecuting,
    currentExecutionId,
    executionHistory,
    loadHistory,
    selectedExecution,
    selectExecution,
    isLoadingHistory
  } = useExecutionStore()

  const { currentWorkflowId } = useWorkflowStore()

  const [isExpanded, setIsExpanded] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-switch to current tab when execution starts
  useEffect(() => {
    if (isExecuting) {
      setActiveTab('current')
      setIsExpanded(true)
      setIsMinimized(false)
    }
  }, [isExecuting])

  // Load history when tab changes to history
  useEffect(() => {
    if (activeTab === 'history' && currentWorkflowId) {
      loadHistory(currentWorkflowId)
    }
  }, [activeTab, currentWorkflowId, loadHistory])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (activeTab === 'current' && isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [executionLogs, isExpanded, activeTab])

  // If minimized, show floating button
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          {isExecuting ? <Activity className="w-4 h-4 animate-pulse" /> : <Terminal className="w-4 h-4" />}
          <span>
            {isExecuting ? 'Running...' : 'Execution Panel'}
          </span>
          {isExecuting && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
          )}
        </button>
      </div>
    )
  }

  // If showing details of a past execution
  if (selectedExecution && isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 w-[500px] h-[600px] bg-white border border-gray-200 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
          <span className="font-semibold text-sm text-gray-700">Execution Details</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-200 rounded"><ChevronDown size={16} /></button>
            <button onClick={() => selectExecution(null)} className="p-1 hover:bg-gray-200 rounded"><X size={16} /></button>
          </div>
        </div>
        <ExecutionDetails
          execution={selectedExecution}
          onClose={() => selectExecution(null)}
        />
      </div>
    )
  }

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      case 'warning': return <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
      case 'info': return <Info className="w-3.5 h-3.5 text-blue-500" />
      default: return <CheckCircle className="w-3.5 h-3.5 text-green-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'bg-red-50 border-red-100'
      case 'warning': return 'bg-yellow-50 border-yellow-100'
      case 'info': return 'bg-blue-50 border-blue-100'
      default: return 'bg-gray-50 border-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-green-600" />
      case 'failed': return <AlertCircle size={14} className="text-red-600" />
      case 'running': return <Activity size={14} className="text-blue-600 animate-pulse" />
      default: return <Clock size={14} className="text-gray-400" />
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50"
        >
          <Terminal size={16} className="text-gray-600" />
          <span className="font-medium text-sm text-gray-700">Execution Panel</span>
          <ChevronUp size={16} className="text-gray-400" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-[400px] h-[500px] bg-white border border-gray-200 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-200 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-sm text-gray-800">Execution Panel</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'current'
            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
            : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Play size={12} />
          Current Run
          {isExecuting && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'history'
            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
            : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <History size={12} />
          History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white relative">
        {activeTab === 'current' ? (
          <div className="h-full overflow-y-auto p-3 space-y-2">
            {!currentExecutionId && executionLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                <Play size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Ready to run</p>
                <p className="text-xs mt-1">Click "Run" in the toolbar to start execution</p>
              </div>
            ) : (
              <>
                {executionLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded border text-xs font-mono ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 opacity-75">
                          {log.node_id && (
                            <span className="px-1.5 py-0.5 bg-white/50 border border-black/5 rounded text-[10px] font-semibold">
                              {log.node_id}
                            </span>
                          )}
                          <span className="text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-800 break-words leading-relaxed">{log.message}</p>
                        {log.data && Object.keys(log.data).length > 0 && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-[10px] text-blue-600 hover:text-blue-800 font-sans font-medium select-none">
                              View Data
                            </summary>
                            <pre className="mt-1.5 p-2 bg-white rounded border border-gray-200 text-[10px] overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : executionHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                <History size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No execution history</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {executionHistory.map((exec) => (
                  <button
                    key={exec.id}
                    onClick={() => selectExecution(exec)}
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${exec.status === 'completed' ? 'bg-green-50' :
                        exec.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'
                        }`}>
                        {getStatusIcon(exec.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium uppercase ${exec.status === 'completed' ? 'text-green-700' :
                            exec.status === 'failed' ? 'text-red-700' : 'text-gray-700'
                            }`}>
                            {exec.status}
                          </span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(exec.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          ID: {exec.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={14} className="text-gray-300 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
