import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    email: string
    username: string
    full_name?: string
    avatar_url?: string
    is_active: boolean
    is_verified: boolean
    created_at: string
    last_login?: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null

    // Actions
    login: (email: string, password: string) => Promise<void>
    register: (email: string, username: string, password: string, fullName?: string) => Promise<void>
    logout: () => void
    setUser: (user: User | null) => void
    setToken: (token: string | null) => void
    clearError: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null })

                try {
                    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.detail || 'Login failed')
                    }

                    const data = await response.json()
                    const token = data.access_token

                    // Get user info
                    const userResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    })

                    if (!userResponse.ok) {
                        throw new Error('Failed to get user info')
                    }

                    const user = await userResponse.json()

                    set({
                        token,
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    })
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error: error.message || 'Login failed',
                        isAuthenticated: false,
                        token: null,
                        user: null,
                    })
                    throw error
                }
            },

            register: async (email: string, username: string, password: string, fullName?: string) => {
                set({ isLoading: true, error: null })

                try {
                    const response = await fetch('http://localhost:8000/api/v1/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email,
                            username,
                            password,
                            full_name: fullName,
                        }),
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.detail || 'Registration failed')
                    }

                    await response.json()

                    // Auto-login after registration
                    await get().login(email, password)
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error: error.message || 'Registration failed',
                    })
                    throw error
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                })
            },

            setUser: (user) => set({ user }),
            setToken: (token) => set({ token, isAuthenticated: !!token }),
            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
