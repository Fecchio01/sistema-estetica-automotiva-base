import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' }

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
    const isPortalRoute = pathname.startsWith('/portal/') && pathname.split('/').filter(Boolean).length === 2
    const relative = pathname === '/' || isPortalRoute ? 'index.html' : pathname.replace(/^[/\\]+/, '')
    const filePath = normalize(join(root, relative))
    if (!filePath.startsWith(normalize(root))) throw new Error('forbidden')
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('not found')
    response.writeHead(200, { 'Content-Type': types[extname(filePath)] ?? 'application/octet-stream' })
    response.end(await readFile(filePath))
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('not found') }
}).listen(4174, () => console.log('Atelier OS local server: http://127.0.0.1:4174/'))
