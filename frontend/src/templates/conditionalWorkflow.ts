import type { StateField } from '@/components/StateDesigner'

/**
 * Example workflow with conditional routing
 * Demonstrates sentiment-based customer support routing
 */
export const conditionalWorkflow = {
  name: "Customer Support Router",
  description: "Routes customers based on sentiment analysis with conditional edges",

  stateSchema: [
    {
      name: "customer_message",
      type: "str" as const,
      reducer: "none" as const,
      description: "Original customer message"
    },
    {
      name: "sentiment",
      type: "str" as const,
      reducer: "none" as const,
      description: "Detected sentiment (positive, negative, neutral)"
    },
    {
      name: "response",
      type: "str" as const,
      reducer: "none" as const,
      description: "Generated response based on sentiment"
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
      position: { x: 100, y: 250 },
      data: {
        label: "Start",
        message: "Customer support request received"
      }
    },
    {
      id: "llm_1",
      type: "llm",
      position: { x: 350, y: 250 },
      data: {
        label: "Analyze Sentiment",
        provider: "openai",
        model: "gpt-4",
        prompt: `Analyze the sentiment of this customer message and respond with ONLY one word: "positive", "negative", or "neutral".

Customer message: {{customer_message}}

Sentiment:`,
        output_key: "sentiment"
      }
    },
    {
      id: "llm_2",
      type: "llm",
      position: { x: 700, y: 100 },
      data: {
        label: "Positive Response",
        provider: "openai",
        model: "gpt-4",
        prompt: `The customer has a positive sentiment. Generate an enthusiastic, helpful response to their message.

Customer message: {{customer_message}}

Response:`,
        output_key: "response"
      }
    },
    {
      id: "llm_3",
      type: "llm",
      position: { x: 700, y: 250 },
      data: {
        label: "Negative Response",
        provider: "openai",
        model: "gpt-4",
        prompt: `The customer has a negative sentiment. Generate an empathetic, apologetic response that shows we understand their frustration.

Customer message: {{customer_message}}

Response:`,
        output_key: "response"
      }
    },
    {
      id: "llm_4",
      type: "llm",
      position: { x: 700, y: 400 },
      data: {
        label: "Neutral Response",
        provider: "openai",
        model: "gpt-4",
        prompt: `The customer has a neutral sentiment. Generate a professional, informative response.

Customer message: {{customer_message}}

Response:`,
        output_key: "response"
      }
    },
    {
      id: "output_1",
      type: "output",
      position: { x: 1000, y: 250 },
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
    // Conditional edges - one for each route
    {
      id: "e2-positive",
      source: "llm_1",
      target: "llm_2",
      type: "conditional",
      label: "If Positive",
      data: {
        routes: [
          {
            label: "If Positive",
            expression: "state['sentiment'].strip().lower() == 'positive'",
            output: "positive",
            target: "llm_2"
          },
          {
            label: "If Negative",
            expression: "state['sentiment'].strip().lower() == 'negative'",
            output: "negative",
            target: "llm_3"
          },
          {
            label: "If Neutral",
            expression: "state['sentiment'].strip().lower() == 'neutral'",
            output: "neutral",
            target: "llm_4"
          }
        ],
        defaultTarget: "llm_4"
      }
    },
    {
      id: "e2-negative",
      source: "llm_1",
      target: "llm_3",
      type: "conditional",
      label: "If Negative",
      data: {
        routes: [
          {
            label: "If Positive",
            expression: "state['sentiment'].strip().lower() == 'positive'",
            output: "positive",
            target: "llm_2"
          },
          {
            label: "If Negative",
            expression: "state['sentiment'].strip().lower() == 'negative'",
            output: "negative",
            target: "llm_3"
          },
          {
            label: "If Neutral",
            expression: "state['sentiment'].strip().lower() == 'neutral'",
            output: "neutral",
            target: "llm_4"
          }
        ],
        defaultTarget: "llm_4"
      }
    },
    {
      id: "e2-neutral",
      source: "llm_1",
      target: "llm_4",
      type: "conditional",
      label: "If Neutral / Default",
      data: {
        routes: [
          {
            label: "If Positive",
            expression: "state['sentiment'].strip().lower() == 'positive'",
            output: "positive",
            target: "llm_2"
          },
          {
            label: "If Negative",
            expression: "state['sentiment'].strip().lower() == 'negative'",
            output: "negative",
            target: "llm_3"
          },
          {
            label: "If Neutral",
            expression: "state['sentiment'].strip().lower() == 'neutral'",
            output: "neutral",
            target: "llm_4"
          }
        ],
        defaultTarget: "llm_4"
      }
    },
    // Connect all response nodes to output
    {
      id: "e3",
      source: "llm_2",
      target: "output_1",
      type: "smoothstep"
    },
    {
      id: "e4",
      source: "llm_3",
      target: "output_1",
      type: "smoothstep"
    },
    {
      id: "e5",
      source: "llm_4",
      target: "output_1",
      type: "smoothstep"
    }
  ]
}
