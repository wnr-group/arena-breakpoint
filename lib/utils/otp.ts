export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
