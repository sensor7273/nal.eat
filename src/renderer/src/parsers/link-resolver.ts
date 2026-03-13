import type { ParseResult } from '../types/project'
import type { GraphData, GraphNode, GraphEdge } from '../types/graph'

let edgeCounter = 0
function makeEdgeId(): string {
  return `edge-${++edgeCounter}`
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}

function basename(p: string): string {
  return normalizePath(p).split('/').pop() || p
}

/**
 * 파싱 결과를 그래프 노드/엣지로 변환
 */
export function resolveLinks(parsed: ParseResult): GraphData {
  edgeCounter = 0
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // === 1. 노드 생성 ===

  // UI 노드 (Vue 컴포넌트) — ac+workType 조합으로 구분
  const vueNodeMap = new Map<string, GraphNode>() // componentName+ajaxCode+workType → node
  for (const call of parsed.vueCalls) {
    const id = `vue-${call.componentName}-${call.ajaxCode}${call.workType ? '-' + call.workType : ''}`
    if (!vueNodeMap.has(id)) {
      const workTypeLine = call.workType ? `\n(${call.workType})` : ''
      const node: GraphNode = {
        id,
        layer: 'ui',
        type: 'vue-component',
        label: `${call.componentName}\n[${call.ajaxCode}]${workTypeLine}`,
        filePath: call.filePath,
        lineNumber: call.lineNumber,
        metadata: {
          ajaxCode: call.ajaxCode,
          componentName: call.componentName,
          workType: call.workType
        }
      }
      vueNodeMap.set(id, node)
      nodes.push(node)
    }
  }

  // UI 노드 (KSA HTML model)
  const htmlNodeMap = new Map<string, GraphNode>() // screenName → node
  for (const call of parsed.htmlModelCalls) {
    const id = `fcs-${call.screenName}`
    if (!htmlNodeMap.has(id)) {
      const node: GraphNode = {
        id,
        layer: 'ui',
        type: 'fcs-screen',
        label: call.screenName,
        filePath: call.filePath,
        lineNumber: 1,
        metadata: {
          screenName: call.screenName,
          ajaxCodes: call.ajaxCodes.join(','),
          directSpNames: call.directSpNames.join(',')
        }
      }
      htmlNodeMap.set(id, node)
      nodes.push(node)
    }
  }

  // ServiceMap 노드
  const smNodeMap = new Map<string, GraphNode>() // ajaxCodeValue → node
  for (const entry of parsed.serviceMapEntries) {
    const id = `sm-${entry.ajaxCodeValue}`
    if (!smNodeMap.has(entry.ajaxCodeValue)) {
      const node: GraphNode = {
        id,
        layer: 'service-map',
        type: 'service-map-entry',
        label: `${entry.ajaxCodeValue}\n→ ${entry.queryId}`,
        filePath: entry.filePath,
        lineNumber: 1,
        metadata: { ajaxCodeValue: entry.ajaxCodeValue, queryId: entry.queryId }
      }
      smNodeMap.set(entry.ajaxCodeValue, node)
      nodes.push(node)
    }
  }

  // iBATIS 노드
  const ibatisNodeMap = new Map<string, GraphNode>() // queryId → node
  for (const query of parsed.ibatisQueries) {
    const id = `ibatis-${query.queryId}`
    if (!ibatisNodeMap.has(query.queryId)) {
      const node: GraphNode = {
        id,
        layer: 'ibatis',
        type: 'ibatis-query',
        label: query.queryId + (query.spName ? `\n→ ${query.spName}` : ''),
        filePath: query.filePath,
        lineNumber: query.lineNumber,
        metadata: {
          queryId: query.queryId,
          spName: query.spName || '',
          rawSql: query.rawSql
        }
      }
      ibatisNodeMap.set(query.queryId, node)
      nodes.push(node)
    }
  }

  // DB 오브젝트 노드 (SP/View/Function)
  const dbNodeMap = new Map<string, GraphNode>() // objectName → node
  for (const obj of parsed.sqlObjects) {
    const id = `db-${obj.objectName}`
    if (!dbNodeMap.has(id)) {
      const typeMap = {
        procedure: 'stored-procedure',
        view: 'view',
        function: 'function'
      } as const
      const node: GraphNode = {
        id,
        layer: 'database',
        type: typeMap[obj.objectType],
        label: obj.objectName,
        filePath: obj.filePath,
        lineNumber: obj.lineNumber,
        metadata: { objectName: obj.objectName, objectType: obj.objectType }
      }
      dbNodeMap.set(obj.objectName, node)
      nodes.push(node)
    }
  }

  // === 2. 엣지 생성 ===

  // Vue → ServiceMap
  for (const call of parsed.vueCalls) {
    const vueId = `vue-${call.componentName}-${call.ajaxCode}${call.workType ? '-' + call.workType : ''}`
    const smNode = smNodeMap.get(call.ajaxCode)
    if (smNode) {
      const edgeLabel = call.workType ? `${call.ajaxCode}\n${call.workType}` : call.ajaxCode
      edges.push({ id: makeEdgeId(), source: vueId, target: smNode.id, label: edgeLabel })
    }
  }

  // HTML → ServiceMap (ajaxCodes)
  for (const call of parsed.htmlModelCalls) {
    const htmlId = `fcs-${call.screenName}`
    for (const ajaxCode of call.ajaxCodes) {
      const smNode = smNodeMap.get(ajaxCode)
      if (smNode) {
        edges.push({ id: makeEdgeId(), source: htmlId, target: smNode.id, label: ajaxCode })
      }
    }
    // HTML → DB (직접 SP 참조)
    for (const spName of call.directSpNames) {
      const dbNode = dbNodeMap.get(spName)
      if (dbNode) {
        edges.push({ id: makeEdgeId(), source: htmlId, target: dbNode.id, label: 'direct' })
      }
    }
  }

  // ServiceMap → iBATIS
  for (const entry of parsed.serviceMapEntries) {
    const smId = `sm-${entry.ajaxCodeValue}`
    const ibatisNode = ibatisNodeMap.get(entry.queryId)
    if (ibatisNode) {
      edges.push({ id: makeEdgeId(), source: smId, target: ibatisNode.id, label: entry.queryId })
    }
  }

  // iBATIS → DB
  for (const query of parsed.ibatisQueries) {
    if (!query.spName) continue
    const ibatisId = `ibatis-${query.queryId}`
    // 정확한 이름 매칭
    let dbNode = dbNodeMap.get(query.spName)
    // 대소문자 무시 매칭
    if (!dbNode) {
      const lower = query.spName.toLowerCase()
      for (const [key, val] of dbNodeMap) {
        if (key.toLowerCase() === lower) {
          dbNode = val
          break
        }
      }
    }
    if (dbNode) {
      edges.push({ id: makeEdgeId(), source: ibatisId, target: dbNode.id, label: query.spName })
    }
  }

  return { nodes, edges }
}
