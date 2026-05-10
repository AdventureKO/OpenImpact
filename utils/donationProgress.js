import * as storage from './storage';

const MAX_STEP = 4;

/** Demo helper: advance shipment-style journey for a logged-in contributor's donation. */
export async function advanceDonationJourney(user, donationId) {
  if (!user || !donationId) return null;
  const list = (await storage.loadForUser(user, 'donations', [])) || [];
  const idx = list.findIndex((d) => d.id === donationId);
  if (idx < 0) return null;
  const copy = { ...list[idx] };
  copy.journeyStep = Math.min((copy.journeyStep ?? 0) + 1, MAX_STEP);
  const next = [...list];
  next[idx] = copy;
  await storage.saveForUser(user, 'donations', next);
  return copy;
}
