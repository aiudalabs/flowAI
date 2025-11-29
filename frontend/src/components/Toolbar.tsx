import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Save, Play, Download, Code, Settings, Database, Lightbulb, GitBranch, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWorkflowStore } from '@/store/workflowStore'
import { useExecutionStore } from '@/store/executionStore'
import { useAuthStore } from '@/stores/authStore'
import { executionApi } from '@/services/api'
import InputFormModal from './InputFormModal'
import OutputViewer from './OutputViewer'
import StateDesigner from './StateDesigner'
import StateInspector from './StateInspector'
import { exampleWorkflow } from '@/templates/exampleWorkflow'
import { conditionalWorkflow } from '@/templates/conditionalWorkflow'

export default function Toolbar() {
  const navigate = useNavigate()
  const {
    nodes,
    edges,
    stateSchema,
    setNodes,
    setEdges,
    setStateSchema,
    name,
    setName,
    saveWorkflow,
    isSaving,
    lastSaved,
    currentWorkflowId
  } = useWorkflowStore()

  const {
    startExecution,
    setNodeStatus,
    addLog,
    completeExecution,
    resetExecution
  } = useExecutionStore()

  const [showInputForm, setShowInputForm] = useState(false)
  const [showOutputViewer, setShowOutputViewer] = useState(false)
  const [showStateDesigner, setShowStateDesigner] = useState(false)
  const [showStateInspector, setShowStateInspector] = useState(false)
  const [currentExecutionData, setCurrentExecutionData] = useState<any>(null)
  const [executionStateHistory] = useState<Array<{
    nodeId: string
    nodeName: string
    timestamp: string
    stateSnapshot: Record<string, any>
  }>>([])

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkflowId) {
        throw new Error('Please save the workflow first')
      }

      if (nodes.length === 0) {
        throw new Error('Workflow is empty. Add some nodes first.')
      }

      // Auto-save before execution
      await saveWorkflow()

      console.log('Creating execution...')
      return executionApi.create({
        workflow_id: currentWorkflowId,
        input_data: {},
      })
    },
    onSuccess: (execution) => {
      console.log('Execution created:', execution)
      handleExecutionStart(execution)
    },
    onError: (error: any) => {
      console.error('Execution error:', error)
      alert('Failed to execute workflow: ' + error.message)
    },
  })

  const handleExecutionStart = (execution: any) => {
    // Start visual execution tracking
    resetExecution()
    startExecution(execution.id)

    // Subscribe to execution updates
    executionApi.subscribeToExecution(execution.id, {
      onStatus: (status) => {
        console.log('📊 Execution status:', status)
      },
      onLog: (log) => {
        console.log('📝 Execution log:', log)
        addLog(log)

        // Update node status based on log messages
        if (log.node_id) {
          const message = log.message.toLowerCase()

          if (message.includes('executing node') || message.includes('⏳')) {
            setNodeStatus(log.node_id, 'running')
          } else if (message.includes('node completed') || message.includes('✅')) {
            setNodeStatus(log.node_id, 'completed')
          } else if (message.includes('node failed') || message.includes('❌') || log.level === 'error') {
            setNodeStatus(log.node_id, 'failed')
          }
        }
      },
      onComplete: (data) => {
        console.log('✅ Execution complete:', data)
        completeExecution()

        // Store execution data for output viewer
        setCurrentExecutionData({
          id: execution.id,
          status: data.status,
          output_data: data.output || data.output_data,
          completed_at: new Date().toISOString(),
        })

        // Show output viewer
        setShowOutputViewer(true)
      },
      onError: (error) => {
        console.error('❌ Execution error:', error)
        completeExecution()
        alert('Execution failed: ' + error)
      },
    })
  }

  const handleExecute = () => {
    if (!currentWorkflowId) {
      alert('⚠️ Please save the workflow first before executing!')
      return
    }

    if (nodes.length === 0) {
      alert('⚠️ Workflow is empty. Add some nodes first!')
      return
    }

    // Show input form modal
    setShowInputForm(true)
  }

  const executeWithInputData = async (inputData: Record<string, any>) => {
    setShowInputForm(false)

    try {
      // Auto-save before execution
      await saveWorkflow()

      const execution = await executionApi.create({
        workflow_id: currentWorkflowId!,
        input_data: inputData,
      })

      handleExecutionStart(execution)
    } catch (error: any) {
      console.error('Failed to create execution:', error)
      alert('Failed to start execution: ' + error.message)
    }
  }

  const handleExport = () => {
    const data = {
      name,
      nodes,
      edges,
      stateSchema,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCode = async () => {
    if (!currentWorkflowId) {
      alert('⚠️ Please save the workflow first!')
      return
    }

    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`/api/v1/workflows/${currentWorkflowId}/compile`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Compilation failed')
      }

      const result = await response.json()

      const blob = new Blob([result.code], { type: 'text/x-python' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name.replace(/\s+/g, '_')}_langgraph.py`
      a.click()
      URL.revokeObjectURL(url)

      alert('✅ LangGraph code exported successfully!')
    } catch (error) {
      console.error('Export code failed:', error)
      alert('❌ Failed to export code: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleLoadExample = () => {
    if (nodes.length > 0) {
      if (!confirm('⚠️ This will replace your current workflow. Continue?')) return
    }
    setNodes(exampleWorkflow.nodes)
    setEdges(exampleWorkflow.edges)
    setStateSchema(exampleWorkflow.stateSchema)
    setName(exampleWorkflow.name)
  }

  const handleLoadConditionalExample = () => {
    if (nodes.length > 0) {
      if (!confirm('⚠️ This will replace your current workflow. Continue?')) return
    }
    setNodes(conditionalWorkflow.nodes)
    setEdges(conditionalWorkflow.edges)
    setStateSchema(conditionalWorkflow.stateSchema)
    setName(conditionalWorkflow.name)
  }

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workflows')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to Workflows"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex flex-col">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-bold text-gray-900 border-none focus:ring-0 p-0 text-lg"
              placeholder="Workflow Name"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {isSaving ? (
                <span className="text-blue-600">Saving...</span>
              ) : lastSaved ? (
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span>Unsaved changes</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadExample}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 border border-yellow-200"
          >
            <Lightbulb className="w-4 h-4" />
            Basic
          </button>
          <button
            onClick={handleLoadConditionalExample}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 border border-orange-200"
          >
            <GitBranch className="w-4 h-4" />
            Conditional
          </button>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <button
            onClick={() => setShowStateDesigner(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" />
            Schema
            {stateSchema.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {stateSchema.length}
              </span>
            )}
          </button>

          <button
            onClick={() => saveWorkflow()}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <button
            onClick={handleExecute}
            disabled={executeMutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Run
          </button>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <button
            onClick={handleExportCode}
            disabled={!currentWorkflowId}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50"
            title="Export Code"
          >
            <Code className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowStateInspector(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            title="State Inspector"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </div>

      <InputFormModal
        isOpen={showInputForm}
        onClose={() => setShowInputForm(false)}
        onExecute={executeWithInputData}
      />

      <OutputViewer
        isOpen={showOutputViewer}
        onClose={() => setShowOutputViewer(false)}
        executionData={currentExecutionData}
      />

      <StateDesigner
        isOpen={showStateDesigner}
        onClose={() => setShowStateDesigner(false)}
        fields={stateSchema}
        onSave={(fields) => setStateSchema(fields)}
      />

      <StateInspector
        isOpen={showStateInspector}
        onClose={() => setShowStateInspector(false)}
        currentState={currentExecutionData?.output_data || {}}
        executionHistory={executionStateHistory}
      />
    </>
  )
}
