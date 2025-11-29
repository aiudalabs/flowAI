import { create } from 'zustand'
import { Execution } from '../types/workflow'
import { executionApi } from '../services/api'

export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'failed'

interface ExecutionState {
  currentExecutionId: string | null
  nodeStatuses: Record<string, NodeExecutionStatus>
  executionLogs: Array<{
    timestamp: string
    node_id?: string
    level: string
    message: string
    data?: any
  }>
  isExecuting: boolean

  // History & Selection
  executionHistory: Execution[]
  selectedExecution: Execution | null
  isLoadingHistory: boolean

  // Actions
  startExecution: (executionId: string) => void
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus) => void
  addLog: (log: any) => void
  completeExecution: () => void
  resetExecution: () => void

  // History Actions
  loadHistory: (workflowId: string) => Promise<void>
  selectExecution: (execution: Execution | null) => void
  loadExecutionDetails: (executionId: string) => Promise<void>
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  currentExecutionId: null,
  nodeStatuses: {},
  executionLogs: [],
  isExecuting: false,

  executionHistory: [],
  selectedExecution: null,
  isLoadingHistory: false,

  startExecution: (executionId) => {
    console.log('🚀 Starting execution in store:', executionId)
    set({
      currentExecutionId: executionId,
      nodeStatuses: {},
      executionLogs: [],
      isExecuting: true,
      selectedExecution: null // Clear selection when starting new run
    })
    console.log('✅ Execution started, isExecuting: true')
  },

  setNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodeStatuses: {
        ...state.nodeStatuses,
        [nodeId]: status,
      },
    }))
  },

  addLog: (log) => {
    // console.log('➕ Adding log to store:', log)
    set((state) => {
      const newLogs = [...state.executionLogs, log]
      return {
        executionLogs: newLogs,
      }
    })
  },

  completeExecution: () => {
    set({
      isExecuting: false,
    })
    // Refresh history if we have a workflow ID context (would need to track currentWorkflowId in this store or pass it)
  },

  resetExecution: () => {
    set({
      currentExecutionId: null,
      nodeStatuses: {},
      executionLogs: [],
      isExecuting: false,
    })
  },

  loadHistory: async (workflowId) => {
    set({ isLoadingHistory: true })
    try {
      const history = await executionApi.list(workflowId)
      set({ executionHistory: history })
    } catch (error) {
      console.error('Failed to load execution history:', error)
    } finally {
      set({ isLoadingHistory: false })
    }
  },

  selectExecution: (execution) => {
    set({ selectedExecution: execution })
  },

  loadExecutionDetails: async (executionId) => {
    try {
      const details = await executionApi.get(executionId)
      set({ selectedExecution: details })
    } catch (error) {
      console.error('Failed to load execution details:', error)
    }
  }
}))
