import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaultProxy — Secure AI Agent Control Center",
  description:
    "Token isolation and permission enforcement for AI agents. Built with Auth0 Token Vault. Zero credential exposure.",
  metadataBase: new URL(
    process.env.AUTH0_BASE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "VaultProxy — Secure AI Agent Control Center",
    description:
      "Token isolation and permission enforcement for AI agents. Built with Auth0 Token Vault.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VaultProxy — Secure AI Agent Control Center",
    description:
      "Token isolation and permission enforcement for AI agents.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔐</text></svg>",
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔐</text></svg>",
  },
};

// themeColor and colorScheme moved here per Next.js 16 requirement
export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
