import type { StateField } from '@/components/StateDesigner'

export const exampleWorkflow = {
  name: "AI Research Assistant",
  description: "An example workflow that analyzes a research topic and generates insights",

  stateSchema: [
    {
      name: "topic",
      type: "str" as const,
      reducer: "none" as const,
      description: "The research topic to analyze"
    },
    {
      name: "analysis",
      type: "str" as const,
      reducer: "none" as const,
      description: "LLM analysis of the topic"
    },
    {
      name: "summary",
      type: "str" as const,
      reducer: "none" as const,
      description: "Summary of key insights"
    },
    {
      name: "messages",
      type: "list" as const,
      reducer: "add_messages" as const,
      description: "Conversation history"
    }
  ] as StateField[],

  nodes: [
    {
      id: "trigger_1",
      type: "trigger",
      position: { x: 100, y: 200 },
      data: {
        label: "Start",
        message: "Starting research analysis"
      }
    },
    {
      id: "llm_1",
      type: "llm",
      position: { x: 350, y: 150 },
      data: {
        label: "Analyze Topic",
        provider: "openai",
        model: "gpt-4",
        prompt: "Analyze the following research topic in detail: {{topic}}\n\nProvide a comprehensive analysis covering:\n1. Main concepts and definitions\n2. Current state of the field\n3. Key challenges and opportunities\n4. Future directions",
        output_key: "analysis"
      }
    },
    {
      id: "llm_2",
      type: "llm",
      position: { x: 650, y: 200 },
      data: {
        label: "Generate Summary",
        provider: "openai",
        model: "gpt-4",
        prompt: "Based on this analysis:\n\n{{analysis}}\n\nGenerate a concise executive summary with the 3 most important insights.",
        output_key: "summary"
      }
    },
    {
      id: "output_1",
      type: "output",
      position: { x: 900, y: 200 },
      data: {
        label: "Final Output"
      }
    }
  ],

  edges: [
    {
      id: "e1",
      source: "trigger_1",
      target: "llm_1",
      type: "smoothstep"
    },
    {
      id: "e2",
      source: "llm_1",
      target: "llm_2",
      type: "smoothstep"
    },
    {
      id: "e3",
      source: "llm_2",
      target: "output_1",
      type: "smoothstep"
    }
  ]
}
