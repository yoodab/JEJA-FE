export const formatPhoneNumber = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '')

  if (digits.length <= 3) return digits
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }
  if (digits.length <= 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}
