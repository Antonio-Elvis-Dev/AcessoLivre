import type { z } from 'zod'

/** Converte erros do Zod em { campo: mensagem } para mostrar nos campos do formulário. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    out[key] ??= issue.message
  }
  return out
}
