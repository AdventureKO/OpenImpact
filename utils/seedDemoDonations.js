import * as allocations from "./allocations";
import * as storage from "./storage";

/** Seed demo donations and allocations for testing */
export async function seedDemoDonations() {
  try {
    // Check if already seeded
    const existing = (await storage.load("anonDonations", [])) || [];
    if (existing.length > 0) return; // Already seeded

    // Create demo donations
    const donations = [
      {
        id: "d1",
        amount: 50,
        projectId: "p1",
        note: "Clean water project",
        createdAt: Date.now() - 86400000,
      },
      {
        id: "d2",
        amount: 100,
        projectId: "p1",
        note: "Clean water project",
        createdAt: Date.now() - 43200000,
      },
      {
        id: "d3",
        amount: 75,
        projectId: "p1",
        note: "Clean water project",
        createdAt: Date.now() - 21600000,
      },
      {
        id: "d4",
        amount: 30,
        projectId: "p2",
        note: "Education initiative",
        createdAt: Date.now() - 10800000,
      },
      {
        id: "d5",
        amount: 200,
        projectId: "p1",
        note: "Clean water project",
        createdAt: Date.now() - 3600000,
      },
    ];

    // Save donations
    await storage.save("anonDonations", donations);

    // Track incoming for org-funds view
    const incoming = donations.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      amount: d.amount,
      createdAt: d.createdAt,
    }));
    await storage.save("incomingDonations", incoming);

    // Create and release allocation for project p1
    const allocId = await allocations.createAllocationForUser(
      null,
      "p1",
      "Materials & Supplies",
      10000,
    );
    if (allocId) {
      // Release the allocation (marks it ready for assignment)
      await allocations.releaseAllocation(null, allocId);
    }

    console.log("seedDemoDonations: created 5 donations + allocation");
    return true;
  } catch (e) {
    console.warn("seedDemoDonations failed:", e);
    return false;
  }
}
