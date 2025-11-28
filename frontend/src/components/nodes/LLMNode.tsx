import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Brain } from 'lucide-react'
import BaseNode from './BaseNode'

const LLMNode = memo((props: NodeProps) => {
  return (
    <BaseNode
      {...props}
      icon={<Brain className="w-4 h-4 text-blue-600" />}
      color="border-blue-500"
    />
  )
})

LLMNode.displayName = 'LLMNode'

export default LLMNode
