/**
 * owned-email-domains.unit.test.js — SHY-0714.
 *
 * Which email domains ShyTalk may put in a test or staff address: the ones
 * it owns, and the names reserved so that nobody can ever own them
 * (RFC 2606 / RFC 6761). Everything else belongs to someone who could
 * receive a password-reset link for the account.
 */
const { emailDomain, isOwnedEmailDomain } = require('../../scripts/lib/owned-email-domains');

describe('SHY-0714 — isOwnedEmailDomain', () => {
  test.each([
    ['shytalk.app', 'bought 2026-10-27'],
    ['dev.shytalk.app', 'a subdomain of an owned domain'],
    ['shyden.co.uk', 'the company site'],
    ['shytalk.shyden.co.uk', 'a subdomain of the company site'],
    ['example.com', 'RFC 2606'],
    ['example.net', 'RFC 2606'],
    ['example.org', 'RFC 2606'],
    ['mail.example.com', 'a subdomain of a reserved name'],
    ['shytalk.test', 'the .test TLD'],
    ['shytalk.invalid', 'the .invalid TLD'],
    ['shytalk.example', 'the .example TLD'],
    ['SHYTALK.APP', 'case is ignored'],
  ])('owns %s (%s)', (domain) => {
    expect(isOwnedEmailDomain(domain)).toBe(true);
  });

  test.each([
    ['shytalk.dev', 'nobody owns it; Shyden declined it'],
    ['shytalk.dev.test.com', 'a reserved word inside a real domain'],
    ['gmail.com', 'a real provider'],
    ['test.com', 'a real, registered domain'],
    ['example.co', 'not on the reserved list'],
    ['notexample.com', 'ends with the letters but is not a subdomain'],
    ['shytalk.app.evil.com', 'an owned name as a prefix'],
    ['fakeshytalk.app', 'ends with the letters but is not a subdomain'],
    ['shytalk.testing', 'a TLD that only starts like .test'],
    ['', 'empty'],
  ])('does not own %s (%s)', (domain) => {
    expect(isOwnedEmailDomain(domain)).toBe(false);
  });
});

describe('SHY-0714 — emailDomain', () => {
  test.each([
    ['admin@shytalk.dev', 'shytalk.dev'],
    ['Claude-Test@ShyTalk.App', 'shytalk.app'],
    ['a+tag@mail.example.com', 'mail.example.com'],
  ])('%s is at %s', (email, domain) => {
    expect(emailDomain(email)).toBe(domain);
  });

  test.each([[undefined], [null], [''], ['no-at-sign'], ['trailing@']])(
    '%p has no domain',
    (email) => {
      expect(emailDomain(email)).toBeNull();
    },
  );
});
