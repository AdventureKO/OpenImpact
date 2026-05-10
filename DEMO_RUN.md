# OpenImpact 3-Minute Demo Script

**Goal**: Show how donors see where their money goes, and how orgs prove it.

---

## Pre-Demo Setup

1. Start the app: `npm start` or `expo start`
2. Have **two accounts ready**:
   - **Donor account** (email: `donor@demo.com` or register new)
   - **Org account** (email: `org@demo.com` or register new)
3. Test on iOS simulator, Android emulator, or Expo Go

---

## 3-Minute Demo Flow

### **Act 1: Donor Transparency** (~60 seconds)

1. **Login as Donor** → Tap **Browse** (or home screen)
2. Open **Clean Water for Village A** (prj-1)
3. Scroll to **Transparency Feed** section
   - *Show 3–4 posts tagged "Program," "Operations," "Infrastructure"*
   - **Say**: *"Before donating, see exactly what this org is doing. Real updates, not promises."*

### **Act 2: Track Your Donation** (~60 seconds)

4. Tap **Donate** → Enter $50 → Complete mock payment
5. After receipt, navigate to **Profile → My Donations**
6. **Tap the $50 donation** to expand allocation bar (shows colored segments)
7. **Tap a colored segment** to see details:
   - *Allocation name (e.g., "Materials")*
   - *Amount (e.g., "$30")*
   - *SHA-256 proof hash*
   - **Say**: *"This $30 of your donation is allocated to purchasing materials. The proof hash makes it tamper-evident."*

### **Act 3: Org Accountability** (~60 seconds)

8. **Switch to Org account** → Go to **Org Funds**
9. Tap **Manage** on Clean Water cause
10. **Tap "Run demo simulation"** → Alerts shows: *"Seeded 5 donations. Assigned $10,000 to Materials allocation."*
11. **Tap "Export assignments (CSV)"** → Shows modal with full data export
    - *Point to CSV columns: `allocationId, allocationTitle, amount, proof`*
    - **Say**: *"Every dollar-allocation is auditable. Export, verify, share with donors."*
12. Tap **"Sync to server"** button
    - *Simulates backend reconciliation*
    - **Say**: *"In production, this uploads to our API for verification and audit."*

---

## Key Talking Points

| Feature | Talking Point |
|---------|----------------|
| **Transparency Feed** | "Donors see real org updates—not just financial summaries." |
| **Allocation Bar** | "Per-donation tracking. Your $50 → exactly where it went." |
| **Colored Segments** | "Materials (green), Staff (blue), Operations (grey)—visual clarity." |
| **SHA-256 Proof** | "Cryptographic proof. Not a black box. Inspect it." |
| **Export** | "Take it to external auditors. Verify independently." |
| **Sync Button** | "Scales to production. Backend reconciliation without complexity." |

---

## If Presenter Asks Questions

**Q: "Isn't this just showing fake allocations?"**
- A: "Yes, this is demo data. In production, orgs sign allocations with verified identity. Donors can cross-check with org's public financials."

**Q: "How do you prevent fraud?"**
- A: "Cryptographic proofs, backend verification of org identity, and public audit trail. We're building trust through transparency, not blind faith."

**Q: "What's the advantage over standard charity sites?"**
- A: "Granular per-donation tracking + real-time updates tied to allocations + independent auditability. Most apps show aggregate breakdowns. This is personal accountability."

---

## File Reference

- **Demo seed data**: `data/demoTransparencyFeeds.json`, `data/demoIncomingDonations.json`
- **Reset button**: Profile → Settings → Reset demo seed data (if you want to start over)
- **Code**: Core allocation system in `utils/allocations.js`, UI in `app/org-allocations.tsx` + `components/DonationAllocationBar.tsx`

---

## Troubleshooting

- **Allocation bar not showing?** → Make sure to run "Run demo simulation" in Org Allocations first
- **No transparency feed posts?** → Check if seed data loaded; tap "Reset demo seed data" in Profile
- **Export showing no data?** → Run simulation first to populate assignments

