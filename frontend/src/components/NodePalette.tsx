import { Play, Brain, Globe, GitBranch, FileOutput } from 'lucide-react'

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void
}

const nodeDefinitions = [
  {
    type: 'trigger',
    label: 'Trigger',
    icon: Play,
    color: 'bg-green-100 border-green-300 text-green-700',
    description: 'Start the workflow',
  },
  {
    type: 'llm',
    label: 'LLM',
    icon: Brain,
    color: 'bg-blue-100 border-blue-300 text-blue-700',
    description: 'Call an LLM',
  },
  {
    type: 'api',
    label: 'API Call',
    icon: Globe,
    color: 'bg-purple-100 border-purple-300 text-purple-700',
    description: 'Make HTTP request',
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: GitBranch,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    description: 'Branch logic',
  },
  {
    type: 'output',
    label: 'Output',
    icon: FileOutput,
    color: 'bg-red-100 border-red-300 text-red-700',
    description: 'Final output',
  },
]

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">Nodes</h2>
      <div className="space-y-2">
        {nodeDefinitions.map((node) => {
          const Icon = node.icon
          return (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border-2 cursor-move
                hover:shadow-md transition-shadow
                ${node.color}
              `}
            >
              <Icon className="w-5 h-5" />
              <div>
                <div className="font-medium text-sm">{node.label}</div>
                <div className="text-xs opacity-75">{node.description}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p className="font-medium mb-1">Tip:</p>
        <p>Drag and drop nodes onto the canvas to build your workflow</p>
      </div>
    </div>
  )
}
