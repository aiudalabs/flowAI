import { create } from 'zustand'
import { Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { WorkflowNode } from '@/types/workflow'
import type { StateField } from '@/components/StateDesigner'
import { workflowApi } from '@/services/api'

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNode: WorkflowNode | null
  stateSchema: StateField[]  // LangGraph state schema
  name: string
  description: string
  currentWorkflowId: string | null
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean

  // Actions
  setName: (name: string) => void
  setDescription: (description: string) => void
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: Edge[]) => void
  setStateSchema: (schema: StateField[]) => void
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: Connection) => void
  addNode: (node: WorkflowNode) => void
  updateNode: (nodeId: string, data: any) => void
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void
  deleteNode: (nodeId: string) => void
  setSelectedNode: (node: WorkflowNode | null) => void
  clearWorkflow: () => void

  // Persistence
  loadWorkflow: (id: string) => Promise<void>
  saveWorkflow: () => Promise<void>
  createWorkflow: (name: string, description?: string) => Promise<string>
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  stateSchema: [],  // Initialize empty state schema
  name: 'Untitled Workflow',
  description: '',
  currentWorkflowId: null,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,

  setName: (name) => set({ name, hasUnsavedChanges: true }),
  setDescription: (description) => set({ description, hasUnsavedChanges: true }),
  setNodes: (nodes) => set({ nodes, hasUnsavedChanges: true }),

  setEdges: (edges) => set({ edges, hasUnsavedChanges: true }),

  setStateSchema: (schema) => set({ stateSchema: schema, hasUnsavedChanges: true }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      hasUnsavedChanges: true
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      hasUnsavedChanges: true
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
      hasUnsavedChanges: true
    })
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
      hasUnsavedChanges: true
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
    set({ nodes: updatedNodes, hasUnsavedChanges: true })
  },

  updateEdge: (edgeId, updates) => {
    console.log('Updating edge:', edgeId, 'with updates:', updates)
    const updatedEdges = get().edges.map((edge) =>
      edge.id === edgeId
        ? { ...edge, ...updates }
        : edge
    )
    console.log('Updated edges:', updatedEdges)
    set({ edges: updatedEdges, hasUnsavedChanges: true })
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      hasUnsavedChanges: true
    })
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  clearWorkflow: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    stateSchema: [],
    name: 'Untitled Workflow',
    description: '',
    currentWorkflowId: null,
    lastSaved: null,
    hasUnsavedChanges: false
  }),

  loadWorkflow: async (id) => {
    try {
      const workflow = await workflowApi.get(id)
      set({
        currentWorkflowId: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        nodes: workflow.graph_data.nodes || [],
        edges: workflow.graph_data.edges || [],
        stateSchema: workflow.graph_data.state_schema || [],
        lastSaved: new Date(workflow.updated_at),
        hasUnsavedChanges: false
      })
    } catch (error) {
      console.error('Failed to load workflow:', error)
      throw error
    }
  },

  saveWorkflow: async () => {
    const { currentWorkflowId, nodes, edges, stateSchema } = get()
    if (!currentWorkflowId) return

    set({ isSaving: true })
    try {
      const workflow = await workflowApi.update(currentWorkflowId, {
        name: get().name,
        description: get().description,
        graph_data: {
          nodes,
          edges,
          state_schema: stateSchema
        }
      })
      set({
        lastSaved: new Date(workflow.updated_at),
        isSaving: false,
        hasUnsavedChanges: false
      })
    } catch (error) {
      console.error('Failed to save workflow:', error)
      set({ isSaving: false })
      throw error
    }
  },

  createWorkflow: async (name, description) => {
    try {
      const workflow = await workflowApi.create({
        name,
        description,
        graph_data: { nodes: [], edges: [], state_schema: [] }
      })
      set({
        currentWorkflowId: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        nodes: [],
        edges: [],
        stateSchema: [],
        lastSaved: new Date(workflow.created_at),
        hasUnsavedChanges: false
      })
      return workflow.id
    } catch (error) {
      console.error('Failed to create workflow:', error)
      throw error
    }
  }
}))
