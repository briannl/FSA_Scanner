/**
 * Barcode utilities for normalization, validation, and checksum verification.
 * Strictly preserves leading zeros and handles UPC-A, EAN-13, EAN-8, GTIN-14.
 */

export function normalizeBarcode(raw: string): string {
  if (!raw) return "";
  // Trim spaces and remove dashes/formatting characters
  return raw.trim().replace(/[-\s]/g, "");
}

export function isValidBarcodeString(barcode: string): boolean {
  const normalized = normalizeBarcode(barcode);
  // Barcodes must consist entirely of digits and be between 6 and 18 characters
  return /^\d{6,18}$/.test(normalized);
}

export function detectBarcodeFormat(barcode: string): string {
  const normalized = normalizeBarcode(barcode);
  switch (normalized.length) {
    case 8:
      return "EAN-8";
    case 12:
      return "UPC-A";
    case 13:
      return "EAN-13";
    case 14:
      return "GTIN-14";
    default:
      return "CODE-128 / GTIN";
  }
}

/**
 * Standard Modulo-10 check digit verification for UPC-A, EAN-13, and EAN-8.
 */
export function verifyModulo10CheckDigit(barcode: string): boolean {
  const normalized = normalizeBarcode(barcode);
  if (!/^\d{8,14}$/.test(normalized)) {
    return false;
  }

  const digits = normalized.split("").map(Number);
  const checkDigit = digits[digits.length - 1];
  const payload = digits.slice(0, digits.length - 1);

  // For EAN-13 / GTIN: odd-indexed from right have weight 3, even weight 1
  let sum = 0;
  let weight = 3;
  for (let i = payload.length - 1; i >= 0; i--) {
    sum += payload[i] * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const remainder = sum % 10;
  const calculatedCheck = remainder === 0 ? 0 : 10 - remainder;
  return calculatedCheck === checkDigit;
}

/**
 * Returns all normalized representations of a barcode to guarantee
 * seamless cross-matching across UPC-A (12-digit), EAN-13 (13-digit),
 * and GTIN-14 (14-digit) without losing leading zeros.
 */
export function getBarcodeVariants(raw: string): string[] {
  const normalized = normalizeBarcode(raw);
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized);

  // Pad to standard GTIN-14 (14 digits) and EAN-13 (13 digits) if numeric
  if (/^\d+$/.test(normalized)) {
    if (normalized.length <= 13) {
      variants.add(normalized.padStart(14, "0"));
    }
    if (normalized.length <= 12) {
      variants.add(normalized.padStart(13, "0"));
    }

    // Strip leading zeros if present
    if (normalized.startsWith("0")) {
      const strippedOnce = normalized.slice(1);
      if (strippedOnce.length >= 8) {
        variants.add(strippedOnce);
      }
      if (normalized.startsWith("00")) {
        const strippedTwice = normalized.slice(2);
        if (strippedTwice.length >= 8) {
          variants.add(strippedTwice);
        }
      }
    }
  }

  return Array.from(variants);
}
