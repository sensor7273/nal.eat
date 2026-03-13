import type { GraphData, GraphNode } from '../types/graph'
import { NODE_COLORS } from '../types/graph'
import type { ElementDefinition } from 'cytoscape'

export function buildCytoscapeElements(graph: GraphData): ElementDefinition[] {
  const elements: ElementDefinition[] = []

  for (const node of graph.nodes) {
    elements.push({
      data: {
        id: node.id,
        label: node.label,
        layer: node.layer,
        type: node.type,
        filePath: node.filePath,
        lineNumber: node.lineNumber,
        metadata: node.metadata,
        color: NODE_COLORS[node.type] || '#888'
      }
    })
  }

  for (const edge of graph.edges) {
    elements.push({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || ''
      }
    })
  }

  return elements
}

export const cytoscapeStylesheet: cytoscape.Stylesheet[] = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      label: 'data(label)',
      'text-wrap': 'wrap',
      'text-max-width': '140px',
      'font-size': '11px',
      color: '#ffffff',
      'text-outline-color': '#333',
      'text-outline-width': 1,
      'text-valign': 'center',
      'text-halign': 'center',
      'border-width': 2,
      'border-color': '#ffffff',
      width: 'label',
      height: 'label',
      padding: '10px',
      shape: 'roundrectangle',
      'min-width': 80,
      'min-height': 30
    }
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#ffeb3b',
      'background-color': 'data(color)',
      'box-shadow': '0 0 10px #ffeb3b'
    }
  },
  {
    selector: 'node.highlighted',
    style: {
      'border-width': 3,
      'border-color': '#ffeb3b'
    }
  },
  {
    selector: 'node.dimmed',
    style: {
      opacity: 0.25
    }
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#555',
      'target-arrow-color': '#555',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(label)',
      'font-size': '9px',
      color: '#aaa',
      'text-background-color': '#1e1e1e',
      'text-background-opacity': 0.8,
      'text-background-padding': '2px'
    }
  },
  {
    selector: 'edge.highlighted',
    style: {
      'line-color': '#ffeb3b',
      'target-arrow-color': '#ffeb3b',
      width: 3
    }
  },
  {
    selector: 'edge.dimmed',
    style: {
      opacity: 0.1
    }
  },
  // 레이어별 모양 구분
  {
    selector: 'node[type="vue-component"]',
    style: { shape: 'roundrectangle' }
  },
  {
    selector: 'node[type="fcs-screen"]',
    style: { shape: 'roundrectangle' }
  },
  {
    selector: 'node[type="service-map-entry"]',
    style: { shape: 'ellipse' }
  },
  {
    selector: 'node[type="ibatis-query"]',
    style: { shape: 'diamond' }
  },
  {
    selector: 'node[type="stored-procedure"]',
    style: { shape: 'hexagon' }
  },
  {
    selector: 'node[type="view"]',
    style: { shape: 'pentagon' }
  },
  {
    selector: 'node[type="function"]',
    style: { shape: 'star' }
  }
]
