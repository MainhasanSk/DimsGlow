# DIMSGLOW — First Owner Secure Bootstrap Guide

## Overview

Per `RULES.md` and `SECURITY.md`, customer registration never grants staff privileges, and there is no hardcoded admin backdoor or public staff sign-up form. Privileged access requires a verified identity in Firebase Authentication and an active authorization record in the canonical Firestore collection `userAccess/{uid}`.

## Procedure

1. **Create Identity in Firebase Authentication:**
   - In the Firebase Console (or through the storefront sign-up form at `/sign-up`), create the designated store owner's account (e.g. `owner@dimsglow.com`).

2. **Execute Secure Bootstrap Script:**
   ```bash
   npx tsx scripts/bootstrap-owner.ts owner@dimsglow.com
   ```

3. **Verification:**
   - The script sets `userAccess/{uid}` with:
     - `role`: `'owner'`
     - `permissions`: All management permissions
     - `status`: `'active'`
   - The user can now access `/admin` and provision staff roles via the Staff Management service.
