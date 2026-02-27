export function generateCredentialIssuer(schemaFields: Array<{ key: string; label: string; type: string; required?: boolean }>, revocation: boolean): string {
  const fieldsDef = schemaFields.map(f =>
    `    { key: '${f.key}', label: '${f.label}', type: '${f.type}'${f.required ? ', required: true' : ''} }`
  ).join(',\n')

  const schemaId = 'custom-credential'

  return `\`\`\`typescript
import {
  CredentialSchema,
  CredentialIssuer,
  ${revocation ? 'MemoryRevocationStore,' : ''}
  toVerifiableCredential,
  toVerifiablePresentation
} from '@bsv/simple/browser'

// 1. Define Schema
const schema = new CredentialSchema({
  id: '${schemaId}',
  name: 'CustomCredential',
  fields: [
${fieldsDef}
  ],
  computedFields: (values) => ({
    ...values,
    issuedAt: new Date().toISOString()
  })
})

// 2. Create Issuer
const issuer = await CredentialIssuer.create({
  privateKey: issuerPrivateKeyHex,
  schemas: [schema.getConfig()],
  revocation: {
    enabled: ${revocation},
    ${revocation ? `wallet: issuerWallet.getClient(),
    store: new MemoryRevocationStore()` : ''}
  }
})

console.log('Issuer DID:', issuer.getInfo().did)

// 3. Issue a Credential
async function issueCredential(
  subjectKey: string,
  fields: Record<string, string>
): Promise<VerifiableCredential> {
  // Validate fields
  const error = schema.validate(fields)
  if (error) throw new Error(error)

  // Issue
  const vc = await issuer.issue(subjectKey, '${schemaId}', fields)
  console.log('VC issued to:', vc.credentialSubject.id)
  return vc
}

// 4. Verify a Credential
async function verifyCredential(vc: VerifiableCredential) {
  const result = await issuer.verify(vc)
  console.log('Valid:', result.valid, '| Revoked:', result.revoked)
  if (result.errors.length) console.warn('Errors:', result.errors)
  return result
}

${revocation ? `// 5. Revoke a Credential
async function revokeCredential(serialNumber: string) {
  const { txid } = await issuer.revoke(serialNumber)
  console.log('Revoked, txid:', txid)
}

// 6. Check Revocation Status
async function checkRevocation(serialNumber: string) {
  const revoked = await issuer.isRevoked(serialNumber)
  console.log('Is revoked:', revoked)
  return revoked
}` : ''}

// Wallet-side: Acquire + List + Present
async function acquireAndPresent(wallet: BrowserWallet, serverUrl: string) {
  // Acquire from remote issuer (uses ?action=info and ?action=certify query params)
  const vc = await wallet.acquireCredential({
    serverUrl,
    schemaId: '${schemaId}',
    replaceExisting: true
  })

  // List credentials
  const vcs = await wallet.listCredentials({
    certifiers: [issuer.getInfo().publicKey],
    types: [schema.getInfo().certificateTypeBase64]
  })

  // Create presentation
  const vp = wallet.createPresentation(vcs)
  console.log('VP holder:', vp.holder)
  console.log('VCs in presentation:', vp.verifiableCredential.length)

  return vp
}

// ---- Server-Side Route (REQUIRED for remote issuance) ----
// Use the handler factory — do NOT write manual route code:

// app/api/credential-issuer/route.ts  (no [[...path]] catch-all needed!)
import { createCredentialIssuerHandler } from '@bsv/simple/server'
const handler = createCredentialIssuerHandler({
  schemas: [{
    id: '${schemaId}',
    name: 'CustomCredential',
    fields: [
${fieldsDef}
    ]
  }]
})
export const GET = handler.GET, POST = handler.POST

// API endpoints (all query-param based):
// GET  ?action=info           → { certifierPublicKey, certificateType, schemas }
// GET  ?action=schema&id=...  → schema details
// POST ?action=certify        → CertificateData (wallet acquisition)
// POST ?action=issue          → { credential: VerifiableCredential }
// POST ?action=verify         → { verification: VerificationResult }
// POST ?action=revoke         → { txid }
\`\`\``
}
