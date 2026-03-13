import type { ParseResult } from '../types/project'
import type { GraphData } from '../types/graph'
import { parseVueFiles } from './vue-parser'
import { parseHtmlModelFiles } from './html-model-parser'
import { parseServiceMapFiles } from './service-map-parser'
import { parseIbatisXmlFiles } from './ibatis-xml-parser'
import { parseSqlFiles } from './sql-file-parser'
import { resolveLinks } from './link-resolver'

type ProgressCallback = (step: string, current: number, total: number) => void

export async function scanProject(
  projectPath: string,
  onProgress?: ProgressCallback
): Promise<{ parsed: ParseResult; graph: GraphData }> {
  const api = window.electronAPI

  const progress = (step: string, cur: number, tot: number) => {
    onProgress?.(step, cur, tot)
  }

  progress('파일 목록 수집 중...', 0, 6)

  // 파일 목록 수집
  const [vueFiles, htmlFiles, javaFiles, xmlFiles, sqlFiles] = await Promise.all([
    api.listFiles(projectPath, ['.vue']),
    api.listFiles(projectPath, ['.html']),
    api.listFiles(projectPath, ['.java']),
    api.listFiles(projectPath, ['.xml']),
    api.listFiles(projectPath, ['.sql'])
  ])

  const htmlModelFiles = htmlFiles.filter((f) => f.replace(/\\/g, '/').includes('/model/'))
  const serviceMapFiles = javaFiles.filter((f) => f.endsWith('ServiceMap.java'))
  const ibatisXmlFiles = xmlFiles.filter(
    (f) => f.replace(/\\/g, '/').includes('/sqlmap/') && !f.includes('/test/')
  )

  const readFile = (p: string) => api.readFile(p)

  progress('Vue 컴포넌트 파싱 중...', 1, 6)
  const vueCalls = await parseVueFiles(vueFiles, readFile)

  progress('HTML 모델 파싱 중...', 2, 6)
  const htmlModelCalls = await parseHtmlModelFiles(htmlModelFiles, readFile)

  progress('ServiceMap.java 파싱 중...', 3, 6)
  const serviceMapEntries = await parseServiceMapFiles(serviceMapFiles, readFile)

  progress('iBATIS XML 파싱 중...', 4, 6)
  const ibatisQueries = await parseIbatisXmlFiles(ibatisXmlFiles, readFile)

  progress('SQL 파일 파싱 중...', 5, 6)
  const sqlObjects = await parseSqlFiles(sqlFiles, readFile)

  progress('그래프 연결 중...', 6, 6)
  const parsed: ParseResult = {
    vueCalls,
    htmlModelCalls,
    serviceMapEntries,
    ibatisQueries,
    sqlObjects
  }

  const graph = resolveLinks(parsed)

  return { parsed, graph }
}
