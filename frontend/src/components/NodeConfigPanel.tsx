import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'
import type { NodeConfigData } from '@/types/workflow'

import { useQuery } from '@tanstack/react-query'
import { datasetApi } from '@/services/api'

export default function NodeConfigPanel() {
  const { selectedNode, updateNode, setSelectedNode } = useWorkflowStore()
  const { register, handleSubmit, reset } = useForm<NodeConfigData>()

  const { data: datasets, isLoading: isLoadingDatasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: datasetApi.list
  })

  useEffect(() => {
    if (selectedNode) {
      reset(selectedNode.data)
    }
  }, [selectedNode, reset])

  if (!selectedNode) {
    return null
  }

  const onSubmit = (data: NodeConfigData) => {
    console.log('Saving node config:', data)
    updateNode(selectedNode.id, data)
    alert(`✅ Node configuration saved!\n\nRemember to click "Save" in the toolbar to persist the workflow.`)
  }

  const renderNodeConfig = () => {
    switch (selectedNode.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                {...register('label')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Trigger name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Initial Message (optional)
              </label>
              <textarea
                {...register('message')}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Optional message to start workflow"
              />
            </div>
          </div>
        )

      case 'llm':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                {...register('label')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="LLM node name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                {...register('provider')}
                className="w-full px-3 py-2 border rounded-md"
                defaultValue="openai"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <select
                {...register('model')}
                className="w-full px-3 py-2 border rounded-md"
                defaultValue="gpt-4o-mini"
              >
                <optgroup label="OpenAI">
                  <option value="gpt-4o">GPT-4o (Latest, Recommended)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </optgroup>
                <optgroup label="Anthropic">
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                </optgroup>
                <optgroup label="Google">
                  <option value="gemini-pro">Gemini Pro</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a model or provider must match above
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <textarea
                {...register('prompt')}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                rows={6}
                placeholder="Enter your prompt here. Use {{variable}} for state variables."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <input
                  {...register('temperature', {
                    valueAsNumber: true,
                    setValueAs: (v) => v === '' ? 0.7 : parseFloat(v) || 0.7
                  })}
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.7"
                  defaultValue="0.7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Tokens</label>
                <input
                  {...register('max_tokens', {
                    valueAsNumber: true,
                    setValueAs: (v) => v === '' ? 1000 : parseInt(v) || 1000
                  })}
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="1000"
                  defaultValue="1000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Output Key</label>
              <input
                {...register('output_key')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="llm_output"
                defaultValue="llm_output"
              />
            </div>
          </div>
        )

      case 'api':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                {...register('label')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="API call name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                {...register('url')}
                type="url"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Method</label>
              <select
                {...register('method')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Output Key</label>
              <input
                {...register('output_key')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="api_response"
              />
            </div>
          </div>
        )

      case 'conditional':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                {...register('label')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Conditional name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <input
                {...register('condition')}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                placeholder="variable == value"
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: status == "success", count &gt; 10
              </p>
            </div>
          </div>
        )

      case 'output':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                {...register('label')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Output name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select
                {...register('format')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="json">JSON</option>
                <option value="text">Text</option>
                <option value="raw">Raw</option>
              </select>
            </div>
          </div>
        )

      case 'dataset':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                {...register('label')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Dataset name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Select Dataset</label>
              <select
                {...register('dataset_id')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a dataset...</option>
                {datasets?.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.file_type})
                  </option>
                ))}
              </select>
              {isLoadingDatasets && (
                <p className="text-xs text-gray-500 mt-1">Loading datasets...</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Output Key</label>
              <input
                {...register('output_key')}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="dataset_df"
                defaultValue="dataset_df"
              />
            </div>
          </div>
        )

      default:
        return <div>Unknown node type</div>
    }
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Configure Node</h2>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="px-3 py-2 bg-gray-100 rounded-md text-sm">
          <div className="font-medium">Type: {selectedNode.type}</div>
          <div className="text-xs text-gray-600">ID: {selectedNode.id}</div>
        </div>

        {renderNodeConfig()}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
