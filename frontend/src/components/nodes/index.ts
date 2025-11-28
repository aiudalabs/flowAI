import TriggerNode from './TriggerNode'
import LLMNode from './LLMNode'
import APINode from './APINode'
import ConditionalNode from './ConditionalNode'
import OutputNode from './OutputNode'

export const nodeTypes = {
  trigger: TriggerNode,
  llm: LLMNode,
  api: APINode,
  conditional: ConditionalNode,
  output: OutputNode,
}

export {
  TriggerNode,
  LLMNode,
  APINode,
  ConditionalNode,
  OutputNode,
}
