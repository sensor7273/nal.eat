export type NodeLayer = 'ui' | 'controller' | 'service-map' | 'ibatis' | 'database'

export type NodeType =
  | 'vue-component'
  | 'fcs-screen'
  | 'controller-endpoint'
  | 'service-map-entry'
  | 'ibatis-query'
  | 'stored-procedure'
  | 'view'
  | 'function'

export interface GraphNode {
  id: string
  layer: NodeLayer
  type: NodeType
  label: string
  filePath: string
  lineNumber?: number
  metadata: Record<string, string>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const NODE_COLORS: Record<NodeType, string> = {
  'vue-component': '#4e9af1',
  'fcs-screen': '#26c6da',
  'controller-endpoint': '#9e9e9e',
  'service-map-entry': '#ff9800',
  'ibatis-query': '#66bb6a',
  'stored-procedure': '#ef5350',
  view: '#ab47bc',
  function: '#f06292'
}

export const LAYER_LABELS: Record<NodeLayer, string> = {
  ui: 'UI',
  controller: 'Controller',
  'service-map': 'ServiceMap',
  ibatis: 'iBATIS',
  database: 'Database'
}
