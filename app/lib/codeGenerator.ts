// Code generation utility

import { CODE_CHARS, CODE_LENGTH } from './constants'

/**
 * Generate a random 6-character code using uppercase letters and numbers
 * Excludes confusing characters: I, L, O, 0, 1
 */
export function generateCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return code
}

/**
 * Validate a code format (6 alphanumeric characters)
 */
export function isValidCodeFormat(code: string): boolean {
  const codeRegex = /^[A-Z2-9]{6}$/
  return codeRegex.test(code.toUpperCase())
}
