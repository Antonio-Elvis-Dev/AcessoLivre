import type { User } from '@prisma/client'
import type { PublicUser } from '@acessolivre/shared'
import { z } from 'zod'

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
})

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt.toISOString() }
}

export const errorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
})
