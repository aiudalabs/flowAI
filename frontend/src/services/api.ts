import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import type {
    Workflow,
    WorkflowCreate,
    WorkflowUpdate,
    Execution,
    ExecutionCreate
} from '../types/workflow'
import type { Dataset } from '../types/dataset'

const API_URL = 'http://localhost:8000/api/v1'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
        }
        return Promise.reject(error)
    }
)

export const workflowApi = {
    list: async (skip = 0, limit = 100) => {
        const response = await api.get<Workflow[]>(`/workflows?skip=${skip}&limit=${limit}`)
        return response.data
    },

    get: async (id: string) => {
        const response = await api.get<Workflow>(`/workflows/${id}`)
        return response.data
    },

    create: async (data: WorkflowCreate) => {
        const response = await api.post<Workflow>('/workflows', data)
        return response.data
    },

    update: async (id: string, data: WorkflowUpdate) => {
        const response = await api.put<Workflow>(`/workflows/${id}`, data)
        return response.data
    },

    delete: async (id: string) => {
        await api.delete(`/workflows/${id}`)
    },

    compile: async (id: string) => {
        const response = await api.get<any>(`/workflows/${id}/compile`)
        return response.data
    }
}

export const executionApi = {
    list: async (workflowId: string, skip = 0, limit = 50) => {
        const response = await api.get<Execution[]>(`/executions/workflow/${workflowId}?skip=${skip}&limit=${limit}`)
        return response.data
    },

    get: async (id: string) => {
        const response = await api.get<Execution>(`/executions/${id}`)
        return response.data
    },

    create: async (data: ExecutionCreate) => {
        const response = await api.post<Execution>('/executions', data)
        return response.data
    },

    getWebSocketUrl: (executionId: string) => {
        const token = useAuthStore.getState().token
        return `ws://localhost:8000/api/v1/executions/${executionId}/ws?token=${token}`
    },

    subscribeToExecution: (executionId: string, callbacks: {
        onStatus?: (status: string) => void
        onLog?: (log: any) => void
        onComplete?: (data: any) => void
        onError?: (error: any) => void
    }) => {
        const url = executionApi.getWebSocketUrl(executionId)
        const ws = new WebSocket(url)

        ws.onopen = () => {
            console.log('🔌 WebSocket connected')
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data.type === 'status') {
                    callbacks.onStatus?.(data.status)
                } else if (data.type === 'log') {
                    callbacks.onLog?.(data.log)
                } else if (data.type === 'complete') {
                    callbacks.onComplete?.(data)
                } else if (data.error) {
                    callbacks.onError?.(data.error)
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e)
            }
        }

        ws.onerror = (event) => {
            console.error('WebSocket error:', event)
            // WebSocket error events don't contain descriptive messages for security reasons
            // But usually it means connection failed (refused, 403, etc.)
            callbacks.onError?.('Connection failed. Please check if you are logged in.')
        }

        return ws
    }
}

export const datasetApi = {
    list: async () => {
        const response = await api.get<Dataset[]>('/datasets')
        return response.data
    },

    get: async (id: string) => {
        const response = await api.get<Dataset>(`/datasets/${id}`)
        return response.data
    },

    upload: async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        // Use filename as default name if not provided
        formData.append('name', file.name)

        const response = await api.post<Dataset>('/datasets/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    delete: async (id: string) => {
        await api.delete(`/datasets/${id}`)
    },

    getPreview: async (id: string) => {
        const response = await api.get<{ columns: string[], data: any[] }>(`/datasets/${id}/preview`)
        return response.data
    }
}

export default api
