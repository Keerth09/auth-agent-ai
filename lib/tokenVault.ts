/**
 * tokenVault.ts — Auth0 Token Vault Interface
 *
 * Security decisions:
 * - Tokens are NEVER stored in our database or memory beyond the current request
 * - We use the user's Auth0 ID token (from session) to perform token exchange
 * - The Token Exchange follows RFC 8693 — agent identity + user identity → scoped token
 * - Errors from Token Vault are mapped to TokenVaultError for consistent handling
 *
 * Auth0 Token Vault works via the "Token Exchange" grant type:
 *   POST /oauth/token
 *   grant_type=urn:ietf:params:oauth:grant-type:token-exchange
 *   subject_token={user_id_token}
 *   subject_token_type=urn:ietf:params:oauth:token-type:id_token
 *   requested_token_type=urn:auth0:params:oauth:token-type:connection
 *   connection={connection_name}
 */

import axios from 'axios';
import { TokenVaultError } from '@/lib/errors';
import { db } from '@/lib/database';
import { deleteGrant, listUserGrants } from '@/lib/managementClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Retrieve a fresh access token for an external connection via Token Vault.
 *
 * @param userId - Auth0 user ID (sub claim), used for audit logging only
 * @param connectionName - e.g. 'google-oauth2'
 * @param idToken - The user's Auth0 ID token from their session
 * @returns A short-lived access token for the external provider
 */
export async function getTokenForConnection(
  userId: string,
  connectionName: string,
  idToken: string
): Promise<string> {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!;

  // Check local revocation cache first — fast fail before hitting Auth0
  const revokedCheck = db.prepare(
    'SELECT id FROM revoked_grants WHERE user_id = ? AND connection = ?'
  ).get(userId, connectionName);

  if (revokedCheck) {
    throw new TokenVaultError(
      `Connection '${connectionName}' has been revoked for user. Re-authorize to reconnect.`,
      401
    );
  }

  try {
    /**
     * Token Exchange Request (RFC 8693)
     * Auth0 extension: connection parameter targets specific vault entry
     */
    const response = await axios.post(
      `https://${domain}/oauth/token`,
      new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_id: clientId,
        client_secret: clientSecret,
        subject_token: idToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        requested_token_type: 'urn:auth0:params:oauth:token-type:connection',
        connection: connectionName,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token } = response.data as { access_token: string };

    if (!access_token) {
      throw new TokenVaultError('Token Vault returned empty access token');
    }

    return access_token;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status || 502;
      const errorCode = err.response?.data?.error || 'unknown';
      const errorDesc =
        err.response?.data?.error_description || err.message;

      // 401/403 from Auth0 means grant was revoked externally
      if (status === 401 || status === 403) {
        // Sync our local cache with reality
        try {
          db.prepare(
            `INSERT OR IGNORE INTO revoked_grants (id, user_id, connection, revoked_at)
             VALUES (?, ?, ?, datetime('now'))`
          ).run(uuidv4(), userId, connectionName);
        } catch {
          // Ignore DB errors during error handling
        }

        throw new TokenVaultError(
          `Token Vault: connection '${connectionName}' is no longer authorized (${errorCode})`,
          401
        );
      }

      throw new TokenVaultError(`${errorCode}: ${errorDesc}`, status);
    }

    throw new TokenVaultError(String(err));
  }
}

/**
 * Revoke a vaulted connection for a user.
 *
 * Process:
 * 1. Find all Auth0 grants for the user
 * 2. Match grants against the connection's audience
 * 3. Delete matching grant(s) via Management API
 * 4. Record revocation locally for fast-fail on subsequent calls
 *
 * After revocation, any call to getTokenForConnection for this connection
 * will immediately fail with a 401 TokenVaultError.
 */
export async function revokeConnection(
  userId: string,
  connectionName: string
): Promise<{ revokedGrantIds: string[] }> {
  // List all grants for this user
  const grants = await listUserGrants(userId);

  // Filter to grants that belong to connection (by audience pattern)
  // For Google oauth2, the audience contains 'google'
  // We also delete ALL grants for this user/app to be thorough
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const matchingGrants = grants.filter(
    (g) => g.clientID === clientId
  );

  const revokedGrantIds: string[] = [];

  for (const grant of matchingGrants) {
    await deleteGrant(grant.id);
    revokedGrantIds.push(grant.id);
  }

  // Record revocation in local cache (prevents future Token Vault calls)
  db.prepare(
    `INSERT OR REPLACE INTO revoked_grants (id, user_id, connection, grant_id, revoked_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(uuidv4(), userId, connectionName, revokedGrantIds[0] || null);

  return { revokedGrantIds };
}

/**
 * List active (non-revoked) connections for a user.
 * Returns connection metadata from Auth0 Management API + local revocation status.
 */
export async function listActiveConnections(
  userId: string
): Promise<Array<{ connection: string; isRevoked: boolean; grantId?: string }>> {
  const clientId = process.env.AUTH0_CLIENT_ID!;

  try {
    const grants = await listUserGrants(userId);
    const userGrants = grants.filter((g) => g.clientID === clientId);

    // Check local revocation table
    const revokedRows = db.prepare(
      'SELECT connection FROM revoked_grants WHERE user_id = ?'
    ).all(userId) as Array<{ connection: string }>;
    const revokedSet = new Set(revokedRows.map((r) => r.connection));

    const googleConnection = process.env.AUTH0_CONNECTION_GOOGLE || 'google-oauth2';

    // Build result — include known connections
    const connections = [
      {
        connection: googleConnection,
        isRevoked: revokedSet.has(googleConnection),
        grantId: userGrants[0]?.id,
      },
    ];

    return connections;
  } catch {
    // If Management API fails, fall back to local revocation data only
    const googleConnection = process.env.AUTH0_CONNECTION_GOOGLE || 'google-oauth2';
    const revokedRows = db.prepare(
      'SELECT connection FROM revoked_grants WHERE user_id = ?'
    ).all(userId) as Array<{ connection: string }>;
    const revokedSet = new Set(revokedRows.map((r) => r.connection));

    return [
      {
        connection: googleConnection,
        isRevoked: revokedSet.has(googleConnection),
      },
    ];
  }
}

/**
 * Mask a token for safe audit logging.
 * Returns: first 8 chars + "..." + last 4 chars, e.g. "ya29.A0A...XXXX"
 */
export function maskToken(token: string): string {
  if (token.length <= 16) return '****';
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}
