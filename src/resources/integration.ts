// Next.js integration guide resource

export const nextjsIntegrationGuide = `# @bsv/simple — Next.js Integration Guide

## 1. Installation

\`\`\`bash
npm install @bsv/simple
\`\`\`

Note: \`@bsv/sdk\` is NOT needed as a direct dependency — \`@bsv/simple\` wraps it entirely.

## 2. next.config.ts (CRITICAL)

This is required for Turbopack to work. Without it, \`@bsv/wallet-toolbox\` and its database drivers will be bundled for the browser, causing build failures.

\`\`\`typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@bsv/wallet-toolbox",
    "knex",
    "better-sqlite3",
    "tedious",
    "mysql",
    "mysql2",
    "pg",
    "pg-query-stream",
    "oracledb",
    "dotenv"
  ]
};

export default nextConfig;
\`\`\`

## 3. Import Patterns

### Browser components (\`'use client'\`)
\`\`\`typescript
import { createWallet, Certifier, DID, Overlay } from '@bsv/simple/browser'
import { CredentialSchema, CredentialIssuer, MemoryRevocationStore } from '@bsv/simple/browser'
import type { BrowserWallet } from '@bsv/simple/browser'
\`\`\`

### Server API routes (handler factories — preferred)
\`\`\`typescript
import { createIdentityRegistryHandler } from '@bsv/simple/server'
import { createDIDResolverHandler } from '@bsv/simple/server'
import { createServerWalletHandler } from '@bsv/simple/server'
import { createCredentialIssuerHandler } from '@bsv/simple/server'
\`\`\`

### Server utilities (lower-level access)
\`\`\`typescript
const { ServerWallet, generatePrivateKey } = await import('@bsv/simple/server')
const { FileRevocationStore } = await import('@bsv/simple/server')
\`\`\`

## 4. Browser Wallet Setup

\`\`\`typescript
'use client'
import { useState } from 'react'
import { createWallet, type BrowserWallet } from '@bsv/simple/browser'

export default function Page() {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null)
  const [status, setStatus] = useState('')

  const connect = async () => {
    try {
      const w = await createWallet()
      setWallet(w)
      setStatus(\`Connected: \${w.getIdentityKey()}\`)
    } catch (e) {
      setStatus(\`Error: \${(e as Error).message}\`)
    }
  }

  return (
    <div>
      <button onClick={connect}>Connect Wallet</button>
      <p>{status}</p>
    </div>
  )
}
\`\`\`

## 5. Server API Routes (Simplified)

All server routes use handler factories — no boilerplate needed:

\`\`\`typescript
// app/api/identity-registry/route.ts
import { createIdentityRegistryHandler } from '@bsv/simple/server'
const handler = createIdentityRegistryHandler()
export const GET = handler.GET, POST = handler.POST
\`\`\`

\`\`\`typescript
// app/api/resolve-did/route.ts
import { createDIDResolverHandler } from '@bsv/simple/server'
const handler = createDIDResolverHandler()
export const GET = handler.GET
\`\`\`

\`\`\`typescript
// app/api/server-wallet/route.ts
import { createServerWalletHandler } from '@bsv/simple/server'
const handler = createServerWalletHandler()
export const GET = handler.GET, POST = handler.POST
\`\`\`

\`\`\`typescript
// app/api/credential-issuer/route.ts  (no [[...path]] needed!)
import { createCredentialIssuerHandler } from '@bsv/simple/server'
const handler = createCredentialIssuerHandler({
  schemas: [{
    id: 'my-credential',
    name: 'MyCredential',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
    ]
  }]
})
export const GET = handler.GET, POST = handler.POST
\`\`\`

## 6. Server Wallet Key Persistence

Key persistence is handled automatically by \`createServerWalletHandler()\`:
1. \`process.env.SERVER_PRIVATE_KEY\` — Environment variable (production)
2. \`.server-wallet.json\` file — Persisted from previous run (development)
3. Auto-generated via \`generatePrivateKey()\` — Fresh key (first run)

No \`@bsv/sdk\` import needed. Add \`.server-wallet.json\` to \`.gitignore\`.

## 7. Basket Naming Conventions

Use descriptive, hyphenated names:
- \`my-app-payments\` — Payment outputs
- \`my-app-tokens\` — PushDrop tokens
- \`text\` — Text inscriptions
- \`json\` — JSON inscriptions
- \`did-chain\` — DID chain UTXOs
- \`revocation-utxos\` — Credential revocation

## 8. Common Patterns

### Auto-connect on page load
\`\`\`typescript
useEffect(() => {
  createWallet()
    .then(setWallet)
    .catch(() => {}) // User may not have wallet extension
}, [])
\`\`\`

### Check MessageBox handle on connect
\`\`\`typescript
useEffect(() => {
  if (!wallet) return
  wallet.getMessageBoxHandle('/api/identity-registry')
    .then(h => setHandle(h))
}, [wallet])
\`\`\`

### Error handling pattern
\`\`\`typescript
try {
  const result = await wallet.pay({ to: key, satoshis: 1000 })
  setResult(JSON.stringify(result, null, 2))
} catch (e) {
  setError((e as Error).message)
}
\`\`\`
`
