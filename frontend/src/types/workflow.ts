import { Node, Edge } from 'reactflow'

export interface WorkflowNode extends Node {
  data: {
    label?: string
    [key: string]: any
  }
}

export interface GraphData {
  nodes: WorkflowNode[]
  edges: Edge[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
}

export interface Workflow {
  id: string
  name: string
  description?: string
  graph_data: GraphData
  compiled_code?: string
  created_at: string
  updated_at: string
}

export interface WorkflowCreate {
  name: string
  description?: string
  graph_data: GraphData
}

export interface WorkflowUpdate {
  name?: string
  description?: string
  graph_data?: GraphData
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type LogLevel = 'debug' | 'info' | 'warning' | 'error'

export interface ExecutionLog {
  id: string
  node_id?: string
  level: LogLevel
  message: string
  data?: Record<string, any>
  timestamp: string
}

export interface Execution {
  id: string
  workflow_id: string
  status: ExecutionStatus
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
  logs: ExecutionLog[]
}

export interface ExecutionCreate {
  workflow_id: string
  input_data?: Record<string, any>
}

export interface NodeConfigData {
  // Common fields
  label?: string

  // Trigger node
  message?: string

  // LLM node
  provider?: 'openai' | 'anthropic' | 'google'
  model?: string
  prompt?: string
  temperature?: number
  max_tokens?: number
  output_key?: string

  // API node
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: Record<string, any>

  // Conditional node
  condition?: string
  condition_type?: 'simple' | 'complex'

  // Output node
  format?: 'json' | 'text' | 'raw'
}
