import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'
import { useExecutionStore } from '@/store/executionStore'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface BaseNodeProps extends NodeProps {
  icon: React.ReactNode
  color: string
  handleTop?: boolean
  handleBottom?: boolean
}

const BaseNode = memo(({
  id,
  data,
  selected,
  icon,
  color,
  handleTop = true,
  handleBottom = true
}: BaseNodeProps) => {
  const nodeStatus = useExecutionStore((state) => state.nodeStatuses[id])

  // Determine visual state based on execution status
  const getStatusStyles = () => {
    switch (nodeStatus) {
      case 'running':
        return 'ring-2 ring-yellow-400 animate-pulse bg-yellow-50'
      case 'completed':
        return 'ring-2 ring-green-500 bg-green-50'
      case 'failed':
        return 'ring-2 ring-red-500 bg-red-50'
      default:
        return ''
    }
  }

  const getStatusIcon = () => {
    switch (nodeStatus) {
      case 'running':
        return <Loader2 className="w-3 h-3 text-yellow-600 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'px-4 py-3 shadow-md rounded-md bg-white border-2 transition-all duration-300',
        selected ? 'ring-2 ring-blue-500' : '',
        color,
        getStatusStyles()
      )}
    >
      {handleTop && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400"
        />
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6">
          {icon}
        </div>
        <div className="flex-1 text-sm font-medium">{data.label || 'Node'}</div>
        {getStatusIcon()}
      </div>

      {handleBottom && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
    </div>
  )
})

BaseNode.displayName = 'BaseNode'

export default BaseNode
