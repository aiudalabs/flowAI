import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />
    }

    // Render child routes if authenticated
    return <Outlet />
}
