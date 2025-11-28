import { DragEvent as ReactDragEvent } from 'react'
import NodePalette from './components/NodePalette'
import WorkflowCanvas from './components/WorkflowCanvas'
import NodeConfigPanel from './components/NodeConfigPanel'
import Toolbar from './components/Toolbar'
import ExecutionPanel from './components/ExecutionPanel'

function App() {
  const onDragStart = (event: ReactDragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <NodePalette onDragStart={onDragStart} />
        <WorkflowCanvas />
        <NodeConfigPanel />
      </div>
      <ExecutionPanel />
    </div>
  )
}

export default App
