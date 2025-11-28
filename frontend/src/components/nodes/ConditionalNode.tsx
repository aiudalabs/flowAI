import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { GitBranch } from 'lucide-react'
import BaseNode from './BaseNode'

const ConditionalNode = memo((props: NodeProps) => {
  return (
    <BaseNode
      {...props}
      icon={<GitBranch className="w-4 h-4 text-yellow-600" />}
      color="border-yellow-500"
    />
  )
})

ConditionalNode.displayName = 'ConditionalNode'

export default ConditionalNode
