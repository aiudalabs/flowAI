import { useCallback, useRef, useState, DragEvent as ReactDragEvent } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  ConnectionMode,
  Edge as ReactFlowEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import { useWorkflowStore } from '@/store/workflowStore'
import ConditionalEdgeConfig from './ConditionalEdgeConfig'
import type { WorkflowNode } from '@/types/workflow'
import type { ConditionalEdgeData } from '@/types/conditional'

// Node counters for meaningful IDs
const nodeCounters: Record<string, number> = {}

const getNodeId = (type: string): string => {
  if (!nodeCounters[type]) {
    nodeCounters[type] = 1
  }
  const id = `${type}_${nodeCounters[type]}`
  nodeCounters[type]++
  return id
}

function WorkflowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    stateSchema,
    updateEdge,
  } = useWorkflowStore()

  const [showConditionalConfig, setShowConditionalConfig] = useState(false)
  const [selectedEdge, setSelectedEdge] = useState<ReactFlowEdge | null>(null)

  const onDragOver = useCallback((event: ReactDragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: ReactDragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      const newNode: WorkflowNode = {
        id: getNodeId(type),
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeCounters[type] - 1}`,
        },
      }

      addNode(newNode)
    },
    [addNode]
  )

  const onNodeClick = useCallback(
    (_event: any, node: WorkflowNode) => {
      setSelectedNode(node)
    },
    [setSelectedNode]
  )

  const onEdgeDoubleClick = useCallback(
    (_event: any, edge: ReactFlowEdge) => {
      setSelectedEdge(edge)
      setShowConditionalConfig(true)
    },
    []
  )

  const handleSaveConditionalRouting = useCallback(
    (data: ConditionalEdgeData) => {
      if (!selectedEdge) return

      // Update the edge with conditional data
      const updatedEdge = {
        ...selectedEdge,
        type: 'conditional',
        data,
        label: data.routes.length > 0 ? data.routes[0].label : 'Conditional'
      }

      updateEdge(selectedEdge.id, updatedEdge)
      setShowConditionalConfig(false)
      setSelectedEdge(null)
    },
    [selectedEdge, updateEdge]
  )

  return (
    <>
      <div ref={reactFlowWrapper} className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Conditional Edge Config Modal */}
      {selectedEdge && (
        <ConditionalEdgeConfig
          isOpen={showConditionalConfig}
          onClose={() => {
            setShowConditionalConfig(false)
            setSelectedEdge(null)
          }}
          sourceNodeId={selectedEdge.source}
          currentTarget={selectedEdge.target}
          availableNodes={nodes}
          stateSchema={stateSchema}
          initialData={selectedEdge.data as ConditionalEdgeData | undefined}
          onSave={handleSaveConditionalRouting}
        />
      )}
    </>
  )
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  )
}
