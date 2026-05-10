import * as allocations from "./allocations";

export async function mockSyncToServer(user) {
  // Loads allocations and assignments, simulates sending to server, and marks allocations as synced
  const allocs = (await allocations.loadAllocationsForUser(user)) || [];
  const assigns = (await allocations.loadAssignments()) || [];

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 400));

  // Simulate server response: mark all allocations as synced timestamp
  const now = Date.now();
  const updated = (allocs || []).map((a) => ({ ...a, syncedAt: now }));
  await allocations.saveAllocationsForUser(user, updated);

  return {
    success: true,
    syncedCount: updated.length,
    assignmentsSent: assigns.length,
  };
}

export default { mockSyncToServer };
