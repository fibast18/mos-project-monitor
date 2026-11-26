# Monthly Division-Head Reports — MOS Project Monitor v1.4.0

Website: https://projects.mysomis.com

## Report layout

Based on the monthly printed MOS monitoring matrix: each of the eight projects is a column, followed by rows for project location, implementing office, end-user, funding source, approved cost, contract duration, and selected month's status/update. The footer displays:

- Prepared by: ENGR. RICO J. PONO — Agricultural and Biosystems Engineer I
- Noted by: JOSE ARNIL C. CORONG, DVM — Vet IV / MOS-OIC

Reports print on **long bond paper 8.5 × 13 inches, landscape**, using a print-specific CSS page size. If more than eight projects exist, further groups appear on additional pages. Very long narratives may require multiple print pages.

## Automatic report month

- When opened, Reports selects the **previous completed calendar month**.
- For example: A report opened during November 2026 defaults to **October 2026 status/update**, prepared for November submission.
- Use the dropdown to view older months (or the current incomplete month as a live preview).
- If a project has one entry in the selected month, that exact note is shown.
- If it has multiple journal entries in the selected month, **all** notes appear in chronological order with dates.
- If it has no entry in that month, the **latest earlier entry** is carried forward, explicitly identified as carried forward.
- If there is no entry up to that month, it says no recorded update. Later dates never leak into past months.
- Project profiles come from the latest current Project 201 records in a live report; stored historical snapshots preserve the profile values at the time saved.

## Historical months and saved copies

All available past months can be reconstructed from the journal. A live report updates whenever the project's journal entries change.

Editors and administrators can click **Save monthly copy** to store a frozen snapshot into the authenticated Cloudflare D1 dataset. Use **Archive past months** to save all previously unarchived, completed months in one action. Select **Saved copy** to inspect the retained submission; select **Live** to inspect updates and changes. **Update saved copy** explicitly replaces the historical snapshot after confirmation.

Because Cloudflare synchronizes the entire dataset with revision conflict protection, verify that the cloud revision advances after saving. If another editor changed the dataset while offline, resolve the sync conflict before trusting the archive as remotely saved.

## Print and download

Open Reports, choose a month, and click **Print / Save PDF**. The app opens the print-ready sheet. Choose Print (or Save as PDF), landscape orientation, and Folio/Long (8.5 × 13 in). Where pop-up windows are blocked, the app downloads an HTML copy as a fallback. **Download HTML** also allows keeping the exact currently displayed live or saved report without a separate PDF library.

## Privacy and access

The public GitHub repository contains only the printing/formatting code, not private project data. Reports use existing authorized Cloudflare logins. Viewer accounts can read, print, and download reports; only editor/admin accounts can archive or replace them. The application, reports engine and MOS logo are offline cached; cloud sync requires connectivity. No paid AI or additional hosting service is required.

## Version and deployment

v1.4.0 is cumulative from v1.3.2 and retains the original project data format, Cloudflare Worker URL, existing authentication, project notes, Project 201 profiles, AI Analyst, AI Advisor, JSON backup, offline support, and domain. GitHub Actions validates and deploys the website on commits; no Cloudflare Worker redeployment or D1 SQL migration is required.
