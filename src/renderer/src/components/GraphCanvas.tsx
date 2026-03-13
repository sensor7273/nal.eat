import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import cytoscape from 'cytoscape'
import cytoscapeDagre from 'cytoscape-dagre'
import type { ElementDefinition } from 'cytoscape'
import type { GraphNode } from '../types/graph'
import { buildCytoscapeElements, cytoscapeStylesheet } from '../graph/graph-builder'
import { getLayoutOptions } from '../graph/layout-engine'
import type { LayoutName } from '../graph/layout-engine'
import type { GraphData } from '../types/graph'

// dagre 레이아웃 등록
try {
  cytoscape.use(cytoscapeDagre)
} catch {
  // 이미 등록됨
}

export interface GraphCanvasRef {
  fitView: () => void
  highlight: (nodeIds: string[]) => void
  clearHighlight: () => void
  highlightFlow: (nodeId: string, direction: 'forward' | 'backward') => void
  setZoom: (level: number) => void
  getZoom: () => number
}

interface GraphCanvasProps {
  graphData: GraphData | null
  layout: LayoutName
  onNodeSelect: (node: GraphNode | null) => void
  onNodeDblClick: (node: GraphNode) => void
}

export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(
  ({ graphData, layout, onNodeSelect, onNodeDblClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const cyRef = useRef<cytoscape.Core | null>(null)
    const contextMenuRef = useRef<HTMLDivElement | null>(null)

    // Cytoscape 초기화
    useEffect(() => {
      if (!containerRef.current) return

      const cy = cytoscape({
        container: containerRef.current,
        elements: [],
        style: cytoscapeStylesheet,
        layout: { name: 'preset' },
        minZoom: 0.1,
        maxZoom: 3,
        wheelSensitivity: 0.2
      })

      cyRef.current = cy

      // 노드 클릭
      cy.on('tap', 'node', (evt) => {
        const node = evt.target
        const data = node.data() as GraphNode & { color: string }
        onNodeSelect({
          id: data.id,
          layer: data.layer,
          type: data.type,
          label: data.label,
          filePath: data.filePath,
          lineNumber: data.lineNumber,
          metadata: data.metadata || {}
        })
      })

      // 배경 클릭 → 선택 해제
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          onNodeSelect(null)
          cy.elements().removeClass('highlighted dimmed')
        }
      })

      // 더블클릭 → 파일 열기
      cy.on('dblclick', 'node', (evt) => {
        const data = evt.target.data() as GraphNode
        onNodeDblClick(data)
      })

      // 우클릭 컨텍스트 메뉴
      cy.on('cxttap', 'node', (evt) => {
        evt.preventDefault()
        showContextMenu(evt.renderedPosition, evt.target.id())
      })

      return () => {
        cy.destroy()
        cyRef.current = null
        removeContextMenu()
      }
    }, [])

    // 그래프 데이터 갱신
    useEffect(() => {
      const cy = cyRef.current
      if (!cy || !graphData) return

      const elements = buildCytoscapeElements(graphData)
      cy.elements().remove()
      cy.add(elements)
      cy.layout(getLayoutOptions(layout)).run()
    }, [graphData])

    // 레이아웃 변경
    useEffect(() => {
      const cy = cyRef.current
      if (!cy || cy.elements().length === 0) return
      cy.layout(getLayoutOptions(layout)).run()
    }, [layout])

    const showContextMenu = (pos: { x: number; y: number }, nodeId: string) => {
      removeContextMenu()
      const menu = document.createElement('div')
      menu.style.cssText = `
        position: fixed; left: ${pos.x}px; top: ${pos.y}px;
        background: #2d2d2d; border: 1px solid #555; border-radius: 4px;
        padding: 4px 0; z-index: 9999; font-size: 12px; color: #d4d4d4; min-width: 160px;
      `

      const items = [
        { label: '→ 순방향 흐름 보기', action: () => highlightFlow(nodeId, 'forward') },
        { label: '← 역방향 흐름 보기', action: () => highlightFlow(nodeId, 'backward') },
        { label: '이 노드만 보기', action: () => highlightFlow(nodeId, 'both') }
      ]

      for (const item of items) {
        const el = document.createElement('div')
        el.textContent = item.label
        el.style.cssText = 'padding: 6px 16px; cursor: pointer;'
        el.addEventListener('mouseover', () => (el.style.background = '#3e3e42'))
        el.addEventListener('mouseout', () => (el.style.background = 'transparent'))
        el.addEventListener('click', () => {
          item.action()
          removeContextMenu()
        })
        menu.appendChild(el)
      }

      document.body.appendChild(menu)
      contextMenuRef.current = menu

      const handler = () => removeContextMenu()
      document.addEventListener('click', handler, { once: true })
    }

    const removeContextMenu = () => {
      if (contextMenuRef.current) {
        contextMenuRef.current.remove()
        contextMenuRef.current = null
      }
    }

    const highlightFlow = useCallback(
      (nodeId: string, direction: 'forward' | 'backward' | 'both') => {
        const cy = cyRef.current
        if (!cy) return

        const node = cy.$(`#${CSS.escape(nodeId)}`)
        if (node.empty()) return

        cy.elements().removeClass('highlighted dimmed')

        let connected: cytoscape.Collection = node

        if (direction === 'forward' || direction === 'both') {
          connected = connected.union(node.successors())
        }
        if (direction === 'backward' || direction === 'both') {
          connected = connected.union(node.predecessors())
        }

        cy.elements().not(connected).addClass('dimmed')
        connected.addClass('highlighted')
      },
      []
    )

    useImperativeHandle(ref, () => ({
      fitView: () => cyRef.current?.fit(undefined, 40),
      highlight: (nodeIds: string[]) => {
        const cy = cyRef.current
        if (!cy) return
        cy.elements().removeClass('highlighted dimmed')
        if (nodeIds.length === 0) return
        const selector = nodeIds.map((id) => `#${CSS.escape(id)}`).join(', ')
        cy.elements().not(selector).addClass('dimmed')
        cy.$(selector).addClass('highlighted')
      },
      clearHighlight: () => {
        cyRef.current?.elements().removeClass('highlighted dimmed')
      },
      highlightFlow,
      setZoom: (level: number) => {
        const cy = cyRef.current
        if (!cy) return
        cy.zoom({ level, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
      },
      getZoom: () => cyRef.current?.zoom() ?? 1
    }))

    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          background: '#1e1e1e',
          position: 'relative'
        }}
      />
    )
  }
)

GraphCanvas.displayName = 'GraphCanvas'
