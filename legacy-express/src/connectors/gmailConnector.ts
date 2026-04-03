/**
 * gmailConnector.ts — Gmail API Connector
 *
 * Security decisions:
 * - access token is NEVER stored — it's passed in per call, fetched fresh from Token Vault
 * - All API calls use HTTPS via axios
 * - Results are sanitized before returning (no raw internal Gmail IDs exposed unless needed)
 * - Rate limit errors are surfaced clearly
 */

import axios from 'axios';
import { TokenVaultError } from '../core/errors';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  labelIds: string[];
}

export interface SendEmailResult {
  messageId: string;
  threadId: string;
  labelIds: string[];
  status: 'sent';
}

/**
 * List and read emails from the user's inbox.
 *
 * @param accessToken - Fresh Gmail access token from Token Vault
 * @param maxResults - Number of messages to retrieve (default: 5)
 */
export async function readEmails(
  accessToken: string,
  maxResults = 5
): Promise<EmailSummary[]> {
  try {
    // Step 1: List message IDs
    const listResponse = await axios.get<{
      messages?: Array<{ id: string; threadId: string }>;
    }>(`${GMAIL_API_BASE}/messages`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        maxResults,
        labelIds: 'INBOX',
        fields: 'messages(id,threadId)',
      },
    });

    const messages = listResponse.data.messages || [];

    // Step 2: Fetch each message's metadata
    const summaries = await Promise.all(
      messages.map((msg) => fetchEmailMetadata(accessToken, msg.id))
    );

    return summaries.filter((s): s is EmailSummary => s !== null);

  } catch (err: unknown) {
    handleGmailError(err, 'read_emails');
  }
}

/** Alias for read_email — same implementation */
export async function listEmailSummaries(
  accessToken: string,
  maxResults = 5
): Promise<EmailSummary[]> {
  return readEmails(accessToken, maxResults);
}

/**
 * Fetch metadata for a single email message.
 */
async function fetchEmailMetadata(
  accessToken: string,
  messageId: string
): Promise<EmailSummary | null> {
  try {
    const response = await axios.get<{
      id: string;
      threadId: string;
      snippet: string;
      labelIds: string[];
      payload: {
        headers: Array<{ name: string; value: string }>;
      };
    }>(`${GMAIL_API_BASE}/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      },
    });

    const msg = response.data;
    const headers = msg.payload?.headers || [];

    const getHeader = (name: string): string =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: msg.id,
      threadId: msg.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject') || '(no subject)',
      snippet: msg.snippet || '',
      date: getHeader('Date'),
      labelIds: msg.labelIds || [],
    };
  } catch {
    return null; // Gracefully skip individual message failures
  }
}

/**
 * Send an email via Gmail API.
 *
 * This action requires explicit human approval (enforced by permission engine).
 * This function should ONLY be called after the approval flow completes.
 *
 * @param accessToken - Fresh Gmail send-scoped token from Token Vault
 */
export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<SendEmailResult> {
  // Construct RFC 2822 email
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ];

  const rawEmail = emailLines.join('\n');
  // Gmail API requires base64url encoded RFC 2822 message
  const encodedEmail = Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await axios.post<{
      id: string;
      threadId: string;
      labelIds: string[];
    }>(
      `${GMAIL_API_BASE}/messages/send`,
      { raw: encodedEmail },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      messageId: response.data.id,
      threadId: response.data.threadId,
      labelIds: response.data.labelIds,
      status: 'sent',
    };
  } catch (err: unknown) {
    handleGmailError(err, 'send_email');
  }
}

/**
 * Unified error handler for Gmail API errors.
 * Maps Gmail-specific errors to our error hierarchy.
 */
function handleGmailError(err: unknown, operation: string): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status || 502;
    const gmailError = err.response?.data?.error;

    if (status === 401) {
      throw new TokenVaultError(
        `Gmail token is invalid or expired during '${operation}'. ` +
        'The token may have been revoked. Please re-authorize.',
        401
      );
    }

    if (status === 403) {
      const reason = gmailError?.errors?.[0]?.reason || 'insufficientPermissions';
      throw new TokenVaultError(
        `Gmail access denied for '${operation}': ${reason}. ` +
        'Check that the required OAuth scopes were granted.',
        403
      );
    }

    if (status === 429) {
      throw new Error(`Gmail API rate limit exceeded for '${operation}'. Retry after delay.`);
    }

    const message = gmailError?.message || err.message;
    throw new Error(`Gmail API error during '${operation}' (${status}): ${message}`);
  }

  throw err;
}
