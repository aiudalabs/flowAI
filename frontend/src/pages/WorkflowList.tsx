import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Calendar, Play } from 'lucide-react'
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow } from '../hooks/useWorkflowApi'
import WorkflowNameModal from '../components/WorkflowNameModal'
import { formatDistanceToNow } from 'date-fns'

export default function WorkflowList() {
    const navigate = useNavigate()
    const { data: workflows, isLoading, error } = useWorkflows()
    const createWorkflow = useCreateWorkflow()
    const deleteWorkflow = useDeleteWorkflow()

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const handleCreate = async (name: string, description: string) => {
        try {
            const newWorkflow = await createWorkflow.mutateAsync({
                name,
                description,
                graph_data: { nodes: [], edges: [], state_schema: [] }
            })
            setIsCreateModalOpen(false)
            navigate(`/workflows/${newWorkflow.id}`)
        } catch (error) {
            console.error('Failed to create workflow:', error)
            alert('Failed to create workflow')
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
            try {
                await deleteWorkflow.mutateAsync(id)
            } catch (error) {
                console.error('Failed to delete workflow:', error)
                alert('Failed to delete workflow')
            }
        }
    }

    const filteredWorkflows = workflows?.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-600">
                <p>Error loading workflows</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Workflows</h1>
                    <p className="text-gray-500 mt-1">Manage and create your AI workflows</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    New Workflow
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
            </div>

            {/* Workflow Grid */}
            {filteredWorkflows?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                    <p className="text-gray-500 mb-6">Get started by creating your first workflow</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Create Workflow
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkflows?.map((workflow) => (
                        <div
                            key={workflow.id}
                            onClick={() => navigate(`/workflows/${workflow.id}`)}
                            className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300 relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Play size={24} />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleDelete(e, workflow.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Workflow"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {workflow.name}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                                {workflow.description || 'No description provided'}
                            </p>

                            <div className="flex items-center text-xs text-gray-400 gap-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>Updated {formatDistanceToNow(new Date(workflow.updated_at))} ago</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <WorkflowNameModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreate}
            />
        </div>
    )
}
