/**
 * managementClient.ts — Auth0 Management API Client
 *
 * Security decisions:
 * - Uses Client Credentials flow (M2M) — no user secrets exposed
 * - M2M token is cached with a 10-second safety buffer before expiry
 * - Token is only used server-side, never returned to clients
 */

import axios from 'axios';
import { ManagementApiError } from '@/lib/errors';

interface M2MTokenCache {
  token: string;
  expiresAt: number; // Unix ms
}

let m2mTokenCache: M2MTokenCache | null = null;

/**
 * Fetches a cached Management API access token via Client Credentials.
 * Automatically refreshes when within 10 seconds of expiry.
 */
async function getManagementToken(): Promise<string> {
  const now = Date.now();
  const BUFFER_MS = 10_000; // 10-second safety buffer

  if (m2mTokenCache && m2mTokenCache.expiresAt - BUFFER_MS > now) {
    return m2mTokenCache.token;
  }

  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_M2M_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET!;
  const audience = process.env.AUTH0_M2M_AUDIENCE!;

  try {
    const response = await axios.post(
      `https://${domain}/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token, expires_in } = response.data as {
      access_token: string;
      expires_in: number;
    };

    m2mTokenCache = {
      token: access_token,
      expiresAt: now + expires_in * 1000,
    };

    return access_token;
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.error_description || err.message
      : String(err);
    throw new ManagementApiError(`Failed to obtain M2M token: ${msg}`);
  }
}

/**
 * List all grants for a given user.
 * GET /api/v2/grants?user_id={userId}&per_page=50
 */
export interface Auth0Grant {
  id: string;
  clientID: string;
  userId: string;
  audience: string;
  scope: string[];
  created_at: string;
}

export async function listUserGrants(userId: string): Promise<Auth0Grant[]> {
  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN!;

  try {
    const response = await axios.get<Auth0Grant[]>(
      `https://${domain}/api/v2/grants`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: userId, per_page: 50 },
      }
    );
    return response.data;
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.message || err.message
      : String(err);
    throw new ManagementApiError(`Failed to list grants for user ${userId}: ${msg}`);
  }
}

/**
 * Delete a specific grant by ID.
 * DELETE /api/v2/grants/{id}
 *
 * This is the revocation mechanism for Token Vault connections.
 * After deletion, the Token Vault will no longer be able to issue
 * new access tokens for that connection/user combination.
 */
export async function deleteGrant(grantId: string): Promise<void> {
  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN!;

  try {
    await axios.delete(`https://${domain}/api/v2/grants/${grantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      // Grant already deleted — treat as success
      return;
    }
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.message || err.message
      : String(err);
    throw new ManagementApiError(`Failed to delete grant ${grantId}: ${msg}`);
  }
}

/**
 * Get user profile from Management API.
 */
export async function getUserProfile(userId: string): Promise<Record<string, unknown>> {
  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN!;

  try {
    const response = await axios.get<Record<string, unknown>>(
      `https://${domain}/api/v2/users/${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.message || err.message
      : String(err);
    throw new ManagementApiError(`Failed to get user profile: ${msg}`);
  }
}
