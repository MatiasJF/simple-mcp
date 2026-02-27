export function generateDIDIntegration(features: string[]): string {
  const sections: string[] = []

  sections.push(`\`\`\`typescript
import { createWallet, DID } from '@bsv/simple/browser'
\`\`\``)

  if (features.includes('create')) {
    sections.push(`### Create a DID (UTXO Chain-Linked)
\`\`\`typescript
async function createDID(wallet: BrowserWallet) {
  const result = await wallet.createDID()
  console.log('DID:', result.did)              // 'did:bsv:<txid>'
  console.log('Document:', result.document)     // W3C DID Document
  console.log('Identity Code:', result.identityCode)
  return result
}

// With services
async function createDIDWithServices(wallet: BrowserWallet) {
  const result = await wallet.createDID({
    services: [
      {
        id: 'did:bsv:<txid>#messaging',
        type: 'MessagingService',
        serviceEndpoint: 'https://example.com/messages'
      }
    ]
  })
  return result
}
\`\`\``)
  }

  if (features.includes('resolve')) {
    sections.push(`### Resolve a DID (Cross-Wallet)

**Important:** Cross-wallet resolution requires a server-side proxy in browser
environments. Set \`didProxyUrl\` when creating the wallet:

\`\`\`typescript
// Initialize wallet with proxy URL for cross-wallet resolution
const wallet = await createWallet({
  didProxyUrl: '/api/resolve-did'
})

async function resolveDID(wallet: BrowserWallet, didString: string) {
  if (!DID.isValid(didString)) {
    throw new Error('Invalid DID format')
  }

  const result = await wallet.resolveDID(didString)

  if (result.didDocumentMetadata?.deactivated) {
    console.log('DID is deactivated')
    return null
  }

  if (result.didResolutionMetadata?.error) {
    console.error('Resolution error:', result.didResolutionMetadata.message)
    return null
  }

  console.log('Resolved DID:', result.didDocument?.id)
  console.log('Verification Key:', result.didDocument?.verificationMethod[0]?.publicKeyJwk)
  console.log('Created:', result.didDocumentMetadata?.created)
  console.log('Updated:', result.didDocumentMetadata?.updated)
  return result.didDocument
}
\`\`\`

#### Resolution Proxy (Next.js API Route)

Use the handler factory — **do NOT write manual proxy code**:

\`\`\`typescript
// app/api/resolve-did/route.ts
import { createDIDResolverHandler } from '@bsv/simple/server'
const handler = createDIDResolverHandler()
export const GET = handler.GET
\`\`\`

The handler automatically:
- Tries the nChain Universal Resolver first (10s timeout)
- Falls back to WoC UTXO chain-following on failure
- Handles deactivated DIDs
- Limits chain hops to 100

**Custom config (optional):**
\`\`\`typescript
createDIDResolverHandler({
  resolverUrl: 'https://custom-resolver.com',
  wocBaseUrl: 'https://api.whatsonchain.com',
  resolverTimeout: 10000,
  maxHops: 100
})
\`\`\``)
  }

  if (features.includes('update')) {
    sections.push(`### Update a DID
\`\`\`typescript
async function updateDID(wallet: BrowserWallet, did: string) {
  const result = await wallet.updateDID({
    did,
    services: [
      {
        id: did + '#api',
        type: 'APIService',
        serviceEndpoint: 'https://api.example.com'
      }
    ],
    additionalKeys: ['03abc...']  // Optional extra verification keys
  })
  console.log('Updated DID:', result.did)
  console.log('New Document:', result.document)
  return result
}
\`\`\``)
  }

  if (features.includes('deactivate')) {
    sections.push(`### Deactivate (Revoke) a DID
\`\`\`typescript
async function deactivateDID(wallet: BrowserWallet, did: string) {
  const { txid } = await wallet.deactivateDID(did)
  console.log('Deactivated in TX:', txid)
  // Resolving this DID will now return { didDocumentMetadata: { deactivated: true } }
}
\`\`\``)
  }

  if (features.includes('list')) {
    sections.push(`### List Wallet DIDs
\`\`\`typescript
async function listDIDs(wallet: BrowserWallet) {
  const dids = await wallet.listDIDs()
  for (const entry of dids) {
    console.log(entry.did, entry.status)  // 'active' or 'deactivated'
  }
  return dids
}
\`\`\``)
  }

  // Legacy support
  if (features.includes('get')) {
    sections.push(`### Get Legacy DID (deprecated)
\`\`\`typescript
// Legacy identity-key-based DID — use createDID() for new projects
function getWalletDID(wallet: BrowserWallet) {
  const didDoc = wallet.getDID()
  console.log('DID:', didDoc.id)  // 'did:bsv:02abc...' (66-char pubkey)
  return didDoc
}
\`\`\``)
  }

  if (features.includes('register')) {
    sections.push(`### Register Legacy DID (deprecated)
\`\`\`typescript
// Legacy: persist identity-key DID as certificate — use createDID() for new projects
async function registerDID(wallet: BrowserWallet) {
  const didDoc = await wallet.registerDID({ persist: true })
  console.log('DID registered:', didDoc.id)
  return didDoc
}
\`\`\``)
  }

  return sections.join('\n\n')
}
