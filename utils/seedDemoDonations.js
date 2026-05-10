import * as allocations from "./allocations";
import * as storage from "./storage";

/** Seed demo donations and allocations for testing */
export async function seedDemoDonations() {
  try {
    // Always ensure incoming donations are tracked for allocation purposes
    const anonDonations = (await storage.load("anonDonations", [])) || [];

    if (anonDonations.length === 0) {
      // Create fresh demo donations if none exist
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
      await storage.save("anonDonations", donations);
      anonDonations.push(...donations);
    }

    // ALWAYS sync anonDonations to incomingDonations for allocation tracking
    const incoming = anonDonations.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      amount: d.amount,
      createdAt: d.createdAt,
    }));
    await storage.save("incomingDonations", incoming);

    // ALWAYS ensure allocation exists for p1
    const allocs = (await allocations.loadAllocationsForUser(null)) || [];
    const p1Alloc = allocs.find(
      (a) => a.projectId === "p1" && a.title === "Materials & Supplies",
    );

    console.log(
      "seedDemoDonations: synced",
      anonDonations.length,
      "donations to incomingDonations",
    );
    console.log(
      "seedDemoDonations: p1Alloc found?",
      !!p1Alloc,
      "releasedAt?",
      p1Alloc?.releasedAt,
    );

    if (!p1Alloc) {
      const alloc = await allocations.createAllocationForUser(
        null,
        "p1",
        "Materials & Supplies",
        10000,
      );
      console.log("seedDemoDonations: created allocation", alloc?.id);
      if (alloc && alloc.id) {
        // Release allocation so it assigns donations
        await allocations.releaseAllocation(null, alloc.id);
        console.log("seedDemoDonations: released allocation", alloc.id);
      }
    } else if (!p1Alloc.releasedAt) {
      // If allocation exists but isn't released, release it now
      await allocations.releaseAllocation(null, p1Alloc.id);
      console.log(
        "seedDemoDonations: released existing allocation",
        p1Alloc.id,
      );
    }

    const finalAssignments = await allocations.loadAssignments();
    console.log(
      "seedDemoDonations: done, assignments count =",
      finalAssignments.length,
    );
    return true;
  } catch (e) {
    console.warn("seedDemoDonations failed:", e);
    return false;
  }
}
