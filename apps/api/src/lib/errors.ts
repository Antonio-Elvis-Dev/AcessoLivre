export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}

export const notFound = (what = 'Recurso') =>
  new AppError(404, `${what} não encontrado.`, 'NOT_FOUND')
export const forbidden = (message: string) => new AppError(403, message, 'FORBIDDEN')
export const badRequest = (message: string, code = 'BAD_REQUEST') =>
  new AppError(400, message, code)
export const conflict = (message: string, code = 'CONFLICT') => new AppError(409, message, code)
