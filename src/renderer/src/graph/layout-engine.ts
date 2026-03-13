import type cytoscape from 'cytoscape'

export type LayoutName = 'dagre-LR' | 'dagre-TB' | 'cose' | 'grid'

export function getLayoutOptions(name: LayoutName): cytoscape.LayoutOptions {
  switch (name) {
    case 'dagre-LR':
      return {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 30,
        rankSep: 120,
        edgeSep: 10,
        ranker: 'network-simplex',
        animate: true,
        animationDuration: 300,
        fit: true,
        padding: 40
      } as cytoscape.LayoutOptions

    case 'dagre-TB':
      return {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 20,
        rankSep: 100,
        edgeSep: 10,
        ranker: 'network-simplex',
        animate: true,
        animationDuration: 300,
        fit: true,
        padding: 40
      } as cytoscape.LayoutOptions

    case 'cose':
      return {
        name: 'cose',
        idealEdgeLength: 150,
        nodeOverlap: 20,
        animate: true,
        fit: true,
        padding: 40
      }

    case 'grid':
      return {
        name: 'grid',
        animate: true,
        fit: true,
        padding: 40
      }
  }
}
