import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow'

export default function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  label,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#f59e0b',  // Orange
          strokeWidth: 2.5,
          strokeDasharray: '5,5',  // Dashed line
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs font-medium text-orange-800">
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
