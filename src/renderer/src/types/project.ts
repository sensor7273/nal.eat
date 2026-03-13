export type ProjectType = 'ubsfe' | 'ksa' | 'unknown'

export interface ProjectInfo {
  rootPath: string
  type: ProjectType
  name: string
  subProjects: SubProject[]
}

export interface SubProject {
  name: string
  path: string
  hasVue: boolean
  hasHtmlModel: boolean
  serviceMapPaths: string[]
  ibatisXmlPaths: string[]
  dbScriptPath: string | null
}

// 파서 중간 결과 타입들
export interface VueAxiosCall {
  filePath: string
  lineNumber: number
  componentName: string
  ajaxCode: string
  workType: string
}

export interface HtmlModelCall {
  filePath: string
  screenName: string
  ajaxCodes: string[]
  directSpNames: string[]
}

export interface ServiceMapEntry {
  filePath: string
  ajaxCodeValue: string   // 실제 문자열 값 (e.g. "ACTIVITY001")
  queryId: string          // iBATIS query ID (e.g. "activity.selectActivityList")
}

export interface IbatisQuery {
  filePath: string
  lineNumber: number
  queryId: string
  spName: string | null
  rawSql: string
}

export interface SqlObject {
  filePath: string
  lineNumber: number
  objectType: 'procedure' | 'view' | 'function'
  objectName: string
}

export interface ParseResult {
  vueCalls: VueAxiosCall[]
  htmlModelCalls: HtmlModelCall[]
  serviceMapEntries: ServiceMapEntry[]
  ibatisQueries: IbatisQuery[]
  sqlObjects: SqlObject[]
}
