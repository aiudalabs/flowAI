import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Play } from 'lucide-react'
import BaseNode from './BaseNode'

const TriggerNode = memo((props: NodeProps) => {
  return (
    <BaseNode
      {...props}
      icon={<Play className="w-4 h-4 text-green-600" />}
      color="border-green-500"
      handleTop={false}
    />
  )
})

TriggerNode.displayName = 'TriggerNode'

export default TriggerNode
