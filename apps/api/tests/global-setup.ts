import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

/**
 * Aplica as migrações no banco de testes (DATABASE_URL_TEST). Cada arquivo de teste
 * limpa as tabelas antes de cada caso (tests/helpers.ts).
 */
export default function setup() {
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/)
      if (m && !process.env[m[1] as string]) process.env[m[1] as string] = m[2]
    }
  }
  const url = process.env.DATABASE_URL_TEST
  if (!url) throw new Error('Defina DATABASE_URL_TEST (veja .env.example) para rodar os testes.')
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })
}
