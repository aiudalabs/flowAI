import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, Eye, Database, X, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { datasetApi } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import type { Dataset, DatasetPreview } from '../types/dataset'

export default function Datasets() {
    const queryClient = useQueryClient()
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
    const [previewData, setPreviewData] = useState<DatasetPreview | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    // Fetch datasets
    const { data: datasets, isLoading } = useQuery({
        queryKey: ['datasets'],
        queryFn: datasetApi.list
    })

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            return datasetApi.upload(file)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['datasets'] })
        },
        onError: (error: any) => {
            alert('Failed to upload dataset: ' + error.message)
        }
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: datasetApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['datasets'] })
            if (selectedDataset) {
                setShowPreview(false)
                setSelectedDataset(null)
            }
        }
    })

    // Preview mutation
    const previewMutation = useMutation({
        mutationFn: datasetApi.getPreview,
        onSuccess: (data) => {
            setPreviewData(data)
            setShowPreview(true)
        }
    })

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            uploadMutation.mutate(acceptedFiles[0])
        }
    }, [uploadMutation])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/json': ['.json']
        },
        maxFiles: 1
    })

    const handlePreview = (dataset: Dataset) => {
        setSelectedDataset(dataset)
        previewMutation.mutate(dataset.id)
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this dataset?')) {
            deleteMutation.mutate(id)
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
                        <p className="text-gray-500 mt-1">Manage your data sources for workflows</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-hidden flex gap-8">
                {/* Left Panel: Upload & List */}
                <div className="w-1/3 flex flex-col gap-6">
                    {/* Upload Area */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                            } ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                <Upload size={24} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {uploadMutation.isPending ? 'Uploading...' : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">CSV or JSON (max 10MB)</p>
                            </div>
                        </div>
                    </div>

                    {/* Dataset List */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                <Database size={18} />
                                Your Datasets
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : datasets?.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No datasets yet</p>
                                </div>
                            ) : (
                                datasets?.map((dataset) => (
                                    <div
                                        key={dataset.id}
                                        onClick={() => handlePreview(dataset)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedDataset?.id === dataset.id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white border border-gray-200 rounded-lg">
                                                    <FileText size={20} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900 truncate max-w-[150px]">
                                                        {dataset.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <span className="uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {dataset.file_type}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{formatSize(dataset.size_bytes)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(dataset.id, e)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    {selectedDataset && showPreview ? (
                        <>
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="text-blue-600" />
                                        {selectedDataset.name}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span>Uploaded {formatDistanceToNow(new Date(selectedDataset.created_at))} ago</span>
                                        <span>•</span>
                                        <span>{selectedDataset.row_count?.toLocaleString()} rows</span>
                                        <span>•</span>
                                        <span>{selectedDataset.columns?.length} columns</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedDataset(null)
                                        setShowPreview(false)
                                    }}
                                    className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                {previewMutation.isPending ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : previewData ? (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {previewData.columns.map((col: string) => (
                                                        <th
                                                            key={col}
                                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                        >
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {previewData.data.map((row: Record<string, any>, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        {previewData.columns.map((col: string) => (
                                                            <td
                                                                key={`${i}-${col}`}
                                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                            >
                                                                {String(row[col] ?? '')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <AlertCircle size={48} className="mb-4 opacity-50" />
                                        <p>Failed to load preview</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="p-6 bg-gray-50 rounded-full mb-4">
                                <Eye size={48} className="opacity-50" />
                            </div>
                            <p className="text-lg font-medium">Select a dataset to preview</p>
                            <p className="text-sm mt-1">Click on any dataset from the list to view its contents</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
