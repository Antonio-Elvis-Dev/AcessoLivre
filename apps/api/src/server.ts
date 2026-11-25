import { mkdir } from 'node:fs/promises'
import { buildApp } from './app'
import { loadEnv } from './env'

const env = loadEnv()
await mkdir(env.UPLOAD_DIR, { recursive: true })
const app = await buildApp({ env })

const shutdown = async (signal: string) => {
  app.log.info(`${signal} recebido, encerrando...`)
  await app.close()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await app.listen({ port: env.PORT, host: env.HOST })
  app.log.info(`Documentação em http://localhost:${env.PORT}/docs`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
