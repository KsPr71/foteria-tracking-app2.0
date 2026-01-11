/**
 * Formatea un string de números a formato de orden: XXXXX-XXX-XXXX
 * Solo acepta dígitos
 */
export function formatOrderNumber(input: string): string {
  // Remover todo lo que no sea dígito
  const digits = input.replace(/\D/g, "");

  // Limitar a 12 dígitos máximo
  const limited = digits.slice(0, 12);

  // Aplicar formato: XXXXX-XXX-XXXX
  if (limited.length <= 5) {
    return limited;
  } else if (limited.length <= 8) {
    return `${limited.slice(0, 5)}-${limited.slice(5)}`;
  } else {
    return `${limited.slice(0, 5)}-${limited.slice(5, 8)}-${limited.slice(8)}`;
  }
}

/**
 * Valida si el string tiene el formato completo: XXXXX-XXX-XXXX
 */
export function isOrderNumberComplete(input: string): boolean {
  const regex = /^\d{5}-\d{3}-\d{4}$/;
  return regex.test(input);
}

/**
 * Obtiene solo los dígitos de un número de orden formateado
 */
export function getOrderDigits(input: string): string {
  return input.replace(/\D/g, "");
}
