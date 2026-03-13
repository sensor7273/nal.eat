import type { SqlObject } from '../types/project'

/**
 * SQL 파일 파싱 (UTF-16LE BOM 자동 처리는 IPC 레이어에서)
 * CREATE/ALTER PROCEDURE/VIEW/FUNCTION 패턴 추출
 */
export function parseSqlFile(filePath: string, content: string): SqlObject[] {
  const results: SqlObject[] = []
  const lines = content.split('\n')

  const patterns: Array<{
    regex: RegExp
    type: 'procedure' | 'view' | 'function'
  }> = [
    {
      regex: /(?:CREATE|ALTER)\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:\[?dbo\]?\.\s*)?\[?([A-Za-z0-9_]+)\]?/i,
      type: 'procedure'
    },
    {
      regex: /(?:CREATE|ALTER)\s+VIEW\s+(?:\[?dbo\]?\.\s*)?\[?([A-Za-z0-9_]+)\]?/i,
      type: 'view'
    },
    {
      regex: /(?:CREATE|ALTER)\s+FUNCTION\s+(?:\[?dbo\]?\.\s*)?\[?([A-Za-z0-9_]+)\]?/i,
      type: 'function'
    }
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const { regex, type } of patterns) {
      const match = line.match(regex)
      if (match) {
        results.push({
          filePath,
          lineNumber: i + 1,
          objectType: type,
          objectName: match[1]
        })
        break // 한 라인에서 하나만
      }
    }
  }

  return results
}

export async function parseSqlFiles(
  filePaths: string[],
  readFile: (p: string) => Promise<string | null>
): Promise<SqlObject[]> {
  const results: SqlObject[] = []
  for (const fp of filePaths) {
    const content = await readFile(fp)
    if (content) {
      results.push(...parseSqlFile(fp, content))
    }
  }
  return results
}
