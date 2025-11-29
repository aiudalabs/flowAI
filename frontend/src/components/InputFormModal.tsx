import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Play } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

interface InputFormModalProps {
  isOpen: boolean
  onClose: () => void
  onExecute: (inputData: Record<string, any>) => void
}

export default function InputFormModal({ isOpen, onClose, onExecute }: InputFormModalProps) {
  const { nodes } = useWorkflowStore()
  const [variables, setVariables] = useState<string[]>([])
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (isOpen) {
      // Extract all {{variable}} from node prompts and configs
      const foundVars = new Set<string>()

      nodes.forEach(node => {
        const data = node.data

        // Check prompt field (for LLM nodes)
        if (data.prompt) {
          const matches = data.prompt.match(/\{\{(\w+)\}\}/g)
          if (matches) {
            matches.forEach((match: string) => {
              const varName = match.replace(/\{\{|\}\}/g, '')
              foundVars.add(varName)
            })
          }
        }

        // Check URL field (for API nodes)
        if (data.url) {
          const matches = data.url.match(/\{\{(\w+)\}\}/g)
          if (matches) {
            matches.forEach((match: string) => {
              const varName = match.replace(/\{\{|\}\}/g, '')
              foundVars.add(varName)
            })
          }
        }

        // Check message field (for trigger nodes)
        if (data.message) {
          const matches = data.message.match(/\{\{(\w+)\}\}/g)
          if (matches) {
            matches.forEach((match: string) => {
              const varName = match.replace(/\{\{|\}\}/g, '')
              foundVars.add(varName)
            })
          }
        }
      })

      setVariables(Array.from(foundVars))
      reset()
    }
  }, [isOpen, nodes, reset])

  const onSubmit = (data: Record<string, any>) => {
    console.log('📝 Input form submitted with data:', data)
    onExecute(data)
    // Don't call onClose() here - let the parent handle it
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold">Workflow Input</h2>
            <p className="text-sm text-gray-500">
              {variables.length > 0
                ? `Provide values for ${variables.length} variable${variables.length > 1 ? 's' : ''}`
                : 'No variables found - execute directly'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {variables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No variables detected in this workflow.</p>
                <p className="text-sm mt-2">
                  Use <code className="bg-gray-100 px-1 rounded">{'{{variable}}'}</code> in prompts to add inputs.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {variables.map((varName) => (
                  <div key={varName}>
                    <label className="block text-sm font-medium mb-1 capitalize">
                      {varName.replace(/_/g, ' ')}
                    </label>
                    <textarea
                      {...register(varName)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder={`Enter ${varName}...`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will replace <code className="bg-gray-100 px-1 rounded">{`{{${varName}}}`}</code> in the workflow
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              Execute Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
