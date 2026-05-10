import * as storage from './storage';
import demoData from '../data/demoTransparencyFeeds.json';
import incomingDemoData from '../data/demoIncomingDonations.json';

const VERSION_KEY = 'demoTransparencyHydratedVersion';
/** Bump when demo JSON changes so dev devices pick up new seed posts / incoming rows. */
export const DEMO_TRANSPARENCY_VERSION = 2;

/** Causes used by bundled demo content (feeds, incoming, integrity reset). */
export const DEMO_CAUSE_IDS = ['prj-1', 'prj-2', 'prj-3'];

function hoursAgoToIso(hoursAgo) {
  const ms = Number(hoursAgo) * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

/**
 * Merges bundled demo transparency posts into cause feeds (deduped by id).
 * Timestamps use hoursAgo so Story stays “recent” relative to device clock (good for Track / unfiltered feed).
 */
export async function hydrateDemoTransparencyFeeds() {
  try {
    const v = await storage.load(VERSION_KEY, 0);
    if (v >= DEMO_TRANSPARENCY_VERSION) return;

    const feeds = demoData.feeds || [];
    for (const block of feeds) {
      const causeId = block.causeId;
      if (!causeId) continue;
      const key = `causeFeed_${causeId}`;
      const existing = (await storage.load(key, [])) || [];
      const existingIds = new Set(existing.map((p) => p.id));
      const merged = [...existing];

      for (const raw of block.posts || []) {
        if (!raw.id || existingIds.has(raw.id)) continue;
        const post = {
          id: raw.id,
          text: raw.text || '',
          createdAt: hoursAgoToIso(raw.hoursAgo ?? 0),
          authorName: raw.authorName,
          journeyStage: typeof raw.journeyStage === 'number' ? raw.journeyStage : undefined,
          allocationTag: raw.allocationTag || undefined,
          imageUri: raw.imageUri || null,
        };
        merged.push(post);
        existingIds.add(post.id);
      }

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      await storage.save(key, merged);
    }

    /** Sample incoming donations so Organization → Funds shows non-zero totals (deduped by donationId). */
    const incomingRows = incomingDemoData.donations || [];
    const incomingList = (await storage.load('incomingDonations', [])) || [];
    const incIds = new Set(incomingList.map((r) => String(r.donationId || '')));
    const incMerged = [...incomingList];
    for (const raw of incomingRows) {
      if (!raw.donationId || incIds.has(raw.donationId)) continue;
      incMerged.push({
        projectId: raw.projectId,
        amount: Number(raw.amount) || 0,
        donationId: raw.donationId,
        createdAt: hoursAgoToIso(raw.hoursAgo ?? 0),
      });
      incIds.add(raw.donationId);
    }
    incMerged.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    await storage.save('incomingDonations', incMerged);

    await storage.save(VERSION_KEY, DEMO_TRANSPARENCY_VERSION);

    /** Seed integrity averages for demo causes (only if unset). */
    const ratings = (await storage.load('integrityRatings', {})) || {};
    const demoRatings = {
      'prj-1': { sum: 21, count: 5 },
      'prj-2': { sum: 17, count: 4 },
      'prj-3': { sum: 9, count: 2 },
    };
    let ratingsDirty = false;
    for (const [cid, row] of Object.entries(demoRatings)) {
      if (!ratings[cid] || !ratings[cid].count) {
        ratings[cid] = row;
        ratingsDirty = true;
      }
    }
    if (ratingsDirty) await storage.save('integrityRatings', ratings);
  } catch (e) {
    console.warn('hydrateDemoTransparencyFeeds', e);
  }
}

/**
 * Removes bundled demo rows (prefixed ids), clears the hydration flag and demo integrity entries,
 * then re-runs hydration so rehearsal matches a fresh install.
 * Does not remove user accounts, your own donations/receipts, or non-demo cause feeds.
 */
/**
 * If this organization has no causes yet, attach minimal stubs for prj-1…3 so Funds reflects bundled incoming.
 */
export async function hydrateOrgDemoCausesIfNeeded(user) {
  if (!user || user.role !== 'organization') return;
  try {
    const mine = (await storage.loadForUser(user, 'myFundraisers', [])) || [];
    if (mine.length > 0) return;
    const pack = (await import('../data/seedFundraisers.json')).fundraisers || [];
    const pick = pack.filter((f) => DEMO_CAUSE_IDS.includes(String(f.id)));
    const stubs = pick.map((f) => ({
      id: f.id,
      name: f.name,
      tags: [],
      method: f.description || '',
      image: f.image || null,
      ingredients: [],
      published: true,
      demoOrgStub: true,
    }));
    await storage.saveForUser(user, 'myFundraisers', stubs);
  } catch (e) {
    console.warn('hydrateOrgDemoCausesIfNeeded', e);
  }
}

export async function resetDemoSeedData() {
  try {
    await storage.remove(VERSION_KEY);

    for (const causeId of DEMO_CAUSE_IDS) {
      const key = `causeFeed_${causeId}`;
      const feed = (await storage.load(key, [])) || [];
      await storage.save(
        key,
        feed.filter((p) => !String(p.id || '').startsWith('demo-seed-'))
      );
    }

    const inc = (await storage.load('incomingDonations', [])) || [];
    await storage.save(
      'incomingDonations',
      inc.filter((r) => !String(r.donationId || '').startsWith('demo-inc-'))
    );

    const ratings = (await storage.load('integrityRatings', {})) || {};
    for (const cid of DEMO_CAUSE_IDS) {
      delete ratings[cid];
    }
    await storage.save('integrityRatings', ratings);

    await hydrateDemoTransparencyFeeds();
  } catch (e) {
    console.warn('resetDemoSeedData', e);
    throw e;
  }
}
