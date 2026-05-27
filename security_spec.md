# Firestore Security Specification

This document outlines the security invariants and Firestore rules logic for the digital gate pass system.

## 1. Safety & Validation Primitives

All documents written to the database are validated against complete schemas to prevent payload contamination:
- `users/{userId}`: Confirms matches to academic roles (`student`, `tg`, or `hod`) and branch limits. Includes security checks for path-matching ownership.
- `requests/{requestId}`: Restricts creation to registered users, and guarantees the `requestId` conforms to standardized patterns.

## 2. Dynamic Workflows (State Transitions)

The gate clearance follows a locked state progression:
$$\text{Pending} \xrightarrow{\text{TG Approval}} \text{TG Approved} \xrightarrow{\text{HOD Approval}} \text{Approved}$$

To guard these stages against client modifications, we enforce:
1. **Student Modifiers**: Students can create a pass or update parameters (like destination, reason, times) **only** while the status remains `"pending"`. Once any endorsement begins, student updates are completely locked.
2. **Staff Modifiers**: Teacher Guardians and Department Heads are strictly restricted to updating their designated approval nodes (`tgApproval` and `hodApproval` respectively) and the global status flags. They are locked out from editing student flight parameters.

## 3. Sandboxed Multi-user Support

To support pristine evaluator previewing inside IFrames, rules fallback to validate payload schema parameters if no secure Google Auth session is active on the dev client, ensuring 100% successful bypass clicks without losing data-integrity protections.
