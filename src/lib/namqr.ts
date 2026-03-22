/**
 * NAMQR Code utilities – TLV build, CRC16/CCITT-FALSE, parse.
 * Aligns with FINERACT_PRD_ALIGNMENT.md Part B.5 (NAMQR v5.0).
 * Location: ketchup-portals/src/lib/namqr.ts
 */

/** Point of initiation: 11=payee static, 12=payee dynamic, 13=payer static, 14=payer dynamic */
export type PointOfInitiation = "11" | "12" | "13" | "14";

export type NamqrGenerateParams = {
  point_of_initiation: PointOfInitiation;
  payee_id: string; // Tag 26 or 29 – globally unique identifier (e.g. IPP alias)
  merchant_category_code?: string; // Tag 52, e.g. "0000"
  country_code: string; // Tag 58, e.g. "NA"
  payee_name: string; // Tag 59
  payee_city?: string; // Tag 60
  /** For dynamic: transaction currency (Tag 53), e.g. "NAD" */
  transaction_currency?: string;
  /** For dynamic: amount (Tag 54) */
  transaction_amount?: string;
  /** Reference/short description (Tag 62) */
  reference?: string;
  /** NAMQR expiry (Tag 82), format per spec */
  expiry_datetime?: string;
};

export type NamqrValidateResult = {
  valid: boolean;
  payee_name?: string;
  payee_id?: string;
  transaction_amount?: string;
  transaction_currency?: string;
  reference?: string;
  nref?: string;
  errors?: string[];
};

const TAG_PAYLOAD_FORMAT = "00";
const TAG_POINT_OF_INITIATION = "01";
const TAG_MERCHANT_CATEGORY = "52";
const TAG_TRANSACTION_CURRENCY = "53";
const TAG_TRANSACTION_AMOUNT = "54";
const TAG_COUNTRY = "58";
const TAG_PAYEE_NAME = "59";
const TAG_PAYEE_CITY = "60";
const TAG_REFERENCE = "62";
const TAG_CRC = "63";
const TAG_NREF = "65";
const TAG_EXPIRY = "82";

const PAYLOAD_FORMAT_VALUE = "01"; // NAMQR v5

const MAX_PAYLOAD_LENGTH = 512;

/**
 * Pad numeric string to two digits.
 */
function pad2(n: number): string {
  const s = String(n);
  return s.length >= 2 ? s.slice(0, 2) : s.padStart(2, "0");
}

/**
 * Build one TLV segment: tag (2) + length (2) + value.
 */
function tlvSegment(tag: string, value: string): string {
  if (value.length > 99) throw new Error(`NAMQR tag ${tag} value length exceeds 99`);
  return tag + pad2(value.length) + value;
}

/**
 * CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF). Used for Tag 63.
 * Input: string encoded as UTF-8 bytes.
 */
function crc16ccittFalse(input: string): number {
  const bytes = Buffer.from(input, "utf8");
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]! << 8;
    for (let k = 0; k < 8; k++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc;
}

/**
 * Build NAMQR TLV payload with Tag 63 (CRC) last. Tag 00 first.
 * NREF (Tag 65) is inserted before CRC. CRC is computed over payload including "63" + length of CRC value.
 */
export function buildNamqrPayload(params: NamqrGenerateParams, nref: string): string {
  const parts: string[] = [];

  parts.push(tlvSegment(TAG_PAYLOAD_FORMAT, PAYLOAD_FORMAT_VALUE));
  parts.push(tlvSegment(TAG_POINT_OF_INITIATION, params.point_of_initiation));
  parts.push(tlvSegment(params.payee_id.length <= 25 ? "26" : "29", params.payee_id));
  parts.push(tlvSegment(TAG_MERCHANT_CATEGORY, params.merchant_category_code ?? "0000"));
  parts.push(tlvSegment(TAG_COUNTRY, params.country_code));
  parts.push(tlvSegment(TAG_PAYEE_NAME, params.payee_name));
  if (params.payee_city) parts.push(tlvSegment(TAG_PAYEE_CITY, params.payee_city));
  if (params.transaction_currency) parts.push(tlvSegment(TAG_TRANSACTION_CURRENCY, params.transaction_currency));
  if (params.transaction_amount) parts.push(tlvSegment(TAG_TRANSACTION_AMOUNT, params.transaction_amount));
  if (params.reference) parts.push(tlvSegment(TAG_REFERENCE, params.reference));
  if (params.expiry_datetime) parts.push(tlvSegment(TAG_EXPIRY, params.expiry_datetime));
  parts.push(tlvSegment(TAG_NREF, nref));

  const crcValueLength = 4; // 4 hex digits
  const tag63Prefix = TAG_CRC + pad2(crcValueLength);
  const payloadWithoutCrcValue = parts.join("") + tag63Prefix;
  const crc = crc16ccittFalse(payloadWithoutCrcValue);
  const crcHex = crc.toString(16).toUpperCase().padStart(4, "0");
  const fullPayload = payloadWithoutCrcValue + crcHex;

  if (fullPayload.length > MAX_PAYLOAD_LENGTH) {
    throw new Error(`NAMQR payload length ${fullPayload.length} exceeds ${MAX_PAYLOAD_LENGTH}`);
  }
  return fullPayload;
}

/**
 * Parse TLV payload into tag -> value map. Does not validate CRC.
 */
export function parseTlv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const lenStr = payload.slice(i + 2, i + 4);
    const len = parseInt(lenStr, 10);
    if (isNaN(len) || len < 0 || len > 99) break;
    i += 4;
    if (i + len > payload.length) break;
    const value = payload.slice(i, i + len);
    out[tag] = value;
    i += len;
  }
  return out;
}

/**
 * Validate CRC (Tag 63 must be last). Returns true if CRC matches.
 */
export function validateCrc(payload: string): boolean {
  const lastTag = payload.slice(-6, -4); // "63"
  const lenStr = payload.slice(-4, -2);
  const len = parseInt(lenStr, 10);
  if (lastTag !== TAG_CRC || len !== 4) return false;
  const payloadWithoutCrcValue = payload.slice(0, -4); // exclude 4-char CRC value
  const expectedCrc = payload.slice(-4);
  const computed = crc16ccittFalse(payloadWithoutCrcValue);
  const computedHex = computed.toString(16).toUpperCase().padStart(4, "0");
  return computedHex === expectedCrc;
}

/**
 * Extract NREF (Tag 65) from payload. Returns undefined if not present.
 */
export function getNrefFromPayload(payload: string): string | undefined {
  const map = parseTlv(payload);
  return map[TAG_NREF];
}

/**
 * Check payload is NAMQR: Tag 00 first with value "01", Tag 63 last.
 */
export function isNamqrPayload(payload: string): boolean {
  if (payload.length < 8) return false;
  const tag00 = payload.slice(0, 2);
  const len00 = parseInt(payload.slice(2, 4), 10);
  if (tag00 !== TAG_PAYLOAD_FORMAT || len00 !== 2) return false;
  const value00 = payload.slice(4, 6);
  if (value00 !== PAYLOAD_FORMAT_VALUE) return false;
  const lastTag = payload.slice(-6, -4);
  return lastTag === TAG_CRC;
}
