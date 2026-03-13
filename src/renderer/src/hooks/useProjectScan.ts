import { useState, useCallback } from 'react'
import type { GraphData } from '../types/graph'
import type { ParseResult } from '../types/project'
import { scanProject } from '../parsers/index'

interface ScanState {
  isLoading: boolean
  progress: string
  graphData: GraphData | null
  parsedData: ParseResult | null
  error: string | null
  projectPath: string | null
}

export function useProjectScan() {
  const [state, setState] = useState<ScanState>({
    isLoading: false,
    progress: '',
    graphData: null,
    parsedData: null,
    error: null,
    projectPath: null
  })

  const scan = useCallback(async (projectPath: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null, projectPath }))

    try {
      const { parsed, graph } = await scanProject(projectPath, (step, cur, tot) => {
        setState((s) => ({ ...s, progress: `[${cur}/${tot}] ${step}` }))
      })

      setState((s) => ({
        ...s,
        isLoading: false,
        progress: `완료: 노드 ${graph.nodes.length}, 엣지 ${graph.edges.length}`,
        graphData: graph,
        parsedData: parsed
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: String(err),
        progress: ''
      }))
    }
  }, [])

  return { ...state, scan }
}
