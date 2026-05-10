import * as Crypto from "expo-crypto";

export async function sha256OfString(s) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    String(s),
  );
}

export async function sha256OfObject(obj) {
  const s = JSON.stringify(obj, Object.keys(obj).sort());
  return await sha256OfString(s);
}

export async function proofForAssignment(assignment) {
  return await sha256OfObject({
    type: "assignment",
    id: assignment.id,
    donationId: assignment.donationId,
    allocationId: assignment.allocationId,
    amount: assignment.amount,
    createdAt: assignment.createdAt,
  });
}

export async function proofForAllocation(allocation) {
  return await sha256OfObject({
    type: "allocation",
    id: allocation.id,
    projectId: allocation.projectId,
    title: allocation.title,
    targetAmount: allocation.targetAmount,
    createdAt: allocation.createdAt,
    releasedAt: allocation.releasedAt,
  });
}

export default {
  sha256OfString,
  sha256OfObject,
  proofForAssignment,
  proofForAllocation,
};
