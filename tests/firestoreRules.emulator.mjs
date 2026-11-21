// Run only against a disposable, local Firestore emulator. This is deliberately
// not part of the ordinary mocked Vitest suite and never uses a cloud project.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const address = process.env.FIRESTORE_EMULATOR_HOST || '';
const match = /^127\.0\.0\.1:([0-9]{1,5})$/.exec(address);
if (!match || Number(match[1]) < 1 || Number(match[1]) > 65535) {
  throw new Error('Set FIRESTORE_EMULATOR_HOST to a disposable local emulator at 127.0.0.1:<port>. Cloud hosts are not supported.');
}
// A unique demo-only project isolates the synthetic data from other emulator
// users. No clear/export/delete operation is run against an existing project.
const projectId = `demo-lc-${randomBytes(10).toString('hex')}`;
let env;
let alice;
let bob;
let anonymous;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: Number(match[1]), rules: await readFile('firestore.rules', 'utf8') },
  });
  alice = env.authenticatedContext('alice').firestore();
  bob = env.authenticatedContext('bob').firestore();
  anonymous = env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'leaderboard', 'alice'), { userId: 'alice', displayName: 'Alice', xp: 1, level: 1 });
    await setDoc(doc(db, 'resources', 'sample'), { creatorId: 'alice', title: 'Synthetic sample' });
  });
});
after(async () => { if (env) await env.cleanup(); });

test('users can read their own private user document, not another user or anonymously', async () => {
  await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), { displayName: 'Alice' }));
  await assertSucceeds(getDoc(doc(alice, 'users', 'alice')));
  await assertFails(getDoc(doc(bob, 'users', 'alice')));
  await assertFails(getDoc(doc(anonymous, 'users', 'alice')));
});

test('clients cannot set or change server-owned role or billing fields', async () => {
  await assertFails(setDoc(doc(bob, 'users', 'bob'), { displayName: 'Bob', role: 'admin' }));
  await assertFails(updateDoc(doc(alice, 'users', 'alice'), { subscription: 'premium' }));
  await assertSucceeds(updateDoc(doc(alice, 'users', 'alice'), { displayName: 'Alice updated' }));
});

test('leaderboard is publicly readable but cannot be client-written', async () => {
  await assertSucceeds(getDoc(doc(anonymous, 'leaderboard', 'alice')));
  await assertFails(setDoc(doc(alice, 'leaderboard', 'alice'), { userId: 'alice', displayName: 'Alice', xp: 999, level: 1 }));
});

test('unknown collections are denied by default', async () => {
  await assertFails(getDoc(doc(alice, 'unknown_collection', 'record')));
  await assertFails(setDoc(doc(alice, 'unknown_collection', 'record'), { value: 1 }));
});

// Characterization tests document risks in the CURRENT repository policy. A
// passing result here is NOT privacy approval or a production launch gate.
test('known policy risk: resources are publicly readable', async () => {
  const snapshot = await assertSucceeds(getDoc(doc(anonymous, 'resources', 'sample')));
  assert.equal(snapshot.exists(), true);
});

test('known policy risk: public profiles permit extra fields including email', async () => {
  await assertSucceeds(setDoc(doc(alice, 'public_profiles', 'alice'), {
    userId: 'alice', displayName: 'Alice', email: 'synthetic@example.test',
  }));
  const snapshot = await assertSucceeds(getDoc(doc(anonymous, 'public_profiles', 'alice')));
  assert.equal(snapshot.data().email, 'synthetic@example.test');
});
