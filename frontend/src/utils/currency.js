/**
 * Formats integer paise or whole rupees into Indian Rupee standard format (e.g., ₹1,250.00 or ₹150)
 */
export function formatCurrency(amountInRupees, includeDecimals = false) {
  const num = Number(amountInRupees) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
}

export function formatPaise(amountInPaise, includeDecimals = false) {
  const rupees = (Number(amountInPaise) || 0) / 100;
  return formatCurrency(rupees, includeDecimals);
}

