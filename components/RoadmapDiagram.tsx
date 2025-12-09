'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface RoadmapItem {
  id: string
  title: string
  description?: string
  children?: RoadmapItem[]
  status?: 'completed' | 'in_progress' | 'pending'
  type?: 'milestone' | 'task' | 'phase'
}

interface RoadmapDiagramProps {
  data: RoadmapItem[]
  title?: string
  direction?: 'TB' | 'LR' // Top-Bottom or Left-Right
}

// Custom node styles based on type and status
const getNodeStyle = (type?: string, status?: string) => {
  const baseStyle = {
    padding: '16px 20px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500,
    border: '2px solid',
    minWidth: '180px',
    maxWidth: '220px',
    textAlign: 'center' as const,
    wordWrap: 'break-word' as const,
    whiteSpace: 'normal' as const,
    lineHeight: '1.4',
  }

  // Status colors
  const statusColors = {
    completed: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    in_progress: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    pending: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
  }

  // Type styles
  const typeStyles = {
    milestone: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', fontWeight: 700 },
    phase: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', fontWeight: 700 },
    task: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
  }

  const colors = status 
    ? statusColors[status as keyof typeof statusColors] || statusColors.pending
    : typeStyles[type as keyof typeof typeStyles] || typeStyles.task

  const fw = 'fontWeight' in colors ? (colors as any).fontWeight : baseStyle.fontWeight

  return {
    ...baseStyle,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    color: colors.text,
    fontWeight: fw as number,
  }
}

// Convert hierarchical data to ReactFlow nodes and edges
const convertToFlowData = (
  items: RoadmapItem[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  
  const spacing = direction === 'TB' ? { x: 250, y: 120 } : { x: 300, y: 100 }
  
  const processItems = (
    items: RoadmapItem[],
    parentId: string | null,
    level: number,
    startIndex: number
  ): number => {
    let currentIndex = startIndex
    
    items.forEach((item, idx) => {
      const nodeId = item.id || `node-${level}-${idx}`
      
      // Calculate position
      const x = direction === 'TB' 
        ? (currentIndex - items.length / 2) * spacing.x + 400
        : level * spacing.x + 50
      const y = direction === 'TB'
        ? level * spacing.y + 50
        : (currentIndex - items.length / 2) * spacing.y + 300
      
      nodes.push({
        id: nodeId,
        position: { x, y },
        data: { 
          label: item.title,
          description: item.description,
        },
        style: getNodeStyle(item.type, item.status),
        sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
        targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      })
      
      // Create edge from parent
      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: item.status === 'in_progress',
          style: { 
            stroke: item.status === 'completed' ? '#22c55e' : '#9ca3af',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: item.status === 'completed' ? '#22c55e' : '#9ca3af',
          },
        })
      }
      
      // Process children
      if (item.children && item.children.length > 0) {
        currentIndex = processItems(item.children, nodeId, level + 1, currentIndex)
      }
      
      currentIndex++
    })
    
    return currentIndex
  }
  
  processItems(items, null, 0, 0)
  
  return { nodes, edges }
}

// Parse markdown roadmap content to structured data
export const parseRoadmapContent = (content: string): RoadmapItem[] => {
  const items: RoadmapItem[] = []
  const lines = content.split('\n').filter(line => line.trim())
  
  let currentPhase: RoadmapItem | null = null
  let currentMilestone: RoadmapItem | null = null
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    
    // Phase: ### or **Giai đoạn**
    if (trimmed.startsWith('### ') || trimmed.match(/^\*\*Giai đoạn/i)) {
      const title = trimmed.replace(/^###\s*/, '').replace(/^\*\*|\*\*$/g, '')
      currentPhase = {
        id: `phase-${idx}`,
        title,
        type: 'phase',
        children: [],
      }
      items.push(currentPhase)
      currentMilestone = null
    }
    // Milestone: #### or **Mốc**
    else if (trimmed.startsWith('#### ') || trimmed.match(/^\*\*Mốc/i)) {
      const title = trimmed.replace(/^####\s*/, '').replace(/^\*\*|\*\*$/g, '')
      currentMilestone = {
        id: `milestone-${idx}`,
        title,
        type: 'milestone',
        children: [],
      }
      if (currentPhase) {
        currentPhase.children?.push(currentMilestone)
      } else {
        items.push(currentMilestone)
      }
    }
    // Task: - or • or *
    else if (trimmed.match(/^[-•*]\s+/)) {
      const title = trimmed.replace(/^[-•*]\s+/, '')
      const task: RoadmapItem = {
        id: `task-${idx}`,
        title,
        type: 'task',
        status: title.includes('✓') || title.includes('✅') ? 'completed' : 'pending',
      }
      
      if (currentMilestone) {
        currentMilestone.children?.push(task)
      } else if (currentPhase) {
        currentPhase.children?.push(task)
      } else {
        items.push(task)
      }
    }
  })
  
  return items
}

export default function RoadmapDiagram({ data, title, direction = 'TB' }: RoadmapDiagramProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToFlowData(data, direction),
    [data, direction]
  )
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="w-full">
      <div className="h-[600px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {title && (
          <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🗺️</span> {title}
            </h3>
          </div>
        )}
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.style?.backgroundColor) return node.style.backgroundColor as string
            return '#f3f4f6'
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        />
        </ReactFlow>
      </div>
      
      {/* Legend - positioned outside ReactFlow container to prevent overlap */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Chú thích:</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Giai đoạn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Mốc quan trọng</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Hoàn thành</span>
          </div>
        </div>
      </div>
    </div>
  )
}
