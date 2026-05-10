import * as storage from './storage';
import { assignmentsForDonation } from './allocations';
import { loadIncomingDonations, sumIncomingForCause } from './fundTracking';

/** Calculate % of donations for a cause that have allocations. */
export async function calculateTransparencyScore(projectId: string): Promise<{ assigned: number; total: number; percentageAssigned: number }> {
  try {
    const incoming = await loadIncomingDonations();
    const causeDonations = (incoming || []).filter(d => String(d.projectId) === String(projectId));
    const total = causeDonations.length;
    if (total === 0) return { assigned: 0, total: 0, percentageAssigned: 100 };

    let assigned = 0;
    for (const don of causeDonations) {
      const assigns = await assignmentsForDonation(don.donationId || don.id || '');
      if ((assigns || []).length > 0) assigned++;
    }
    return { assigned, total, percentageAssigned: Math.round((assigned / total) * 100) };
  } catch (e) {
    console.warn('transparency score calc failed', e);
    return { assigned: 0, total: 0, percentageAssigned: 0 };
  }
}

export default { calculateTransparencyScore };
