// Gọi backend qua /api (Vite proxy sang FastAPI). Tự gắn token đăng nhập.

const TOKEN_KEY = "access_token"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Trình duyệt chặn localStorage: phiên đăng nhập chỉ còn trong bộ nhớ
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  }
  const qs = params.toString()
  return `/api${path}${qs ? `?${qs}` : ""}`
}

async function request<T>(method: string, path: string, options: { query?: Query; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), { method, headers, body })
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.")
  }
  if (response.status === 401 && token) setToken(null)
  if (!response.ok) {
    let message = `Lỗi ${response.status}`
    try {
      const data = await response.json()
      if (typeof data.detail === "string") message = data.detail
    } catch {
      // phản hồi không phải JSON
    }
    if (response.status === 502 || response.status === 504) message = "Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa."
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

/** Tải file cần đăng nhập: thẻ <a> thường không gửi được header Authorization nên phải tải qua fetch */
async function download(path: string, fileName: string) {
  const token = getToken()
  let response: Response
  try {
    response = await fetch(buildUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.")
  }
  if (!response.ok) {
    let message = `Lỗi ${response.status}`
    try {
      const data = await response.json()
      if (typeof data.detail === "string") message = data.detail
    } catch {
      // phản hồi không phải JSON
    }
    throw new ApiError(response.status, message)
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export const api = {
  download,
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>("POST", path, { body, query }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
}
