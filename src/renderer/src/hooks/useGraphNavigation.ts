import { useState, useCallback, useRef } from 'react'
import type { GraphNode, GraphData } from '../types/graph'
import type { GraphCanvasRef } from '../components/GraphCanvas'

export function useGraphNavigation(graphData: GraphData | null) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResultCount, setSearchResultCount] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const canvasRef = useRef<GraphCanvasRef>(null)

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node)
    if (node) {
      canvasRef.current?.highlightFlow(node.id, direction)
    } else {
      canvasRef.current?.clearHighlight()
    }
  }, [direction])

  const handleNodeDblClick = useCallback((node: GraphNode) => {
    window.electronAPI.openVscode(node.filePath, node.lineNumber)
  }, [])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (!query || !graphData) {
        setSearchResultCount(0)
        canvasRef.current?.clearHighlight()
        return
      }

      const lower = query.toLowerCase()
      const matched = graphData.nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(lower) ||
          n.id.toLowerCase().includes(lower) ||
          Object.values(n.metadata).some((v) => v.toLowerCase().includes(lower))
      )
      setSearchResultCount(matched.length)
      canvasRef.current?.highlight(matched.map((n) => n.id))
    },
    [graphData]
  )

  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === 'forward' ? 'backward' : 'forward'))
    // 현재 선택된 노드가 있으면 재하이라이트
    if (selectedNode) {
      const newDir = direction === 'forward' ? 'backward' : 'forward'
      canvasRef.current?.highlightFlow(selectedNode.id, newDir)
    }
  }, [direction, selectedNode])

  const fitView = useCallback(() => {
    canvasRef.current?.fitView()
  }, [])

  return {
    selectedNode,
    searchQuery,
    searchResultCount,
    direction,
    canvasRef,
    handleNodeSelect,
    handleNodeDblClick,
    handleSearch,
    toggleDirection,
    fitView
  }
}
