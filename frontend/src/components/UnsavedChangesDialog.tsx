import { useBlocker } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

interface UnsavedChangesDialogProps {
    isDirty: boolean
}

export default function UnsavedChangesDialog({ isDirty }: UnsavedChangesDialogProps) {
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    )

    if (blocker.state !== 'blocked') {
        return null
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-100 rounded-full shrink-0">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Unsaved Changes
                        </h3>
                        <p className="text-gray-600 mb-6">
                            You have unsaved changes in your workflow. If you leave this page, your changes will be lost.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => blocker.reset()}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Stay
                            </button>
                            <button
                                onClick={() => blocker.proceed()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Discard Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
