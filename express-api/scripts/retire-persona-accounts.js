'use strict';

/**
 * retire-persona-accounts.js — SHY-0714.
 *
 * The dev personas were created at @shytalk.dev, a domain nobody owns, so
 * whoever registers it can reset their passwords. This script retires the
 * Auth accounts at ONE named domain, in two runs: `disable` (reversible,
 * closes the hole at once), then `delete` once the replacements are proven.
 * `delete` refuses while any account at the domain is still enabled, and
 * every write is read back before the run reports success.
 *
 * Every other unowned domain is only counted. A tester who signed up with
 * their own mailbox owns it, and this repository's Actions logs are public,
 * so no address outside the named domain is ever printed.
 *
 * Usage (dev only; refuses any project that is not dev/local/emulator):
 *   node scripts/retire-persona-accounts.js --domain shytalk.dev [--mode list|disable|delete]
 */

const { assertSafeProject } = require('./provision-test-personas');
const { emailDomain, isOwnedEmailDomain } = require('./lib/owned-email-domains');

const MODES = ['list', 'disable', 'delete'];
// Only domains our own test data invented. An unowned domain is not enough:
// `gmail.com` is unowned too, and its dev users are real testers who own
// their mailboxes. shytalk.dev: every persona provision-test-personas.js
// created (SHY-0714). Add a domain only with the dev Auth count that shows
// our accounts there.
const RETIRABLE = ['shytalk.dev'];
// The Admin SDK's limit for one listUsers page and one deleteUsers call.
const LIST_PAGE = 1000;
const DELETE_BATCH = 1000;

function checkRequest(domain, mode) {
  if (!domain) throw new Error('a domain is required');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) throw new Error(`not a domain: ${domain}`);
  if (isOwnedEmailDomain(domain)) throw new Error(`${domain} is a domain ShyTalk owns`);
  if (!RETIRABLE.includes(domain.toLowerCase())) {
    throw new Error(
      `${domain} is not a domain our test data invented (retirable: ${RETIRABLE.join(', ')})`,
    );
  }
  if (!MODES.includes(mode)) throw new Error('mode must be list, disable or delete');
  return domain.toLowerCase();
}

async function listAllUsers(auth) {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(LIST_PAGE, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

async function survey(auth, domain) {
  const users = await listAllUsers(auth);
  const unownedByDomain = {};
  const targets = [];
  let noEmail = 0;
  for (const user of users) {
    const at = emailDomain(user.email);
    if (!at) {
      noEmail += 1;
      continue;
    }
    if (isOwnedEmailDomain(at)) continue;
    unownedByDomain[at] = (unownedByDomain[at] ?? 0) + 1;
    if (at === domain)
      targets.push({ uid: user.uid, email: user.email, disabled: Boolean(user.disabled) });
  }
  return { scanned: users.length, noEmail, unownedByDomain, targets };
}

const named = (accounts) => accounts.map((t) => `${t.uid} ${t.email}`).join(', ');

async function disable(auth, domain, targets) {
  const enabled = targets.filter((t) => !t.disabled);
  for (const t of enabled) await auth.updateUser(t.uid, { disabled: true });
  const after = await survey(auth, domain);
  const still = after.targets.filter((t) => !t.disabled);
  if (still.length) throw new Error(`still enabled after disabling: ${named(still)}`);
  return { ...after, acted: enabled.length };
}

async function remove(auth, domain, targets) {
  const enabled = targets.filter((t) => !t.disabled);
  if (enabled.length) throw new Error(`disable first; still enabled: ${named(enabled)}`);
  const uids = targets.map((t) => t.uid);
  const failures = [];
  for (let start = 0; start < uids.length; start += DELETE_BATCH) {
    const batch = uids.slice(start, start + DELETE_BATCH);
    const result = await auth.deleteUsers(batch);
    for (const { index, error } of result.errors) failures.push(`${batch[index]} ${error.message}`);
  }
  if (failures.length) {
    throw new Error(`${failures.length} of ${uids.length} deletes failed: ${failures.join(', ')}`);
  }
  const after = await survey(auth, domain);
  if (after.targets.length)
    throw new Error(`still present after deleting: ${named(after.targets)}`);
  return { ...after, acted: uids.length };
}

async function retireAccounts({ auth, domain: requested, mode }) {
  const domain = checkRequest(requested, mode);
  const found = await survey(auth, domain);
  if (mode === 'disable') return disable(auth, domain, found.targets);
  if (mode === 'delete') return remove(auth, domain, found.targets);
  return { ...found, acted: 0 };
}

function parseArgs(argv) {
  const options = { mode: 'list' };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (flag === '--domain') options.domain = value;
    else if (flag === '--mode') options.mode = value;
    else throw new Error(`unknown option: ${flag}`);
  }
  return options;
}

async function main({ argv, projectId, getAuth, log }) {
  let options;
  try {
    options = parseArgs(argv);
    checkRequest(options.domain, options.mode);
    assertSafeProject(projectId);
  } catch (e) {
    log(`RETIRE_FAILED ${e.message}`);
    return 2;
  }
  log(`RETIRE_PROJECT ${projectId}`);
  try {
    const report = await retireAccounts({ auth: getAuth(), ...options });
    log(`RETIRE_SCANNED ${report.scanned} (${report.noEmail} without an email)`);
    for (const d of Object.keys(report.unownedByDomain).sort()) {
      log(`RETIRE_UNOWNED ${d} ${report.unownedByDomain[d]}`);
    }
    for (const t of report.targets) {
      log(`RETIRE_TARGET ${t.uid} ${t.email} ${t.disabled ? 'disabled' : 'enabled'}`);
    }
    log(
      `RETIRE_DONE mode=${options.mode} domain=${options.domain.toLowerCase()} acted=${report.acted}`,
    );
    return 0;
  } catch (e) {
    log(`RETIRE_FAILED ${e.message}`);
    return 1;
  }
}

module.exports = { retireAccounts, main, DELETE_BATCH };

if (require.main === module) {
  require('../src/utils/firebase');
  const { getApp } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  main({
    argv: process.argv.slice(2),
    projectId:
      getApp().options.projectId || process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
    getAuth,
    // eslint-disable-next-line no-console -- operator-facing CLI; its output is the interface.
    log: (line) => console.log(line),
  }).then((code) => process.exit(code));
}
