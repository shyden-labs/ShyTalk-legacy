'use strict';

/**
 * owned-email-domains.js — SHY-0714.
 *
 * The email domains a ShyTalk test or staff address may use: domains
 * ShyTalk owns, and names reserved so that nobody can ever own them
 * (RFC 2606: example.com/.net/.org and the .test, .invalid and .example
 * TLDs). An address anywhere else reaches a mailbox someone else can
 * read, and with it the account's password-reset link.
 */

// shytalk.app: registered 2026-10-27 in ShyTalk's own Cloudflare account.
// shyden.co.uk: the company site. shytalk.dev is NOT owned (Shyden
// 2026-10-27: "i'm not buying shytalk.dev. only shytalk.app.").
const OWNED = ['shytalk.app', 'shyden.co.uk'];
const RESERVED_DOMAINS = ['example.com', 'example.net', 'example.org'];
const RESERVED_TLDS = ['test', 'invalid', 'example'];

function isAtOrUnder(domain, parent) {
  return domain === parent || domain.endsWith('.' + parent);
}

function isOwnedEmailDomain(domain) {
  const d = String(domain || '').toLowerCase();
  if (!d) return false;
  if ([...OWNED, ...RESERVED_DOMAINS].some((parent) => isAtOrUnder(d, parent))) return true;
  return RESERVED_TLDS.includes(d.split('.').at(-1));
}

function emailDomain(email) {
  const at = String(email ?? '').lastIndexOf('@');
  const domain = at < 0 ? '' : email.slice(at + 1).toLowerCase();
  return domain || null;
}

module.exports = { emailDomain, isOwnedEmailDomain };
