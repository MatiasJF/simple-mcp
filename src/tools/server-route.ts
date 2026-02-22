export function generateServerRoute(routeType: string): string {
  if (routeType === 'identity-registry') {
    return `\`\`\`typescript
// app/api/identity-registry/route.ts
import { createIdentityRegistryHandler } from '@bsv/simple/server'
const handler = createIdentityRegistryHandler()
export const GET = handler.GET, POST = handler.POST
\`\`\`

**API endpoints:**
- \`GET ?action=lookup&query=...\` → \`{ success, results: [{ tag, identityKey }] }\`
- \`GET ?action=list&identityKey=...\` → \`{ success, tags: [{ tag, createdAt }] }\`
- \`POST ?action=register\` body: \`{ tag, identityKey }\` → \`{ success, message, tag }\`
- \`POST ?action=revoke\` body: \`{ tag, identityKey }\` → \`{ success, message, tag }\`

**Custom config options:**
\`\`\`typescript
createIdentityRegistryHandler({
  validateTag: (tag) => tag.startsWith('@') ? null : 'Must start with @',
  maxTagsPerIdentity: 3
})
\`\`\``
  }

  if (routeType === 'did-resolver') {
    return `\`\`\`typescript
// app/api/resolve-did/route.ts
import { createDIDResolverHandler } from '@bsv/simple/server'
const handler = createDIDResolverHandler()
export const GET = handler.GET
\`\`\`

**API:** \`GET ?did=did:bsv:<txid>\` → \`DIDResolutionResult\`

**Custom config options:**
\`\`\`typescript
createDIDResolverHandler({
  resolverUrl: 'https://custom-resolver.com',  // nChain Universal Resolver by default
  wocBaseUrl: 'https://api.whatsonchain.com',   // WoC fallback
  resolverTimeout: 10000,                        // ms
  maxHops: 100                                   // chain-following limit
})
\`\`\``
  }

  if (routeType === 'server-wallet') {
    return `\`\`\`typescript
// app/api/server-wallet/route.ts
import { createServerWalletHandler } from '@bsv/simple/server'
const handler = createServerWalletHandler()
export const GET = handler.GET, POST = handler.POST
\`\`\`

**API endpoints:**
- \`GET ?action=create\` → \`{ success, serverIdentityKey, status }\`
- \`GET ?action=status\` → \`{ success, saved, identityKey }\`
- \`GET ?action=request&satoshis=1000\` → \`{ success, paymentRequest }\`
- \`GET ?action=balance\` → \`{ success, totalOutputs, totalSatoshis }\`
- \`GET ?action=outputs\` → \`{ success, outputs }\`
- \`GET ?action=reset\` → \`{ success, message }\`
- \`POST ?action=receive\` body: \`{ tx, senderIdentityKey, derivationPrefix, derivationSuffix, outputIndex }\`

**Custom config options:**
\`\`\`typescript
createServerWalletHandler({
  envVar: 'SERVER_PRIVATE_KEY',          // env var name
  keyFile: '.server-wallet.json',        // file persistence
  network: 'main',
  defaultRequestSatoshis: 1000,
  requestMemo: 'Payment to server'
})
\`\`\`

Key persistence order: env var → file → auto-generate via \`generatePrivateKey()\`. No \`@bsv/sdk\` import needed.`
  }

  if (routeType === 'credential-issuer') {
    return `\`\`\`typescript
// app/api/credential-issuer/route.ts  (no [[...path]] catch-all needed!)
import { createCredentialIssuerHandler } from '@bsv/simple/server'
const handler = createCredentialIssuerHandler({
  schemas: [{
    id: 'my-credential',
    name: 'MyCredential',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
    ]
  }]
})
export const GET = handler.GET, POST = handler.POST
\`\`\`

**API endpoints:**
- \`GET ?action=info\` → \`{ certifierPublicKey, certificateType, schemas }\`
- \`GET ?action=schema&id=...\` → schema details
- \`GET ?action=status&serialNumber=...\` → revocation status
- \`POST ?action=certify\` body: \`{ identityKey, schemaId, fields }\` → CertificateData
- \`POST ?action=issue\` body: \`{ subjectKey, schemaId, fields }\` → \`{ credential }\`
- \`POST ?action=verify\` body: \`{ credential }\` → \`{ verification }\`
- \`POST ?action=revoke\` body: \`{ serialNumber }\` → \`{ txid }\`

**Custom config options:**
\`\`\`typescript
createCredentialIssuerHandler({
  schemas: [schemaConfig],
  envVar: 'CREDENTIAL_ISSUER_KEY',         // env var for private key
  keyFile: '.credential-issuer-key.json',  // file persistence
  revocationStorePath: '.revocation-secrets.json'
})
\`\`\``
  }

  // Default: show all routes
  return `## All Server API Routes (Handler Factories)

No boilerplate needed. No \`@bsv/sdk\` import. Each is 3 lines:

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
  schemas: [{ id: 'my-cred', name: 'MyCred', fields: [{ key: 'name', label: 'Name', type: 'text', required: true }] }]
})
export const GET = handler.GET, POST = handler.POST
\`\`\``
}
