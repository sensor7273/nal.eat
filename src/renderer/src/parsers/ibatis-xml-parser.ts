import type { IbatisQuery } from '../types/project'
import { XMLParser } from 'fast-xml-parser'

/**
 * iBATIS XML 파일 파싱
 * <procedure id="queryId">EXEC SP_NAME ...</procedure>
 * <select id="queryId">...</select>
 */
export function parseIbatisXmlFile(filePath: string, content: string): IbatisQuery[] {
  const results: IbatisQuery[] = []

  // fast-xml-parser 사용
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: false,
    trimValues: true,
    allowBooleanAttributes: true,
    preserveOrder: false
  })

  let parsed: Record<string, unknown>
  try {
    parsed = parser.parse(content)
  } catch {
    // XML 파싱 실패 시 정규식 폴백
    return parseIbatisXmlFallback(filePath, content)
  }

  // sqlMap 루트 태그 찾기
  const root = parsed['sqlMap'] || parsed['mapper'] || parsed
  if (!root || typeof root !== 'object') return parseIbatisXmlFallback(filePath, content)

  const queryTags = ['procedure', 'select', 'update', 'insert', 'delete', 'statement']

  for (const tag of queryTags) {
    const entries = (root as Record<string, unknown>)[tag]
    if (!entries) continue

    const items = Array.isArray(entries) ? entries : [entries]
    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const obj = item as Record<string, unknown>
      const queryId = (obj['@_id'] as string) || ''
      if (!queryId) continue

      const body = (obj['#text'] as string) || ''
      const spName = extractSpName(body)

      // 라인 번호 추출 (원본 콘텐츠에서 id 검색)
      const lineNumber = findLineNumber(content, queryId)

      results.push({ filePath, lineNumber, queryId, spName, rawSql: body.substring(0, 200) })
    }
  }

  return results
}

function parseIbatisXmlFallback(filePath: string, content: string): IbatisQuery[] {
  const results: IbatisQuery[] = []
  const lines = content.split('\n')

  // <procedure id="..." > ... </procedure> 패턴
  const tagPattern =
    /<(procedure|select|update|insert|delete|statement)\s[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null

  while ((match = tagPattern.exec(content)) !== null) {
    const queryId = match[2]
    const tagStart = match.index
    const tagEnd = tagStart + match[0].length
    const closeTag = `</${match[1]}>`
    const closeIdx = content.indexOf(closeTag, tagEnd)
    const body =
      closeIdx > 0 ? content.substring(tagEnd, closeIdx).trim() : content.substring(tagEnd, tagEnd + 500)

    const spName = extractSpName(body)
    const lineNumber = content.substring(0, tagStart).split('\n').length

    results.push({ filePath, lineNumber, queryId, spName, rawSql: body.substring(0, 200) })
  }

  return results
}

/**
 * SQL 본문에서 SP명 추출
 * EXEC [dbo].[SP_NAME] / EXEC SP_NAME / EXECUTE SP_NAME
 */
function extractSpName(sql: string): string | null {
  if (!sql) return null

  // EXEC [dbo].[SP_NAME] 패턴
  const execBracketPattern = /\bEXEC(?:UTE)?\s+(?:\[?dbo\]?\.\s*)?\[?([A-Za-z0-9_]+)\]?/i
  const m1 = sql.match(execBracketPattern)
  if (m1) return m1[1]

  // EXEC SP_NAME 패턴 (단순)
  const execSimplePattern = /\bEXEC(?:UTE)?\s+([A-Za-z0-9_]+)/i
  const m2 = sql.match(execSimplePattern)
  if (m2 && !['SP', 'PROC', 'PROCEDURE'].includes(m2[1].toUpperCase())) {
    return m2[1]
  }

  return null
}

function findLineNumber(content: string, id: string): number {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`id="${id}"`) || lines[i].includes(`id='${id}'`)) {
      return i + 1
    }
  }
  return 1
}

export async function parseIbatisXmlFiles(
  filePaths: string[],
  readFile: (p: string) => Promise<string | null>
): Promise<IbatisQuery[]> {
  const results: IbatisQuery[] = []
  for (const fp of filePaths) {
    const content = await readFile(fp)
    if (content) {
      results.push(...parseIbatisXmlFile(fp, content))
    }
  }
  return results
}
