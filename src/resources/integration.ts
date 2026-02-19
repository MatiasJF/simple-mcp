// Next.js integration guide resource

export const nextjsIntegrationGuide = `# @bsv/simple — Next.js Integration Guide

## 1. Installation

\`\`\`bash
npm install @bsv/simple @bsv/sdk
\`\`\`

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

### Server API routes
Always use dynamic import to avoid bundling server-only code:
\`\`\`typescript
const { ServerWallet } = await import('@bsv/simple/server')
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

## 5. Server Wallet API Route

\`\`\`typescript
// app/api/server-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const WALLET_FILE = join(process.cwd(), '.server-wallet.json')
let serverWallet: any = null
let initPromise: Promise<any> | null = null

function loadSavedKey(): string | null {
  try {
    if (existsSync(WALLET_FILE)) {
      return JSON.parse(readFileSync(WALLET_FILE, 'utf-8')).privateKey || null
    }
  } catch {}
  return null
}

async function getServerWallet() {
  if (serverWallet) return serverWallet
  if (initPromise) return initPromise

  initPromise = (async () => {
    const { ServerWallet } = await import('@bsv/simple/server')
    const { PrivateKey } = await import('@bsv/sdk')

    const savedKey = loadSavedKey()
    const privateKey = process.env.SERVER_PRIVATE_KEY || savedKey || PrivateKey.fromRandom().toHex()

    serverWallet = await ServerWallet.create({
      privateKey,
      network: 'main',
      storageUrl: 'https://storage.babbage.systems'
    })

    if (!process.env.SERVER_PRIVATE_KEY) {
      writeFileSync(WALLET_FILE, JSON.stringify({
        privateKey,
        identityKey: serverWallet.getIdentityKey()
      }, null, 2))
    }

    return serverWallet
  })()

  return initPromise
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'create'

  try {
    if (action === 'create') {
      const wallet = await getServerWallet()
      return NextResponse.json({
        success: true,
        serverIdentityKey: wallet.getIdentityKey(),
        status: wallet.getStatus()
      })
    }

    if (action === 'request') {
      const wallet = await getServerWallet()
      const request = wallet.createPaymentRequest({ satoshis: 1000 })
      return NextResponse.json({ success: true, paymentRequest: request })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'receive'

  if (action === 'receive') {
    const wallet = await getServerWallet()
    const { tx, senderIdentityKey, derivationPrefix, derivationSuffix, outputIndex } = await req.json()

    await wallet.receivePayment({
      tx, senderIdentityKey, derivationPrefix, derivationSuffix,
      outputIndex: outputIndex ?? 0
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
\`\`\`

## 6. Server Wallet Key Persistence

Priority order for private key:
1. \`process.env.SERVER_PRIVATE_KEY\` — Environment variable (production)
2. \`.server-wallet.json\` file — Persisted from previous run (development)
3. \`PrivateKey.fromRandom().toHex()\` — Fresh key (first run)

**Important:** Add \`.server-wallet.json\` to \`.gitignore\`.

## 7. Basket Naming Conventions

Use descriptive, hyphenated names:
- \`my-app-payments\` — Payment outputs
- \`my-app-tokens\` — PushDrop tokens
- \`my-app-change\` — Reinternalized change
- \`text\` — Text inscriptions
- \`json\` — JSON inscriptions
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
