import { useState, useEffect } from 'react'
import { X, Plus, Trash2, GitBranch, AlertCircle } from 'lucide-react'
import type { ConditionalRoute, ConditionalEdgeData } from '@/types/conditional'
import type { StateField } from './StateDesigner'
import type { WorkflowNode } from '@/types/workflow'

interface ConditionalEdgeConfigProps {
  isOpen: boolean
  onClose: () => void
  sourceNodeId: string
  currentTarget: string
  availableNodes: WorkflowNode[]
  stateSchema: StateField[]
  initialData?: ConditionalEdgeData
  onSave: (data: ConditionalEdgeData) => void
}

export default function ConditionalEdgeConfig({
  isOpen,
  onClose,
  sourceNodeId,
  currentTarget,
  availableNodes,
  stateSchema,
  initialData,
  onSave
}: ConditionalEdgeConfigProps) {
  const [routes, setRoutes] = useState<ConditionalRoute[]>(
    initialData?.routes || [
      {
        label: 'If true',
        expression: '',
        output: 'branch_1',
        target: currentTarget
      }
    ]
  )
  const [defaultTarget, setDefaultTarget] = useState<string>(
    initialData?.defaultTarget || ''
  )

  // Sync with initialData when it changes
  useEffect(() => {
    if (initialData) {
      setRoutes(initialData.routes)
      setDefaultTarget(initialData.defaultTarget || '')
    }
  }, [initialData])

  if (!isOpen) return null

  const addRoute = () => {
    const newRoute: ConditionalRoute = {
      label: `Branch ${routes.length + 1}`,
      expression: '',
      output: `branch_${routes.length + 1}`,
      target: ''
    }
    setRoutes([...routes, newRoute])
  }

  const updateRoute = (index: number, field: keyof ConditionalRoute, value: string) => {
    const updated = [...routes]
    updated[index] = { ...updated[index], [field]: value }
    setRoutes(updated)
  }

  const removeRoute = (index: number) => {
    setRoutes(routes.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    // Validate
    const errors: string[] = []

    routes.forEach((route, index) => {
      if (!route.expression || route.expression.trim() === '') {
        errors.push(`Route ${index + 1}: Expression is required`)
      }
      if (!route.target || route.target === '') {
        errors.push(`Route ${index + 1}: Target node is required`)
      }
    })

    if (errors.length > 0) {
      alert('Validation errors:\n' + errors.join('\n'))
      return
    }

    // Save
    onSave({
      routes,
      defaultTarget: defaultTarget || undefined
    })
    onClose()
  }

  // Available target nodes (exclude source and current node)
  const targetOptions = availableNodes.filter(n => n.id !== sourceNodeId)

  // Get state field names for autocomplete hints
  const stateFieldNames = stateSchema.map(f => f.name)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold">Configure Conditional Routing</h2>
              <p className="text-sm text-gray-500">Source: {sourceNodeId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Conditional routing evaluates expressions in order.</p>
              <p>Use Python syntax to check state values. Example: <code className="bg-blue-100 px-1 rounded">state['sentiment'] == 'positive'</code></p>
              {stateFieldNames.length > 0 && (
                <p className="mt-2">Available state fields: {stateFieldNames.map(f => <code key={f} className="bg-blue-100 px-1 rounded mr-1">{f}</code>)}</p>
              )}
            </div>
          </div>

          {/* Routes */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-700">Routes (evaluated in order)</h3>

            {routes.map((route, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-sm font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={route.label}
                      onChange={(e) => updateRoute(index, 'label', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md font-medium"
                      placeholder="Branch label"
                    />
                  </div>
                  <button
                    onClick={() => removeRoute(index)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Remove route"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Expression */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition Expression
                    </label>
                    <input
                      type="text"
                      value={route.expression}
                      onChange={(e) => updateRoute(index, 'expression', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      placeholder="state['field'] == 'value'"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Python expression that returns True/False
                    </p>
                  </div>

                  {/* Target */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Node
                    </label>
                    <select
                      value={route.target}
                      onChange={(e) => updateRoute(index, 'target', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Select target --</option>
                      {targetOptions.map(node => (
                        <option key={node.id} value={node.id}>
                          {node.data.label || node.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Output Key (auto-generated but editable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Output Key (for routing function)
                    </label>
                    <input
                      type="text"
                      value={route.output}
                      onChange={(e) => updateRoute(index, 'output', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      placeholder="branch_1"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addRoute}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Add Route
            </button>
          </div>

          {/* Default Route */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-3">Default Route (Optional)</h3>
            <p className="text-sm text-gray-600 mb-3">
              If no conditions match, route to this node:
            </p>
            <select
              value={defaultTarget}
              onChange={(e) => setDefaultTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">-- No default (raise error) --</option>
              {targetOptions.map(node => (
                <option key={node.id} value={node.id}>
                  {node.data.label || node.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {routes.length} route{routes.length !== 1 ? 's' : ''} configured
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Save Routing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
