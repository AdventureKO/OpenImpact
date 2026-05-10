import * as storage from './storage';

/** Append a donation row so organizations can aggregate funds by cause (same device / demo). */
export async function appendIncomingDonation(entry) {
  const list = (await storage.load('incomingDonations', [])) || [];
  await storage.save('incomingDonations', [entry, ...list]);
}

export async function loadIncomingDonations() {
  return (await storage.load('incomingDonations', [])) || [];
}

export function sumIncomingForCause(incoming, causeId) {
  const id = String(causeId);
  return (incoming || [])
    .filter((r) => String(r.projectId) === id)
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
}
