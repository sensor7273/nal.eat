import type { VueAxiosCall } from '../types/project'

function basename(p: string): string {
  return p.replace(/\\/g, '/').split('/').pop()?.replace('.vue', '') || p
}

/**
 * .vue 파일에서 axiosCall({ ac: 'AJAX_CODE' }) 패턴 추출
 */
export function parseVueFile(filePath: string, content: string): VueAxiosCall[] {
  const results: VueAxiosCall[] = []
  const componentName = basename(filePath)

  // <script> 블록 추출
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  if (!scriptMatch) return results

  const script = scriptMatch[1]
  const lines = script.split('\n')
  const scriptOffset = content.substring(0, content.indexOf(scriptMatch[1])).split('\n').length - 1

  // axiosCall 내부에서 ac: 'VALUE' 또는 ac: "VALUE" 추출
  // 패턴 1: axiosCall({ ac: 'CODE', ... }) - 동일 라인
  // 패턴 2: axiosCall({ \n ac: 'CODE', ... }) - 멀티라인
  const acPattern = /ac\s*:\s*['"]([A-Z0-9_]+)['"]/g
  let match: RegExpExecArray | null

  while ((match = acPattern.exec(script)) !== null) {
    const beforeMatch = script.substring(0, match.index)
    const lineNumber = scriptOffset + beforeMatch.split('\n').length

    // 같은 params 블록(앞뒤 300자 범위)에서 workType 추출
    const contextStart = Math.max(0, match.index - 300)
    const contextEnd = Math.min(script.length, match.index + 300)
    const context = script.substring(contextStart, contextEnd)
    const wtMatch = context.match(/workType\s*:\s*['"]([^'"]+)['"]/)
    const workType = wtMatch ? wtMatch[1] : ''

    results.push({
      filePath,
      lineNumber,
      componentName,
      ajaxCode: match[1],
      workType
    })
  }

  // callQuery, callExecuteSync 패턴도 추출 (KSA HTML 유사 패턴)
  const callQueryPattern = /callQuery\s*\(\s*[^,]+,\s*['"]([A-Z0-9_]+)['"]/g
  while ((match = callQueryPattern.exec(script)) !== null) {
    const beforeMatch = script.substring(0, match.index)
    const lineNumber = scriptOffset + beforeMatch.split('\n').length
    results.push({
      filePath,
      lineNumber,
      componentName,
      ajaxCode: match[1],
      workType: ''
    })
  }

  return results
}

export async function parseVueFiles(
  filePaths: string[],
  readFile: (p: string) => Promise<string | null>
): Promise<VueAxiosCall[]> {
  const results: VueAxiosCall[] = []
  for (const fp of filePaths) {
    const content = await readFile(fp)
    if (content) {
      results.push(...parseVueFile(fp, content))
    }
  }
  return results
}
