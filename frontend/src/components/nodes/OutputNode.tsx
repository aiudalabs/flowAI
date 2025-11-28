import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { FileOutput } from 'lucide-react'
import BaseNode from './BaseNode'

const OutputNode = memo((props: NodeProps) => {
  return (
    <BaseNode
      {...props}
      icon={<FileOutput className="w-4 h-4 text-red-600" />}
      color="border-red-500"
      handleBottom={false}
    />
  )
})

OutputNode.displayName = 'OutputNode'

export default OutputNode
