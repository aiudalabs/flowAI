import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Terminal,
    Database,
    Activity,
    AlertCircle,
    Info
} from 'lucide-react'
import { Execution, ExecutionLog } from '../types/workflow'

interface ExecutionDetailsProps {
    execution: Execution
    onClose: () => void
}

export default function ExecutionDetails({ execution, onClose }: ExecutionDetailsProps) {
    const [activeTab, setActiveTab] = useState<'logs' | 'data' | 'trace'>('logs')

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200'
            case 'failed': return 'text-red-600 bg-red-50 border-red-200'
            case 'running': return 'text-blue-600 bg-blue-50 border-blue-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle size={18} />
            case 'failed': return <XCircle size={18} />
            case 'running': return <Activity size={18} className="animate-pulse" />
            default: return <Clock size={18} />
        }
    }

    const getLevelIcon = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
            case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />
            case 'info': return <Info className="w-4 h-4 text-blue-500" />
            default: return <CheckCircle className="w-4 h-4 text-green-500" />
        }
    }

    const duration = execution.completed_at && execution.started_at
        ? formatDistanceToNow(new Date(execution.started_at), { addSuffix: false })
        : 'Unknown'

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">Execution Details</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 border ${getStatusColor(execution.status)}`}>
                            {getStatusIcon(execution.status)}
                            <span className="uppercase">{execution.status}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(execution.created_at).toLocaleString()}
                        </div>
                        {execution.completed_at && (
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} />
                                Duration: {duration}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Back to History
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Terminal size={16} />
                    Logs
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'data'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Database size={16} />
                    Input / Output
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'logs' && (
                    <div className="space-y-2">
                        {execution.logs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No logs available</div>
                        ) : (
                            execution.logs.map((log: ExecutionLog, i: number) => (
                                <div key={i} className="p-3 rounded border border-gray-100 bg-gray-50 text-sm font-mono">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                {log.node_id && (
                                                    <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-700">
                                                        {log.node_id}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="whitespace-pre-wrap break-words text-gray-800">{log.message}</p>
                                            {log.data && (
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer text-xs text-blue-600 hover:underline">View Data</summary>
                                                    <pre className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs overflow-x-auto">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Input Data
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                {execution.input_data ? (
                                    <pre>{JSON.stringify(execution.input_data, null, 2)}</pre>
                                ) : (
                                    <span className="text-gray-500 italic">No input data</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Output Data
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                {execution.output_data ? (
                                    <pre>{JSON.stringify(execution.output_data, null, 2)}</pre>
                                ) : (
                                    <span className="text-gray-500 italic">No output data</span>
                                )}
                            </div>
                        </div>

                        {execution.error_message && (
                            <div>
                                <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    Error Message
                                </h3>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm font-mono whitespace-pre-wrap">
                                    {execution.error_message}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
