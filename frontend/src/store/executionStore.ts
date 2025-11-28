import { create } from 'zustand'

export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'failed'

interface ExecutionState {
  currentExecutionId: string | null
  nodeStatuses: Record<string, NodeExecutionStatus>
  executionLogs: Array<{
    timestamp: string
    nodeId?: string
    level: string
    message: string
    data?: any
  }>
  isExecuting: boolean

  // Actions
  startExecution: (executionId: string) => void
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus) => void
  addLog: (log: any) => void
  completeExecution: () => void
  resetExecution: () => void
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  currentExecutionId: null,
  nodeStatuses: {},
  executionLogs: [],
  isExecuting: false,

  startExecution: (executionId) => {
    set({
      currentExecutionId: executionId,
      nodeStatuses: {},
      executionLogs: [],
      isExecuting: true,
    })
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
    set((state) => ({
      executionLogs: [...state.executionLogs, log],
    }))
  },

  completeExecution: () => {
    set({
      isExecuting: false,
    })
  },

  resetExecution: () => {
    set({
      currentExecutionId: null,
      nodeStatuses: {},
      executionLogs: [],
      isExecuting: false,
    })
  },
}))
