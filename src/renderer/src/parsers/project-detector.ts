import type { ProjectInfo, SubProject } from '../types/project'

declare global {
  interface Window {
    electronAPI: {
      listFiles: (dir: string, exts: string[]) => Promise<string[]>
      listDirs: (dir: string) => Promise<string[]>
      pathExists: (p: string) => Promise<boolean>
      readFile: (p: string, enc?: string) => Promise<string | null>
      selectFolder: () => Promise<string | null>
      openInEditor: (p: string, line?: number) => Promise<void>
      openVscode: (p: string, line?: number) => Promise<boolean>
    }
  }
}

const api = () => window.electronAPI

function basename(p: string): string {
  return p.replace(/\\/g, '/').split('/').pop() || p
}

function join(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/').replace(/\\/g, '/')
}

export async function detectProject(rootPath: string): Promise<ProjectInfo> {
  const root = rootPath.replace(/\\/g, '/')
  const name = basename(root)

  // 직접 subProject 형태인지 확인
  const serviceMapFiles = await api().listFiles(root, ['.java'])
  const serviceMapPaths = serviceMapFiles.filter((f) => f.endsWith('ServiceMap.java'))

  const ibatisFiles = await api().listFiles(root, ['.xml'])
  const ibatisXmlPaths = ibatisFiles.filter(
    (f) => f.includes('/sqlmap/') && !f.includes('/test/')
  )

  const vueFiles = await api().listFiles(root, ['.vue'])
  const htmlFiles = await api().listFiles(root, ['.html'])
  const htmlModelFiles = htmlFiles.filter((f) => f.includes('/model/'))

  // DB 스크립트 폴더 찾기
  const subDirs = await api().listDirs(join(root, '..'))
  const dbDir =
    subDirs.find((d) => basename(d).endsWith('_db')) ||
    (await api().pathExists(join(root, '..', name + '_db')))
      ? join(root, '..', name + '_db')
      : null

  const hasVue = vueFiles.length > 0
  const hasHtmlModel = htmlModelFiles.length > 0

  const type =
    name.startsWith('ubsfe') ? 'ubsfe' : name.startsWith('KSA') ? 'ksa' : 'unknown'

  const subProject: SubProject = {
    name,
    path: root,
    hasVue,
    hasHtmlModel,
    serviceMapPaths,
    ibatisXmlPaths,
    dbScriptPath: dbDir as string | null
  }

  return {
    rootPath: root,
    type: hasVue ? 'ubsfe' : hasHtmlModel ? 'ksa' : type,
    name,
    subProjects: [subProject]
  }
}
