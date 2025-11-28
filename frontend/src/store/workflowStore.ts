import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { WorkflowNode } from '@/types/workflow'

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNode: WorkflowNode | null

  // Actions
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: Connection) => void
  addNode: (node: WorkflowNode) => void
  updateNode: (nodeId: string, data: any) => void
  deleteNode: (nodeId: string) => void
  setSelectedNode: (node: WorkflowNode | null) => void
  clearWorkflow: () => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },

  onConnect: (connection) => {
    console.log('🔗 Connection attempt:', connection)

    // Validate connection
    if (!connection.source || !connection.target) {
      console.error('❌ Invalid connection: missing source or target')
      return
    }

    // Check if connection already exists
    const existingEdge = get().edges.find(
      (edge) =>
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle
    )

    if (existingEdge) {
      console.warn('⚠️ Connection already exists:', existingEdge)
      return
    }

    console.log('✅ Creating edge:', connection)
    const newEdges = addEdge(connection, get().edges)
    console.log('📊 Total edges after adding:', newEdges.length)

    set({
      edges: newEdges,
    })
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    })
  },

  updateNode: (nodeId, data) => {
    console.log('Updating node:', nodeId, 'with data:', data)
    const updatedNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    )
    console.log('Updated nodes:', updatedNodes)
    set({ nodes: updatedNodes })
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    })
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  clearWorkflow: () => set({ nodes: [], edges: [], selectedNode: null }),
}))
