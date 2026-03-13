import type { HtmlModelCall } from '../types/project'

function basename(p: string): string {
  return p.replace(/\\/g, '/').split('/').pop()?.replace('.html', '') || p
}

/**
 * KSA 프로젝트 model/*.html 파일 파싱
 * - callQuery(["req", json], "AJAX_CODE", $) → ajaxCodes
 * - callExecuteSync(["req", json], "AJAX_CODE") → ajaxCodes
 * - createExecuteParamInfo("SP_NAME", [...]) → directSpNames
 */
export function parseHtmlModelFile(filePath: string, content: string): HtmlModelCall {
  const screenName = basename(filePath)
  const ajaxCodes: string[] = []
  const directSpNames: string[] = []

  // callQuery 패턴: 2번째 파라미터가 AJAX 코드
  const callQueryPattern =
    /(?:callQuery|callExecuteSync|callExecute)\s*\(\s*[^,]+,\s*['"]([A-Z0-9_]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = callQueryPattern.exec(content)) !== null) {
    if (!ajaxCodes.includes(match[1])) {
      ajaxCodes.push(match[1])
    }
  }

  // createExecuteParamInfo 패턴: 1번째 파라미터가 SP명
  const execParamPattern =
    /createExecuteParamInfo\s*\(\s*['"]([A-Za-z0-9_]+)['"]/g
  while ((match = execParamPattern.exec(content)) !== null) {
    if (!directSpNames.includes(match[1])) {
      directSpNames.push(match[1])
    }
  }

  // executeQueryJson, executeProcedure 패턴도 수집
  const execPattern = /(?:executeQueryJson|executeProcedure|execQuery)\s*\(\s*['"]([A-Za-z0-9_]+)['"]/g
  while ((match = execPattern.exec(content)) !== null) {
    const val = match[1]
    // SP명처럼 보이면 directSpNames에, AJAX 코드면 ajaxCodes에
    if (/^[A-Z][a-z]/.test(val) || val.includes('_Q') || val.includes('_S') || val.includes('_U') || val.includes('_D')) {
      if (!directSpNames.includes(val)) directSpNames.push(val)
    } else if (/^[A-Z0-9_]+$/.test(val)) {
      if (!ajaxCodes.includes(val)) ajaxCodes.push(val)
    }
  }

  return { filePath, screenName, ajaxCodes, directSpNames }
}

export async function parseHtmlModelFiles(
  filePaths: string[],
  readFile: (p: string) => Promise<string | null>
): Promise<HtmlModelCall[]> {
  const results: HtmlModelCall[] = []
  for (const fp of filePaths) {
    const content = await readFile(fp)
    if (content) {
      const parsed = parseHtmlModelFile(fp, content)
      if (parsed.ajaxCodes.length > 0 || parsed.directSpNames.length > 0) {
        results.push(parsed)
      }
    }
  }
  return results
}
