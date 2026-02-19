// Common code patterns

export const codePatterns = `# @bsv/simple — Common Code Patterns

## Pattern 1: Connect Wallet + Auto-check MessageBox
\`\`\`typescript
'use client'
import { useState, useEffect } from 'react'
import { createWallet, type BrowserWallet } from '@bsv/simple/browser'

export default function Page() {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null)
  const [handle, setHandle] = useState<string | null>(null)

  const connect = async () => {
    const w = await createWallet()
    setWallet(w)
    const h = await w.getMessageBoxHandle('/api/identity-registry')
    setHandle(h)
  }

  return (
    <div>
      {!wallet ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {wallet.getIdentityKey().substring(0, 20)}...</p>
          {handle && <p>Handle: {handle}</p>}
        </div>
      )}
    </div>
  )
}
\`\`\`

## Pattern 2: Simple Payment with Change Recovery
\`\`\`typescript
const result = await wallet.pay({
  to: recipientKey,
  satoshis: 1000,
  memo: 'Coffee payment',
  basket: 'my-payments',
  changeBasket: 'my-change'
})

console.log('TXID:', result.txid)
console.log('Change recovered:', result.reinternalized?.count)
\`\`\`

## Pattern 3: Multi-Output Send
\`\`\`typescript
const result = await wallet.send({
  outputs: [
    { to: recipientKey, satoshis: 1000, basket: 'payments' },
    { data: ['Hello blockchain!'], basket: 'text' },
    { to: wallet.getIdentityKey(), data: [{ value: 42 }], satoshis: 1, basket: 'tokens' }
  ],
  description: 'Multi-output transaction',
  changeBasket: 'change'
})
\`\`\`

## Pattern 4: Token CRUD
\`\`\`typescript
// Create
const token = await wallet.createToken({
  data: { type: 'loyalty', points: 100 },
  basket: 'my-tokens',
  satoshis: 1
})

// List (decrypts automatically)
const tokens = await wallet.listTokenDetails('my-tokens')

// Send
await wallet.sendToken({ basket: 'my-tokens', outpoint: tokens[0].outpoint, to: recipientKey })

// Redeem
await wallet.redeemToken({ basket: 'my-tokens', outpoint: tokens[0].outpoint })
\`\`\`

## Pattern 5: Token Transfer via MessageBox
\`\`\`typescript
// Sender
await wallet.sendTokenViaMessageBox({ basket: 'my-tokens', outpoint: '...', to: recipientKey })

// Recipient
const incoming = await wallet.listIncomingTokens()
for (const token of incoming) {
  await wallet.acceptIncomingToken(token, 'received-tokens')
}
\`\`\`

## Pattern 6: Inscriptions
\`\`\`typescript
const text = await wallet.inscribeText('Hello blockchain!')
const json = await wallet.inscribeJSON({ title: 'Document', created: Date.now() })
const hash = await wallet.inscribeFileHash('a'.repeat(64))
\`\`\`

## Pattern 7: MessageBox Payments
\`\`\`typescript
// Register identity
await wallet.certifyForMessageBox('@alice', '/api/identity-registry')

// Find recipient
const results = await wallet.lookupIdentityByTag('bob', '/api/identity-registry')

// Send payment
await wallet.sendMessageBoxPayment(results[0].identityKey, 1000, 'change')

// Receive payments
const incoming = await wallet.listIncomingPayments()
for (const payment of incoming) {
  await wallet.acceptIncomingPayment(payment, 'received-payments')
}
\`\`\`

## Pattern 8: Server Wallet Funding Flow
\`\`\`typescript
// Client side:
// 1. Get payment request from server
const res = await fetch('/api/server-wallet?action=request')
const { paymentRequest } = await res.json()

// 2. Fund server wallet
const result = await wallet.fundServerWallet(paymentRequest, 'server-funding', 'change')

// 3. Send tx to server
await fetch('/api/server-wallet?action=receive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tx: Array.from(result.tx),
    senderIdentityKey: wallet.getIdentityKey(),
    derivationPrefix: paymentRequest.derivationPrefix,
    derivationSuffix: paymentRequest.derivationSuffix,
    outputIndex: 0
  })
})
\`\`\`

## Pattern 9: DID Operations
\`\`\`typescript
import { DID } from '@bsv/simple/browser'

// Get wallet's DID
const didDoc = wallet.getDID()
console.log(didDoc.id)  // 'did:bsv:02abc...'

// Register (persist as certificate)
await wallet.registerDID()

// Resolve any DID
const doc = wallet.resolveDID('did:bsv:02abc...')

// Static utilities
DID.isValid('did:bsv:02abc...')  // true
\`\`\`

## Pattern 10: Issue Verifiable Credentials
\`\`\`typescript
import { CredentialIssuer, CredentialSchema, MemoryRevocationStore } from '@bsv/simple/browser'

const schema = new CredentialSchema({
  id: 'age-verification',
  name: 'AgeVerification',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'over18', label: 'Over 18', type: 'checkbox', required: true }
  ]
})

const issuer = await CredentialIssuer.create({
  privateKey: 'hex_key',
  schemas: [schema.getConfig()],
  revocation: { enabled: false }
})

// Issue
const vc = await issuer.issue(subjectKey, 'age-verification', { name: 'Alice', over18: 'true' })

// List from wallet
const vcs = await wallet.listCredentials({
  certifiers: [issuer.getInfo().publicKey],
  types: [schema.getInfo().certificateTypeBase64]
})

// Create verifiable presentation
const vp = wallet.createPresentation(vcs)
\`\`\`

## Pattern 11: Overlay Operations
\`\`\`typescript
import { Overlay } from '@bsv/simple/browser'

const overlay = await Overlay.create({ topics: ['tm_payments'], network: 'mainnet' })

// Advertise
await wallet.advertiseSHIP('https://myserver.com', 'tm_payments')
await wallet.advertiseSLAP('https://myserver.com', 'ls_payments')

// Broadcast action to overlay
const { txid, broadcast } = await wallet.broadcastAction(overlay, {
  outputs: [{ lockingScript: '...', satoshis: 1, outputDescription: 'Overlay output' }]
}, ['tm_payments'])

// Query
const results = await overlay.lookupOutputs('ls_payments', { tag: 'recent' })
\`\`\`
`
