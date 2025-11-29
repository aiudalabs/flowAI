import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { LogOut, User, LayoutGrid, Database } from 'lucide-react'

export default function Layout() {
    const { user, logout } = useAuthStore()
    const location = useLocation()

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout()
        }
    }

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-blue-600 text-white p-1 rounded">FA</span>
                            FlowAI
                        </Link>
                    </div>

                    <nav className="flex items-center gap-1">
                        <Link
                            to="/"
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive('/') || isActive('/workflows')
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <LayoutGrid size={18} />
                            Workflows
                        </Link>
                        <Link
                            to="/datasets"
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive('/datasets')
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Database size={18} />
                            Datasets
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                        <User size={16} className="text-gray-500" />
                        <span className="text-gray-700 font-medium">{user?.email}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <Outlet />
            </div>
        </div>
    )
}
