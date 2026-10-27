/**
 * retire-persona-accounts.unit.test.js — SHY-0714.
 *
 * The dev personas were created at @shytalk.dev, a domain nobody owns:
 * whoever registers it can reset their passwords. The script disables the
 * accounts at one named domain, then (a later run) deletes them. Every
 * other unowned domain is only counted, never named address by address:
 * a tester who signed up with their own mailbox owns it, and the repo's
 * Actions logs are public.
 *
 * Auth is a stand-in: pages of two users, writes recorded, and a switch
 * that makes a write silently not land, so the read-back is proven.
 */
const { retireAccounts, main, DELETE_BATCH } = require('../../scripts/retire-persona-accounts');

function fakeAuth(users, { dropWrites = false, deleteFailures = 0, dropDeletes = false } = {}) {
  const state = new Map(users.map((u) => [u.uid, { disabled: false, ...u }]));
  const PAGE = 2;
  const auth = {
    state,
    listUsers: jest.fn(async (_max, pageToken) => {
      const all = [...state.values()];
      const start = pageToken ? Number(pageToken) : 0;
      const page = all.slice(start, start + PAGE).map((u) => ({ ...u }));
      const next = start + PAGE < all.length ? String(start + PAGE) : undefined;
      return { users: page, pageToken: next };
    }),
    updateUser: jest.fn(async (uid, props) => {
      if (!dropWrites) Object.assign(state.get(uid), props);
      return { ...state.get(uid) };
    }),
    deleteUsers: jest.fn(async (uids) => {
      const failing = uids.slice(0, deleteFailures);
      if (!dropDeletes) for (const uid of uids.slice(deleteFailures)) state.delete(uid);
      return {
        successCount: uids.length - failing.length,
        failureCount: failing.length,
        errors: failing.map((uid, index) => ({
          index,
          error: { message: `cannot delete ${uid}` },
        })),
      };
    }),
  };
  return auth;
}

const USERS = [
  { uid: 'p1', email: 'admin@shytalk.dev' },
  { uid: 'p2', email: 'Host@ShyTalk.dev' },
  { uid: 'r1', email: 'someone.real@gmail.com' },
  { uid: 'r2', email: 'another@gmail.com' },
  { uid: 'o1', email: 'claude-test@shytalk.app' },
  { uid: 'n1', phoneNumber: '+440000000000' },
  { uid: 'p3', email: 'victim@shytalk.dev', disabled: true },
];

describe('SHY-0714 — retireAccounts, list mode', () => {
  test('reads every page and writes nothing', async () => {
    const auth = fakeAuth(USERS);
    const report = await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'list' });
    expect(auth.listUsers).toHaveBeenCalledTimes(4);
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(auth.deleteUsers).not.toHaveBeenCalled();
    expect(report).toEqual({
      scanned: 7,
      noEmail: 1,
      unownedByDomain: { 'shytalk.dev': 3, 'gmail.com': 2 },
      targets: [
        { uid: 'p1', email: 'admin@shytalk.dev', disabled: false },
        { uid: 'p2', email: 'Host@ShyTalk.dev', disabled: false },
        { uid: 'p3', email: 'victim@shytalk.dev', disabled: true },
      ],
      acted: 0,
    });
  });

  test('the per-domain counts hold no address', async () => {
    const report = await retireAccounts({
      auth: fakeAuth(USERS),
      domain: 'shytalk.dev',
      mode: 'list',
    });
    expect(JSON.stringify(report.unownedByDomain)).not.toContain('@');
  });

  test('the named domain is matched in any case, and only whole', async () => {
    const auth = fakeAuth([
      { uid: 'a', email: 'x@SHYTALK.DEV' },
      { uid: 'b', email: 'x@notshytalk.dev' },
      { uid: 'c', email: 'x@shytalk.dev.example.com' },
      { uid: 'd', email: 'x@sub.shytalk.dev' },
    ]);
    const report = await retireAccounts({ auth, domain: 'ShyTalk.Dev', mode: 'list' });
    expect(report.targets.map((t) => t.uid)).toEqual(['a']);
  });
});

describe('SHY-0714 — retireAccounts, disable mode', () => {
  test('disables each enabled account at the domain, and nothing else', async () => {
    const auth = fakeAuth(USERS);
    const report = await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'disable' });
    expect(auth.updateUser.mock.calls).toEqual([
      ['p1', { disabled: true }],
      ['p2', { disabled: true }],
    ]);
    expect(report.acted).toBe(2);
    expect([...auth.state.values()].filter((u) => u.disabled).map((u) => u.uid)).toEqual([
      'p1',
      'p2',
      'p3',
    ]);
  });

  test('a second run changes nothing', async () => {
    const auth = fakeAuth(USERS);
    await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'disable' });
    auth.updateUser.mockClear();
    const report = await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'disable' });
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(report.acted).toBe(0);
  });

  test('a write that did not land fails, naming the account', async () => {
    const auth = fakeAuth(USERS, { dropWrites: true });
    await expect(retireAccounts({ auth, domain: 'shytalk.dev', mode: 'disable' })).rejects.toThrow(
      'still enabled after disabling: p1 admin@shytalk.dev, p2 Host@ShyTalk.dev',
    );
  });
});

describe('SHY-0714 — retireAccounts, delete mode', () => {
  test('refuses, deleting nothing, while any account at the domain is enabled', async () => {
    const auth = fakeAuth(USERS);
    await expect(retireAccounts({ auth, domain: 'shytalk.dev', mode: 'delete' })).rejects.toThrow(
      'disable first; still enabled: p1 admin@shytalk.dev, p2 Host@ShyTalk.dev',
    );
    expect(auth.deleteUsers).not.toHaveBeenCalled();
  });

  test('deletes every disabled account at the domain, and nothing else', async () => {
    const auth = fakeAuth(USERS);
    await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'disable' });
    const report = await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'delete' });
    expect(auth.deleteUsers.mock.calls).toEqual([[['p1', 'p2', 'p3']]]);
    expect(report.acted).toBe(3);
    expect([...auth.state.keys()]).toEqual(['r1', 'r2', 'o1', 'n1']);
  });

  test('a failed delete fails the run, with each error', async () => {
    const auth = fakeAuth(USERS, { deleteFailures: 1 });
    await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'disable' });
    await expect(retireAccounts({ auth, domain: 'shytalk.dev', mode: 'delete' })).rejects.toThrow(
      '1 of 3 deletes failed: p1 cannot delete p1',
    );
  });

  test('a delete reported done that did not land fails, naming the account', async () => {
    const auth = fakeAuth(USERS, { dropDeletes: true });
    await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'disable' });
    await expect(retireAccounts({ auth, domain: 'shytalk.dev', mode: 'delete' })).rejects.toThrow(
      'still present after deleting: p1 admin@shytalk.dev, p2 Host@ShyTalk.dev, p3 victim@shytalk.dev',
    );
  });

  test('more accounts than one delete call takes are deleted in batches', async () => {
    const many = Array.from({ length: DELETE_BATCH + 1 }, (_, i) => ({
      uid: `u${i}`,
      email: `p${i}@shytalk.dev`,
      disabled: true,
    }));
    const auth = fakeAuth(many);
    const report = await retireAccounts({ auth, domain: 'shytalk.dev', mode: 'delete' });
    expect(auth.deleteUsers.mock.calls.map(([uids]) => uids.length)).toEqual([DELETE_BATCH, 1]);
    expect(report.acted).toBe(DELETE_BATCH + 1);
    expect(auth.state.size).toBe(0);
  });

  test('DELETE_BATCH is the Admin SDK limit for one deleteUsers call', () => {
    expect(DELETE_BATCH).toBe(1000);
  });
});

describe('SHY-0714 — retireAccounts refuses what it must never act on', () => {
  test.each([
    [
      'an owned domain',
      { domain: 'shytalk.app', mode: 'disable' },
      'shytalk.app is a domain ShyTalk owns',
    ],
    [
      'a real provider, whose users own their mailboxes',
      { domain: 'gmail.com', mode: 'disable' },
      'gmail.com is not a domain our test data invented (retirable: shytalk.dev)',
    ],
    [
      'a domain that only ends like a retirable one',
      { domain: 'notshytalk.dev', mode: 'delete' },
      'notshytalk.dev is not a domain our test data invented (retirable: shytalk.dev)',
    ],
    [
      'a reserved name',
      { domain: 'example.com', mode: 'delete' },
      'example.com is a domain ShyTalk owns',
    ],
    ['no domain', { mode: 'list' }, 'a domain is required'],
    [
      'an address for a domain',
      { domain: 'a@shytalk.dev', mode: 'list' },
      'not a domain: a@shytalk.dev',
    ],
    [
      'an unknown mode',
      { domain: 'shytalk.dev', mode: 'purge' },
      'mode must be list, disable or delete',
    ],
  ])('%s', async (_case, args, message) => {
    const auth = fakeAuth(USERS);
    await expect(retireAccounts({ auth, ...args })).rejects.toThrow(message);
    expect(auth.listUsers).not.toHaveBeenCalled();
  });
});

describe('SHY-0714 — main', () => {
  // `projectId` is read with `in`, not a default, so a test can pass undefined.
  function run(argv, options = {}) {
    const projectId = 'projectId' in options ? options.projectId : 'shytalk-dev';
    const auth = options.auth ?? fakeAuth(USERS);
    const lines = [];
    const result = main({ argv, projectId, getAuth: () => auth, log: (l) => lines.push(l) });
    return result.then((code) => ({ code, lines, auth }));
  }

  test('prints the scan, the counts, each target and the outcome', async () => {
    const { code, lines } = await run(['--domain', 'shytalk.dev', '--mode', 'disable']);
    expect({ code, lines }).toEqual({
      code: 0,
      lines: [
        'RETIRE_PROJECT shytalk-dev',
        'RETIRE_SCANNED 7 (1 without an email)',
        'RETIRE_UNOWNED gmail.com 2',
        'RETIRE_UNOWNED shytalk.dev 3',
        'RETIRE_TARGET p1 admin@shytalk.dev disabled',
        'RETIRE_TARGET p2 Host@ShyTalk.dev disabled',
        'RETIRE_TARGET p3 victim@shytalk.dev disabled',
        'RETIRE_DONE mode=disable domain=shytalk.dev acted=2',
      ],
    });
  });

  test('list is the default mode', async () => {
    const { code, lines, auth } = await run(['--domain', 'shytalk.dev']);
    expect(code).toBe(0);
    expect(lines.at(-1)).toBe('RETIRE_DONE mode=list domain=shytalk.dev acted=0');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  test.each([['shytalk-7ba69'], [''], [undefined]])(
    'refuses project %p before reading Auth',
    async (projectId) => {
      const auth = fakeAuth(USERS);
      const { code, lines } = await run(['--domain', 'shytalk.dev', '--mode', 'disable'], {
        projectId,
        auth,
      });
      expect(code).toBe(2);
      expect(lines.join('\n')).toContain('SAFETY: ');
      expect(auth.listUsers).not.toHaveBeenCalled();
    },
  );

  test.each([
    [['--mode', 'list'], 'a domain is required'],
    [['--domain'], 'a domain is required'],
    [['--domain', 'shytalk.dev', '--mode'], 'mode must be list, disable or delete'],
    [['--domain', 'shytalk.dev', '--bogus', 'x'], 'unknown option: --bogus'],
  ])('a bad command line %p exits 2 naming the fault', async (argv, message) => {
    const { code, lines } = await run(argv);
    expect({ code, last: lines.at(-1) }).toEqual({ code: 2, last: `RETIRE_FAILED ${message}` });
  });

  test('a failure while acting exits 1 naming it', async () => {
    const { code, lines } = await run(['--domain', 'shytalk.dev', '--mode', 'delete']);
    expect(code).toBe(1);
    expect(lines.at(-1)).toBe(
      'RETIRE_FAILED disable first; still enabled: p1 admin@shytalk.dev, p2 Host@ShyTalk.dev',
    );
  });
});
