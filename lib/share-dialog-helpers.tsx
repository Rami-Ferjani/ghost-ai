import { clerkClient } from "@clerk/nextjs/server";

/**
 * Enriched display data for a collaborator email, as returned by the Clerk
 * enrichment helper used by the share dialog.
 */
export interface CollaboratorEnrichment {
  /** Display name from Clerk, or the collaborator email when Clerk lookup fails. */
  name: string;
  /** Avatar (profile image) URL from Clerk, or null when not available. */
  avatarUrl: string | null;
  /** The collaborator email, unchanged, for display and keying. */
  email: string;
}

/**
 * Fetch enriched display data for a collaborator email from Clerk.
 *
 * Enriches the collaborator email with Clerk display name and avatar. If the
 * Clerk lookup fails (fetch error) or no Clerk user exists for the email, it
 * falls back to the email-only display so the share dialog can still render
 * without crashing. Uses Clerk identity only — no local user table.
 *
 * NOTE: the pinned Clerk SDK (nextjs 7.5.7 / backend 3.8.2) has no
 * `fetchByEmail` method; the available BAPI user lookup
 * (`getUserList` with an `emailAddress` filter) is used as the equivalent
 * email -> user lookup.
 */
export async function fetchCollaboratorByEmail(
  email: string,
): Promise<CollaboratorEnrichment> {
  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({ emailAddress: [email] });
    const user = users.data.find(
      (u) =>
        u.primaryEmailAddress?.emailAddress?.toLowerCase() === email.toLowerCase(),
    );
    if (!user) {
      // No Clerk user for this email: fall back to email-only display.
      return { name: email, avatarUrl: null, email };
    }
    return {
      name: user.fullName ?? email,
      avatarUrl: user.hasImage ? user.imageUrl : null,
      email,
    };
  } catch {
    // Enrichment fetch failure: fall back to email-only (no crash).
    return { name: email, avatarUrl: null, email };
  }
}
