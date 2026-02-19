// Critical pitfalls and gotchas

export const gotchasReference = `# @bsv/simple — Critical Gotchas

## 1. basket insertion vs wallet payment are MUTUALLY EXCLUSIVE

In \`internalizeAction\`, each output can use EITHER \`basket insertion\` OR \`wallet payment\`, never both.

- **wallet payment** — provides derivation info for spending. Output is NOT in any app basket.
- **basket insertion** — puts output in a named basket (visible via \`listOutputs\`). Derivation info must go in \`customInstructions\`.

\`\`\`typescript
// CORRECT: basket insertion
await client.internalizeAction({
  tx: txBytes,
  outputs: [{
    outputIndex: 0,
    protocol: 'basket insertion',
    insertionRemittance: {
      basket: 'my-basket',
      customInstructions: JSON.stringify({ derivationPrefix, derivationSuffix }),
      tags: ['payment']
    }
  }]
})

// CORRECT: wallet payment
await client.internalizeAction({
  tx: txBytes,
  outputs: [{
    outputIndex: 0,
    protocol: 'wallet payment',
    paymentRemittance: {
      senderIdentityKey,
      derivationPrefix,
      derivationSuffix
    }
  }]
})

// WRONG: both on same output — will fail
\`\`\`

## 2. PeerPayClient.acceptPayment() swallows errors

Returns the string \`'Unable to receive payment!'\` instead of throwing an error.

\`\`\`typescript
// WRONG: silently fails
await peerPay.acceptPayment(payment)

// CORRECT: always check
const result = await peerPay.acceptPayment(payment)
if (typeof result === 'string') throw new Error(result)
\`\`\`

The simple library handles this internally, but be aware when using \`@bsv/message-box-client\` directly.

## 3. Change outputs from createAction are NOT in any app basket

When \`createAction\` produces change outputs, they exist in the wallet but aren't in any named basket. To track them:

\`\`\`typescript
// Option A: Use changeBasket in pay/send
const result = await wallet.pay({ to: key, satoshis: 1000, changeBasket: 'my-change' })

// Option B: Manual reinternalization
if (result.tx) {
  await wallet.reinternalizeChange(result.tx, 'my-change', [0]) // skip output index 0
}
\`\`\`

## 4. result.tx from createAction may be undefined

Always check before using:
\`\`\`typescript
const result = await client.createAction({ ... })
if (!result.tx) {
  console.warn('No tx bytes available')
  return
}
// Now safe to use result.tx
\`\`\`

## 5. BRC-29 Payment Derivation Protocol ID

Always use: \`[2, '3241645161d8']\`
\`\`\`typescript
const protocolID: [SecurityLevel, string] = [2, '3241645161d8']
\`\`\`

## 6. FileRevocationStore is server-only

It uses Node.js \`fs\` module and will crash in the browser. It's isolated in \`file-revocation-store.ts\` to prevent Turbopack from bundling it.

\`\`\`typescript
// Browser: use MemoryRevocationStore
import { MemoryRevocationStore } from '@bsv/simple/browser'

// Server: use FileRevocationStore
const { FileRevocationStore } = await import('@bsv/simple/server')
\`\`\`

## 7. Overlay topics must start with tm_, services with ls_

The Overlay class enforces these prefixes and throws if violated:
\`\`\`typescript
// CORRECT
await Overlay.create({ topics: ['tm_payments'] })
await wallet.advertiseSLAP('domain.com', 'ls_payments')

// WRONG — throws Error
await Overlay.create({ topics: ['payments'] })
await wallet.advertiseSLAP('domain.com', 'payments')
\`\`\`

## 8. reinternalizeChange skips the largest change output

The wallet automatically tracks one change output internally. \`reinternalizeChange()\` only recovers the *additional* orphaned change outputs. If there's only one change output, it returns \`{ count: 0 }\`.

## 9. Token send/redeem uses two-step signing

Token transfers require: \`createAction\` → get \`signableTransaction\` → sign with PushDrop unlock → \`signAction\`. Don't try to do it in a single step.

## 10. Dynamic imports for server code in Next.js

Always use \`await import()\` for server-only code in API routes:
\`\`\`typescript
// WRONG: static import at top of API route
import { ServerWallet } from '@bsv/simple/server'

// CORRECT: dynamic import inside handler
const { ServerWallet } = await import('@bsv/simple/server')
\`\`\`

## 11. next.config.ts serverExternalPackages is required

Without this, Turbopack bundles \`@bsv/wallet-toolbox\`, \`knex\`, and database drivers for the browser:
\`\`\`typescript
const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@bsv/wallet-toolbox", "knex", "better-sqlite3", "tedious",
    "mysql", "mysql2", "pg", "pg-query-stream", "oracledb", "dotenv"
  ]
}
\`\`\`

## 12. Server wallet initialization should be cached

Use a module-level variable + promise to avoid re-initializing on every request:
\`\`\`typescript
let serverWallet: any = null
let initPromise: Promise<any> | null = null

async function getServerWallet() {
  if (serverWallet) return serverWallet
  if (initPromise) return initPromise
  initPromise = (async () => { /* initialize */ })()
  return initPromise
}
\`\`\`
`
