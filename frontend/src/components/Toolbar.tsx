import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Play, FolderOpen, Download } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'
import { useExecutionStore } from '@/store/executionStore'
import { workflowsApi, executionsApi } from '@/lib/api'
import InputFormModal from './InputFormModal'
import OutputViewer from './OutputViewer'

export default function Toolbar() {
  const queryClient = useQueryClient()
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore()
  const {
    startExecution,
    setNodeStatus,
    addLog,
    completeExecution,
    resetExecution
  } = useExecutionStore()
  const [workflowName, setWorkflowName] = useState('Untitled Workflow')
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showInputForm, setShowInputForm] = useState(false)
  const [showOutputViewer, setShowOutputViewer] = useState(false)
  const [currentExecutionData, setCurrentExecutionData] = useState<any>(null)

  // Fetch workflows list
  const { data: workflows, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.list,
  })

  console.log('📦 Workflows data:', workflows)
  console.log('⏳ Loading workflows:', loadingWorkflows)

  // Save workflow mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const graphData = { nodes, edges }
      console.log('💾 Saving workflow with graph data:', graphData)
      console.log('📊 Nodes being saved:', nodes)
      console.log('🔗 Edges being saved:', edges)

      // Validate nodes have required fields
      const validatedNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {}
      }))

      // Validate edges have required fields
      const validatedEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        type: edge.type || null
      }))

      const validatedGraphData = {
        nodes: validatedNodes,
        edges: validatedEdges
      }

      console.log('✅ Validated graph data:', validatedGraphData)

      if (currentWorkflowId) {
        console.log('Updating existing workflow:', currentWorkflowId)
        return workflowsApi.update(currentWorkflowId, {
          name: workflowName,
          graph_data: validatedGraphData,
        })
      } else {
        console.log('Creating new workflow')
        return workflowsApi.create({
          name: workflowName,
          graph_data: validatedGraphData,
        })
      }
    },
    onSuccess: (data) => {
      setCurrentWorkflowId(data.id)
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      alert('Workflow saved successfully!')
    },
    onError: (error: any) => {
      console.error('❌ Save failed:', error)
      console.error('Error response:', error.response?.data)
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
      alert('Failed to save workflow: ' + errorMsg)
    },
  })

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      console.log('Execute clicked. Current workflow ID:', currentWorkflowId)
      console.log('Nodes:', nodes)
      console.log('Edges:', edges)

      if (!currentWorkflowId) {
        throw new Error('Please save the workflow first')
      }

      if (nodes.length === 0) {
        throw new Error('Workflow is empty. Add some nodes first.')
      }

      console.log('Creating execution...')
      return executionsApi.create({
        workflow_id: currentWorkflowId,
        input_data: {},
      })
    },
    onSuccess: (execution) => {
      console.log('Execution created:', execution)

      // Start visual execution tracking
      startExecution(execution.id)
      resetExecution()
      startExecution(execution.id)

      // Subscribe to execution updates
      const ws = executionsApi.subscribeToExecution(execution.id, {
        onStatus: (status) => {
          console.log('📊 Execution status:', status)
        },
        onLog: (log) => {
          console.log('📝 Execution log:', log)
          addLog(log)

          // Update node status based on log messages
          if (log.node_id) {
            if (log.message.includes('Executing node')) {
              setNodeStatus(log.node_id, 'running')
            } else if (log.message.includes('Node completed')) {
              setNodeStatus(log.node_id, 'completed')
            } else if (log.message.includes('Node failed') || log.level === 'error') {
              setNodeStatus(log.node_id, 'failed')
            }
          }
        },
        onComplete: (data) => {
          console.log('✅ Execution complete:', data)
          completeExecution()

          // Show results
          const output = data.output || data.output_data
          if (output) {
            console.log('📤 Final Output:', output)
          }

          alert(`✅ Execution completed!\n\nStatus: ${data.status}\n\nCheck console for full output.`)
        },
        onError: (error) => {
          console.error('❌ Execution error:', error)
          completeExecution()
          alert('Execution failed: ' + error)
        },
      })

      console.log('WebSocket connection established')
    },
    onError: (error: any) => {
      console.error('Execution error:', error)
      alert('Failed to execute workflow: ' + error.message)
    },
  })

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

  const executeWithInputData = (inputData: Record<string, any>) => {
    console.log('Starting execution with input data:', inputData)

    // Update the mutation to use input data
    executionsApi.create({
      workflow_id: currentWorkflowId!,
      input_data: inputData,
    }).then((execution) => {
      console.log('Execution created:', execution)

      // Start visual execution tracking
      resetExecution()
      startExecution(execution.id)

      // Subscribe to execution updates
      executionsApi.subscribeToExecution(execution.id, {
        onStatus: (status) => {
          console.log('📊 Status update:', status)
        },
        onLog: (log) => {
          console.log('📝 Log received:', log)
          addLog(log)

          // Update node status based on log messages
          if (log.node_id) {
            if (log.message.includes('Executing node')) {
              setNodeStatus(log.node_id, 'running')
            } else if (log.message.includes('Node completed')) {
              setNodeStatus(log.node_id, 'completed')
            } else if (log.message.includes('Node failed') || log.level === 'error') {
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
            output_data: data.output,
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
    }).catch((error) => {
      console.error('Failed to create execution:', error)
      alert('Failed to start execution: ' + error.message)
    })
  }

  const handleLoad = async (workflowId: string) => {
    console.log('🔍 Loading workflow:', workflowId)

    try {
      // Fetch the full workflow details (including graph_data)
      const workflow = await workflowsApi.get(workflowId)
      console.log('✅ Fetched workflow:', workflow)
      console.log('📊 Graph data:', workflow.graph_data)
      console.log('🔢 Nodes to load:', workflow.graph_data.nodes)
      console.log('🔗 Edges to load:', workflow.graph_data.edges)

      setNodes(workflow.graph_data.nodes)
      setEdges(workflow.graph_data.edges)
      setWorkflowName(workflow.name)
      setCurrentWorkflowId(workflow.id)
      setShowLoadDialog(false)

      console.log('✅ Workflow loaded successfully!')
      alert(`✅ Workflow "${workflow.name}" loaded!`)
    } catch (error) {
      console.error('❌ Failed to load workflow:', error)
      alert('❌ Failed to load workflow: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleExport = () => {
    const data = {
      name: workflowName,
      nodes,
      edges,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-600">FlowAI</h1>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-3 py-1 border rounded-md"
            placeholder="Workflow name"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoadDialog(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            <FolderOpen className="w-4 h-4" />
            Load
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleExecute}
            disabled={executeMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            title={!currentWorkflowId ? 'Save workflow first to enable execution' : 'Execute workflow'}
          >
            <Play className="w-4 h-4" />
            {executeMutation.isPending ? 'Executing...' : 'Execute'}
          </button>
          {!currentWorkflowId && (
            <span className="text-sm text-gray-500">← Save first</span>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Load Workflow</h2>

            {loadingWorkflows ? (
              <div className="text-center text-gray-500 py-8">
                <p>Loading workflows...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workflows && workflows.length > 0 ? (
                  workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => {
                        console.log('🖱️ Clicked workflow:', workflow.id, workflow.name)
                        handleLoad(workflow.id)
                      }}
                      className="w-full text-left px-4 py-3 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">{workflow.name}</div>
                      <div className="text-sm text-gray-500">
                        Updated: {new Date(workflow.updated_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {workflow.id.substring(0, 8)}...
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p className="font-medium">No workflows found</p>
                    <p className="text-sm mt-2">Create and save a workflow first!</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowLoadDialog(false)}
              className="mt-4 w-full px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Form Modal */}
      <InputFormModal
        isOpen={showInputForm}
        onClose={() => setShowInputForm(false)}
        onExecute={executeWithInputData}
      />

      {/* Output Viewer */}
      <OutputViewer
        isOpen={showOutputViewer}
        onClose={() => setShowOutputViewer(false)}
        executionData={currentExecutionData}
      />
    </>
  )
}
