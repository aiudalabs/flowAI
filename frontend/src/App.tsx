import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import WorkflowList from './pages/WorkflowList'
import Datasets from './pages/Datasets'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { useAuthStore } from './stores/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  const router = createBrowserRouter([
    {
      path: "/login",
      element: isAuthenticated ? <Navigate to="/" replace /> : <Login />
    },
    {
      path: "/register",
      element: isAuthenticated ? <Navigate to="/" replace /> : <Register />
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <Layout />,
          children: [
            {
              path: "/",
              element: <WorkflowList />
            },
            {
              path: "/workflows",
              element: <WorkflowList />
            },
            {
              path: "/workflows/:id",
              element: <Dashboard />
            },
            {
              path: "/datasets",
              element: <Datasets />
            }
          ]
        }
      ]
    },
    {
      path: "*",
      element: <Navigate to={isAuthenticated ? "/" : "/login"} replace />
    }
  ])

  return <RouterProvider router={router} />
}

export default App
