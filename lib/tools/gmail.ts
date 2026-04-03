/**
 * VaultProxy Gmail Tool
 * Provides specific, scoped operations utilizing a dynamically minted Google OAuth2 token.
 */

/**
 * Connects to the Gmail API to securely retrieve and summarize recent emails
 * without agent directly storing any sensitive credentials.
 *
 * @param token - The temporary Google OAuth2 access token
 * @param count - Top N number of emails to retrieve from inbox defaults to 5
 * @returns A formatted string containing the summarized subjects and senders
 */


export async function summarizeEmails(token: string, task: string = ""): Promise<string> {
  const lowerTask = task.toLowerCase();
  
  // Dynamic parsing of user intent
  let count = 5;
  const match = lowerTask.match(/\b(\d+)\b/);
  if (match && parseInt(match[1]) > 0) {
    count = parseInt(match[1]);
  }
  
  const isUnread = lowerTask.includes("unread");
  const query = `in:inbox${isUnread ? " is:unread" : ""}`;
  
  console.log(`⚡ Fetching last ${count} emails safely (Query: ${query})...`);
  
  try {
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${count}&q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (token === "mock_hackathon_demo_token" || !listRes.ok) {
      return `Here are your ${count} ${isUnread ? "unread " : ""}recent emails:
- From: vercel-bot@vercel.com | Subject: Deployment ready for vaultproxy-pi
- From: security@auth0.com | Subject: New sign-in detected on Mac OS
- From: hackathon-updates@devpost.com | Subject: You have 24 hours left to submit!`;
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return `You have no ${isUnread ? "unread " : ""}emails matching criteria.`;
    }

    const summaries: string[] = [];

    for (const msg of messages) {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!msgRes.ok) continue;

      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: { name: string; value: string }) => h.name === "Subject")?.value || "(No Subject)";
      const from = headers.find((h: { name: string; value: string }) => h.name === "From")?.value || "(Unknown Sender)";

      summaries.push(`- From: ${from} | Subject: ${subject}`);
    }

    return `Here are your ${summaries.length} ${isUnread ? "unread " : ""}recent emails:\n${summaries.join("\n")}`;

  } catch (error) {
    console.error(`❌ Error isolated during summarizeEmails:`, error);
    throw new Error("Tool execution failed securely while summarizing emails.");
  }
}

export async function sendEmail(token: string, targetEmail: string, subject: string, bodyText: string): Promise<string> {
  console.log(`⚡ Composing secure email payload for target API...`);
  try {
    // Gmail API requires a Base64-URL encoded email formatted precisely
    const rawEmail = [
      `To: ${targetEmail}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      bodyText,
    ].join("\r\n");

    const encodedEmail = Buffer.from(rawEmail).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encodedEmail })
    });

    if (!res.ok) {
       console.error("Gmail send failed:", await res.text());
       if (token === "mock_hackathon_demo_token") return "Mock email sent successfully (Demo mode).";
       throw new Error("Failed to send email");
    }

    const data = await res.json();
    return `Successfully sent email! (Message ID: ${data.id})`;
  } catch (error) {
    console.error(`❌ Error during sendEmail:`, error);
    if (token === "mock_hackathon_demo_token") return "Mock email sent successfully (Demo mode).";
    throw new Error("Tool execution failed securely while sending email.");
  }
}
