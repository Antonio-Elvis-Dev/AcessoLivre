import { existsSync, readFileSync } from 'node:fs'

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/)
    if (m && !process.env[m[1] as string]) process.env[m[1] as string] = m[2]
  }
}
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
process.env.JWT_SECRET ??= 'segredo-de-teste-com-mais-de-16-caracteres'
process.env.UPLOAD_DIR = './tests/.uploads'
process.env.PUBLIC_URL = 'http://api.test'
