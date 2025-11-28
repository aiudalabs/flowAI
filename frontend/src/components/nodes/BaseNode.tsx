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
  handleLeft?: boolean
  handleRight?: boolean
}

const BaseNode = memo(({
  id,
  data,
  selected,
  icon,
  color,
  handleTop = true,
  handleBottom = true,
  handleLeft = true,
  handleRight = true
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
        'px-4 py-3 shadow-md rounded-md bg-white border-2 transition-all duration-300 relative',
        selected ? 'ring-2 ring-blue-500' : '',
        color,
        getStatusStyles()
      )}
    >
      {/* Top Handle - Input */}
      {handleTop && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
        />
      )}

      {/* Left Handle - Both input and output */}
      {handleLeft && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="left-target"
            className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
            style={{ top: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Left}
            id="left-source"
            className="w-3 h-3 !bg-gray-400 hover:!bg-green-500 transition-colors"
            style={{ top: '50%' }}
          />
        </>
      )}

      {/* Right Handle - Both input and output */}
      {handleRight && (
        <>
          <Handle
            type="target"
            position={Position.Right}
            id="right-target"
            className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
            style={{ top: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right-source"
            className="w-3 h-3 !bg-gray-400 hover:!bg-green-500 transition-colors"
            style={{ top: '50%' }}
          />
        </>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6">
          {icon}
        </div>
        <div className="flex-1 text-sm font-medium">{data.label || 'Node'}</div>
        {getStatusIcon()}
      </div>

      {/* Bottom Handle - Output */}
      {handleBottom && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="w-3 h-3 !bg-gray-400 hover:!bg-green-500 transition-colors"
        />
      )}
    </div>
  )
})

BaseNode.displayName = 'BaseNode'

export default BaseNode
