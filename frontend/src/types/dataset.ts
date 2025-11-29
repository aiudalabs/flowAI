export interface Dataset {
    id: string
    name: string
    description?: string
    file_type: string
    size_bytes: number
    row_count: number
    columns: DatasetColumn[]
    created_at: string
    updated_at: string
}

export interface DatasetColumn {
    name: string
    type: string
    sample_values?: any[]
}

export interface DatasetCreate {
    name: string
    description?: string
    file: File
}

export interface DatasetPreview {
    columns: string[]
    data: Record<string, any>[]
}
