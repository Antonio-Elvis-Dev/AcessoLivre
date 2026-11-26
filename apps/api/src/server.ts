import { mkdir } from 'node:fs/promises'
import { networkInterfaces } from 'node:os'
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
  // Endereços que um celular na mesma rede Wi-Fi pode usar para acessar a API.
  const lanIps = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i!.address}:${env.PORT}/health`)
  if (lanIps.length)
    app.log.info(`No celular (mesma rede Wi-Fi), abra no navegador: ${lanIps.join('  ou  ')}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
