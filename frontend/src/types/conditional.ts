/**
 * Type definitions for conditional routing
 */

export interface ConditionalRoute {
  label: string  // Display label (e.g., "If Positive")
  expression: string  // Python expression (e.g., "state['sentiment'] == 'positive'")
  output: string  // Output key for routing function
  target: string  // Target node ID
}

export interface ConditionalEdgeData {
  routes: ConditionalRoute[]
  defaultTarget?: string  // Fallback target if no conditions match
}

export type EdgeType = 'default' | 'conditional' | 'smoothstep'

export interface ConditionalEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  label?: string
  data?: ConditionalEdgeData
  sourceHandle?: string | null
  targetHandle?: string | null
}
