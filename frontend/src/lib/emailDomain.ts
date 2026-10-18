/**
 * Client-side email domain parser.
 * Provides instantaneous UI feedback as users type their email.
 */
const COMMON_WEBMAIL = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'aim.com',
  'zoho.com', 'proton.me', 'protonmail.com', 'mail.com', 'gmx.com',
  'gmx.net', 'yandex.com', 'fastmail.com', 'tutanota.com'
]);

const TWO_PART_TLDS = new Set(['co.uk', 'com.au', 'co.in', 'com.br', 'org.uk', 'gov.uk']);

export interface DetectedBrand {
  isWorkEmail: boolean;
  domain: string;
  name: string;
}

export function detectBrandFromEmail(email: string): DetectedBrand {
  if (!email || !email.includes('@')) {
    return { isWorkEmail: false, domain: '', name: '' };
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) {
    return { isWorkEmail: false, domain: '', name: '' };
  }

  const rawDomain = parts[1].trim();
  if (!rawDomain || !rawDomain.includes('.')) {
    return { isWorkEmail: false, domain: '', name: '' };
  }

  if (COMMON_WEBMAIL.has(rawDomain)) {
    return { isWorkEmail: false, domain: '', name: '' };
  }

  const domainParts = rawDomain.split('.');
  const lastTwo = domainParts.slice(-2).join('.');

  let registeredDomain = '';
  let baseName = '';

  if (TWO_PART_TLDS.has(lastTwo) && domainParts.length >= 3) {
    registeredDomain = domainParts.slice(-3).join('.');
    baseName = domainParts[domainParts.length - 3];
  } else if (domainParts.length >= 2) {
    registeredDomain = domainParts.slice(-2).join('.');
    baseName = domainParts[domainParts.length - 2];
  } else {
    registeredDomain = rawDomain;
    baseName = domainParts[0];
  }

  const cleanName = baseName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    isWorkEmail: true,
    domain: registeredDomain,
    name: cleanName,
  };
}
