import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowApi } from '../services/api'
import type { WorkflowCreate, WorkflowUpdate } from '../types/workflow'

export const useWorkflows = () => {
    return useQuery({
        queryKey: ['workflows'],
        queryFn: () => workflowApi.list(),
    })
}

export const useWorkflow = (id: string | undefined) => {
    return useQuery({
        queryKey: ['workflow', id],
        queryFn: () => workflowApi.get(id!),
        enabled: !!id,
    })
}

export const useCreateWorkflow = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: WorkflowCreate) => workflowApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] })
        },
    })
}

export const useUpdateWorkflow = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: WorkflowUpdate }) =>
            workflowApi.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', data.id] })
        },
    })
}

export const useDeleteWorkflow = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => workflowApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] })
        },
    })
}

export const useCompileWorkflow = () => {
    return useMutation({
        mutationFn: (id: string) => workflowApi.compile(id),
    })
}
