import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'

type Task = {
  id: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dependencies: string[]
  status?: string
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 60

const PRIORITY_COLORS: Record<string, string> = {
  high: '#fca5a5',
  medium: '#fcd34d',
  low: '#86efac',
}

function layoutGraph(tasks: Task[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 40 })

  for (const task of tasks) {
    g.setNode(task.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const task of tasks) {
    for (const dep of task.dependencies) {
      g.setEdge(dep, task.id)
    }
  }

  dagre.layout(g)

  const nodes: Node[] = tasks.map((task) => {
    const pos = g.node(task.id)
    return {
      id: task.id,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { label: task.description },
      style: {
        background: task.status === 'blocked' ? '#e5e7eb' : (PRIORITY_COLORS[task.priority] ?? '#e0e7ff'),
        border: '1px solid #d1d5db',
        borderRadius: 8,
        fontSize: 12,
        width: NODE_WIDTH,
        padding: '8px 12px',
        opacity: task.status === 'blocked' ? 0.6 : 1,
      },
    }
  })

  const edges: Edge[] = tasks.flatMap((task) =>
    task.dependencies.map((dep) => ({
      id: `${dep}->${task.id}`,
      source: dep,
      target: task.id,
      type: 'smoothstep',
      style: { stroke: '#9ca3af' },
    }))
  )

  return { nodes, edges }
}

export function DependencyGraph({ tasks }: { tasks: Task[] }) {
  const { nodes, edges } = useMemo(() => layoutGraph(tasks), [tasks])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#f3f4f6" gap={16} />
      <Controls />
    </ReactFlow>
  )
}
