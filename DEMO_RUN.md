Demo run script — Presenting allocation transparency

Steps to run the demo (local / Expo):

1. Start the app

   ```bash
   npm start
   # or
   expo start
   ```

2. Sign in as an org user (use `Profile → Login`) or use seeded demo org account.

3. Open: **Org Funds** → tap **Manage** on a cause.

4. In the Manage Allocations screen:
   - Tap **Run demo simulation** to seed incoming donations and create/release a `Materials (demo)` allocation.
   - Observe the success alert showing how much was assigned.
   - Tap **Export assignments (CSV)** or **Export JSON** to open an in-app modal with the exported data (also logged to console).

5. Switch to **My Donations** (Profile → My Donations) to see each donation show a small allocation bar. Tap a segment to view assignment details and proof hash.

6. Optional: Use **Mark Synced** in Manage Allocations to simulate backend reconciliation. Exports include SHA-256 proofs for each assignment for auditability.

Notes for the presenter:

- All data is local (AsyncStorage) for demo simplicity. The `Mark Synced` and `Export` features are placeholders to demonstrate what a backend integration would do.
- You can copy/paste exported JSON/CSV from the modal to share with reviewers.
