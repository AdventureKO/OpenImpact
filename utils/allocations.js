import { loadIncomingDonations } from "./fundTracking";
import * as proofs from "./proofs";
import * as storage from "./storage";

const ALLOCATIONS_KEY = "allocations";
const ASSIGNMENTS_KEY = "allocationAssignments";

export async function loadAllocationsForUser(user) {
  return (await storage.loadForUser(user, ALLOCATIONS_KEY, [])) || [];
}

export async function saveAllocationsForUser(user, list) {
  return storage.saveForUser(user, ALLOCATIONS_KEY, list);
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function createAllocationForUser(
  user,
  projectId,
  title,
  targetAmount,
  releaseNow = false,
) {
  const list = (await loadAllocationsForUser(user)) || [];
  const alloc = {
    id: generateId(),
    projectId: String(projectId),
    title: title || "Allocation",
    targetAmount: Number(targetAmount) || 0,
    createdAt: Date.now(),
    releasedAt: releaseNow ? Date.now() : null,
    createdBy: user ? user.email || user.id || user.name || "user" : null,
  };
  const next = [alloc, ...list];
  await saveAllocationsForUser(user, next);
  if (releaseNow) await releaseAllocation(user, alloc.id);
  return alloc;
}

export async function loadAssignments() {
  return (await storage.load(ASSIGNMENTS_KEY, [])) || [];
}

export async function saveAssignments(list) {
  return storage.save(ASSIGNMENTS_KEY, list);
}

export async function assignmentsForDonation(donationId) {
  const assigns = await loadAssignments();
  return assigns.filter((a) => String(a.donationId) === String(donationId));
}

export async function releaseAllocation(user, allocationId) {
  // mark allocation released and assign donation amounts to it in chronological order
  const all = (await loadAllocationsForUser(user)) || [];
  const idx = all.findIndex((a) => a.id === allocationId);
  if (idx === -1) return null;
  if (!all[idx].releasedAt) {
    all[idx].releasedAt = Date.now();
    await saveAllocationsForUser(user, all);
  }

  const allocation = all[idx];
  const incoming = await loadIncomingDonations();
  // filter donations for this project, earliest first
  const donations = (incoming || [])
    .filter((d) => String(d.projectId) === String(allocation.projectId))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const assignments = (await loadAssignments()) || [];
  let remaining = Number(allocation.targetAmount) || 0;

  for (const d of donations) {
    if (remaining <= 0) break;
    const already = assignments
      .filter((a) => String(a.donationId) === String(d.id))
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const avail = (Number(d.amount) || 0) - already;
    if (avail <= 0) continue;
    const take = Math.min(avail, remaining);
    const assignment = {
      id: generateId(),
      donationId: d.id,
      allocationId: allocation.id,
      allocationTitle: allocation.title,
      projectId: allocation.projectId,
      amount: take,
      createdAt: Date.now(),
      createdBy: allocation.createdBy || null,
    };
    try {
      assignment.proof = await proofs.proofForAssignment(assignment);
    } catch (e) {
      assignment.proof = null;
    }
    assignments.push(assignment);
    remaining -= take;
  }

  await saveAssignments(assignments);
  return { allocation, assigned: Number(allocation.targetAmount) - remaining };
}

export async function loadAssignmentsForProject(projectId) {
  const assignments = await loadAssignments();
  return (assignments || []).filter(
    (a) => a.projectId === projectId || a.projectId === String(projectId),
  );
}
export async function exportAssignmentsAsCSV() {
  const assigns = (await loadAssignments()) || [];
  const header = [
    "id",
    "donationId",
    "allocationId",
    "allocationTitle",
    "projectId",
    "amount",
    "createdAt",
    "proof",
  ];
  const rows = assigns.map((a) =>
    header
      .map((h) =>
        a[h] !== undefined && a[h] !== null
          ? String(a[h]).replace(/"/g, '""')
          : "",
      )
      .map((v) => `"${v}"`)
      .join(","),
  );
  // fallback simpler CSV
  const csv = [
    header.join(","),
    ...assigns.map(
      (a) =>
        `${a.id},${a.donationId},${a.allocationId},"${(a.allocationTitle || "").replace(/"/g, '""')}",${a.projectId},${a.amount},${a.createdAt},${a.proof || ""}`,
    ),
  ].join("\n");
  return csv;
}

export async function exportAllAsJSON() {
  const allocs = (await loadAllocationsForUser(null)) || [];
  const assigns = (await loadAssignments()) || [];
  return JSON.stringify({ allocations: allocs, assignments: assigns }, null, 2);
}

export default {
  loadAllocationsForUser,
  createAllocationForUser,
  releaseAllocation,
  assignmentsForDonation,
  loadAssignments,
};
