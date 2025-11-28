import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Globe } from 'lucide-react'
import BaseNode from './BaseNode'

const APINode = memo((props: NodeProps) => {
  return (
    <BaseNode
      {...props}
      icon={<Globe className="w-4 h-4 text-purple-600" />}
      color="border-purple-500"
    />
  )
})

APINode.displayName = 'APINode'

export default APINode
