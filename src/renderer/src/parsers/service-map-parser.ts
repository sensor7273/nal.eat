import type { ServiceMapEntry } from '../types/project'

/**
 * ServiceMap.java 파싱
 * 1단계: 상수 추출 - static final String CONSTANT_NAME = "VALUE";
 * 2단계: 맵핑 추출 - AJAX_MAP.put(CONSTANT_NAME, "queryId");
 *                     AJAX_MAP.put("DIRECT_CODE", "queryId");
 */
export function parseServiceMapFile(filePath: string, content: string): ServiceMapEntry[] {
  const results: ServiceMapEntry[] = []

  // 1단계: 상수 맵 구축
  const constants = new Map<string, string>()

  // static final String CONSTANT = "VALUE"; 패턴
  const constPattern =
    /(?:private\s+|public\s+|protected\s+)?static\s+final\s+String\s+(\w+)\s*=\s*"([^"]+)"\s*;/g
  let match: RegExpExecArray | null
  while ((match = constPattern.exec(content)) !== null) {
    constants.set(match[1], match[2])
  }

  // 2단계: put 맵핑 추출
  // AJAX_MAP.put(KEY, VALUE); 패턴
  // KEY: 상수명 또는 문자열 리터럴
  // VALUE: queryId 문자열
  const putPattern =
    /(?:AJAX_MAP|serviceMap|map)\s*\.\s*put\s*\(\s*([^,]+?)\s*,\s*"([^"]+)"\s*\)/g

  while ((match = putPattern.exec(content)) !== null) {
    const rawKey = match[1].trim()
    const queryId = match[2]

    let ajaxCodeValue: string | undefined

    // 직접 문자열 리터럴인 경우
    const literalMatch = rawKey.match(/^"([^"]+)"$/)
    if (literalMatch) {
      ajaxCodeValue = literalMatch[1]
    } else {
      // 상수명인 경우 - 상수 맵에서 조회
      ajaxCodeValue = constants.get(rawKey)
    }

    if (ajaxCodeValue && queryId) {
      results.push({ filePath, ajaxCodeValue, queryId })
    }
  }

  return results
}

export async function parseServiceMapFiles(
  filePaths: string[],
  readFile: (p: string) => Promise<string | null>
): Promise<ServiceMapEntry[]> {
  const results: ServiceMapEntry[] = []
  for (const fp of filePaths) {
    const content = await readFile(fp)
    if (content) {
      results.push(...parseServiceMapFile(fp, content))
    }
  }
  return results
}
