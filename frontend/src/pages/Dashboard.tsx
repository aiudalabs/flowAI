import { useEffect, DragEvent } from 'react'
import { useParams } from 'react-router-dom'
import { ReactFlowProvider } from 'reactflow'
import NodePalette from '../components/NodePalette'
import WorkflowCanvas from '../components/WorkflowCanvas'
import NodeConfigPanel from '../components/NodeConfigPanel'
import Toolbar from '../components/Toolbar'
import ExecutionPanel from '../components/ExecutionPanel'
import UnsavedChangesDialog from '../components/UnsavedChangesDialog'
import { useWorkflowStore } from '../store/workflowStore'

export default function Dashboard() {
    const { id } = useParams<{ id: string }>()
    const { loadWorkflow, clearWorkflow, currentWorkflowId, hasUnsavedChanges } = useWorkflowStore()

    useEffect(() => {
        if (id) {
            loadWorkflow(id)
        } else {
            clearWorkflow()
        }

        return () => {
            clearWorkflow()
        }
    }, [id, loadWorkflow, clearWorkflow])

    const onDragStart = (event: DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.effectAllowed = 'move'
    }

    if (id && !currentWorkflowId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <UnsavedChangesDialog isDirty={hasUnsavedChanges} />
            <Toolbar />
            <div className="flex-1 flex overflow-hidden">
                <ReactFlowProvider>
                    <NodePalette onDragStart={onDragStart} />
                    <WorkflowCanvas />
                    <NodeConfigPanel />
                </ReactFlowProvider>
            </div>
            <ExecutionPanel />
        </div>
    )
}
