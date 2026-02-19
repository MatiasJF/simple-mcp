// API Reference resources for @bsv/simple

export const walletApiReference = `# @bsv/simple — Wallet API Reference

## Initialization

### Browser
\`\`\`typescript
import { createWallet } from '@bsv/simple/browser'
const wallet = await createWallet()
// Optional defaults:
const wallet = await createWallet({ changeBasket: 'my-change', network: 'main' })
\`\`\`

### Server (Node.js)
\`\`\`typescript
const { ServerWallet } = await import('@bsv/simple/server')
const wallet = await ServerWallet.create({
  privateKey: 'hex_private_key',
  network: 'main',
  storageUrl: 'https://storage.babbage.systems'
})
\`\`\`

## WalletCore Methods (shared by Browser + Server)

### Wallet Info
- \`getIdentityKey(): string\` — Compressed public key hex (66 chars)
- \`getAddress(): string\` — P2PKH address from identity key
- \`getStatus(): WalletStatus\` — { isConnected, identityKey, network }
- \`getWalletInfo(): WalletInfo\` — { identityKey, address, network, isConnected }
- \`getClient(): WalletInterface\` — Underlying SDK wallet client

### Key Derivation
- \`derivePublicKey(protocolID: [SecurityLevel, string], keyID: string, counterparty?: string, forSelf?: boolean): Promise<string>\` — Derive public key for any protocol
- \`derivePaymentKey(counterparty: string, invoiceNumber?: string): Promise<string>\` — Derive BRC-29 payment key (protocol [2, '3241645161d8'])

### Payments
- \`pay(options: PaymentOptions): Promise<TransactionResult>\` — P2PKH payment with optional memo, BRC-29 derivation, change recovery
- \`send(options: SendOptions): Promise<SendResult>\` — Multi-output: combine P2PKH + OP_RETURN + PushDrop in one tx
- \`fundServerWallet(request: PaymentRequest, basket?: string, changeBasket?: string): Promise<TransactionResult>\` — Fund a ServerWallet using BRC-29 derivation
- \`reinternalizeChange(tx: number[], basket: string, skipOutputIndexes?: number[]): Promise<ReinternalizeResult>\` — Recover orphaned change outputs into a basket

### PaymentOptions
\`\`\`typescript
interface PaymentOptions {
  to: string              // recipient identity key
  satoshis: number        // amount
  memo?: string           // optional OP_RETURN memo
  description?: string    // tx description
  basket?: string         // track payment in basket
  changeBasket?: string   // reinternalize change outputs
  derivationPrefix?: string  // BRC-29 prefix
  derivationSuffix?: string  // BRC-29 suffix
}
\`\`\`

### SendOptions (multi-output)
\`\`\`typescript
interface SendOptions {
  outputs: SendOutputSpec[]
  description?: string
  changeBasket?: string
}

interface SendOutputSpec {
  to?: string                          // recipient key
  satoshis?: number                    // amount
  data?: (string | object | number[])[] // data fields
  description?: string
  basket?: string
  protocolID?: [number, string]        // for PushDrop
  keyID?: string                       // for PushDrop
}
// Rules: to only → P2PKH | data only → OP_RETURN | to + data → PushDrop
\`\`\`

## ServerWallet-specific Methods
- \`createPaymentRequest(options: { satoshis: number, memo?: string }): PaymentRequest\` — Generate BRC-29 payment request
- \`receivePayment(payment: IncomingPayment): Promise<void>\` — Internalize payment using wallet payment protocol

## Result Types
\`\`\`typescript
interface TransactionResult { txid: string; tx: any; outputs?: OutputInfo[]; reinternalized?: ReinternalizeResult }
interface SendResult extends TransactionResult { outputDetails: SendOutputDetail[] }
interface ReinternalizeResult { count: number; errors: string[] }
interface SendOutputDetail { index: number; type: 'p2pkh' | 'op_return' | 'pushdrop'; satoshis: number; description: string }
\`\`\`
`

export const tokensApiReference = `# @bsv/simple — Tokens API Reference

## Methods (mixed into wallet via createTokenMethods)

### createToken(options: TokenOptions): Promise<TokenResult>
Create an encrypted PushDrop token.
\`\`\`typescript
interface TokenOptions {
  to?: string                     // recipient key (default: self)
  data: any                       // JSON-serializable data (encrypted)
  basket?: string                 // default: 'tokens'
  protocolID?: [number, string]   // default: [0, 'token']
  keyID?: string                  // default: '1'
  satoshis?: number               // default: 1
}
interface TokenResult extends TransactionResult {
  basket: string
  encrypted: boolean
}
\`\`\`
Example:
\`\`\`typescript
const result = await wallet.createToken({
  data: { type: 'loyalty', points: 100 },
  basket: 'my-tokens'
})
\`\`\`

### listTokenDetails(basket?: string): Promise<TokenDetail[]>
List and decrypt all tokens in a basket.
\`\`\`typescript
interface TokenDetail {
  outpoint: string     // txid.vout
  satoshis: number
  data: any            // decrypted payload
  protocolID: any
  keyID: string
  counterparty: string
}
\`\`\`

### sendToken(options: SendTokenOptions): Promise<TransactionResult>
Transfer a token to another key (on-chain, two-step sign flow).
\`\`\`typescript
interface SendTokenOptions { basket: string; outpoint: string; to: string }
\`\`\`

### redeemToken(options: RedeemTokenOptions): Promise<TransactionResult>
Spend/destroy a token (reclaims satoshis).
\`\`\`typescript
interface RedeemTokenOptions { basket: string; outpoint: string }
\`\`\`

### sendTokenViaMessageBox(options: SendTokenOptions): Promise<TransactionResult>
Transfer a token via MessageBox P2P messaging (off-chain delivery).

### listIncomingTokens(): Promise<any[]>
List tokens waiting in the \`simple_token_inbox\` MessageBox.

### acceptIncomingToken(token: any, basket?: string): Promise<any>
Accept incoming token into a basket via \`basket insertion\` protocol.
`

export const inscriptionsApiReference = `# @bsv/simple — Inscriptions API Reference

All inscriptions create OP_RETURN outputs (0 satoshis).

## Methods

### inscribeText(text: string, opts?): Promise<InscriptionResult>
Create an OP_RETURN text inscription.
- Default basket: \`'text'\`

### inscribeJSON(data: object, opts?): Promise<InscriptionResult>
Create an OP_RETURN JSON inscription.
- Default basket: \`'json'\`

### inscribeFileHash(hash: string, opts?): Promise<InscriptionResult>
Create an OP_RETURN SHA-256 file hash inscription.
- Default basket: \`'hash-document'\`
- Validates: must be 64-char hex string

### inscribeImageHash(hash: string, opts?): Promise<InscriptionResult>
Create an OP_RETURN SHA-256 image hash inscription.
- Default basket: \`'hash-image'\`
- Validates: must be 64-char hex string

## Shared Options
\`\`\`typescript
opts?: { basket?: string; description?: string }
\`\`\`

## Result Type
\`\`\`typescript
interface InscriptionResult extends TransactionResult {
  type: 'text' | 'json' | 'file-hash' | 'image-hash'
  dataSize: number
  basket: string
}
\`\`\`

## Example
\`\`\`typescript
const text = await wallet.inscribeText('Hello blockchain!')
const json = await wallet.inscribeJSON({ title: 'Doc', created: Date.now() })
const hash = await wallet.inscribeFileHash('a'.repeat(64))
\`\`\`
`

export const messageboxApiReference = `# @bsv/simple — MessageBox API Reference

## Identity & Certification

### certifyForMessageBox(handle: string, registryUrl?: string, host?: string): Promise<{ txid, handle }>
Register a handle on the identity registry and anoint the MessageBox host.

### getMessageBoxHandle(registryUrl?: string): Promise<string | null>
Check if wallet has a registered handle. Returns null if none found.

### revokeMessageBoxCertification(registryUrl?: string): Promise<void>
Remove all registered handles for this identity key.

## Payments

### sendMessageBoxPayment(to: string, satoshis: number, changeBasket?: string): Promise<any>
Send payment via MessageBox using \`createPaymentToken()\` + \`sendMessage()\`.
Returns: \`{ txid, amount, recipient, reinternalized? }\`

### listIncomingPayments(): Promise<any[]>
List payments in the \`payment_inbox\` MessageBox.

### acceptIncomingPayment(payment: any, basket?: string): Promise<any>
Accept a payment. If \`basket\` is provided, uses \`basket insertion\` protocol (recommended). Otherwise uses \`PeerPayClient.acceptPayment()\`.

**IMPORTANT:** When not using a basket, PeerPayClient.acceptPayment() swallows errors. The library checks \`typeof result === 'string'\` and throws.

## Identity Registry

### registerIdentityTag(tag: string, registryUrl?: string): Promise<{ tag }>
Register a tag in the identity registry.

### lookupIdentityByTag(query: string, registryUrl?: string): Promise<{ tag, identityKey }[]>
Search the identity registry by tag.

### listMyTags(registryUrl?: string): Promise<{ tag, createdAt }[]>
List all tags registered to this identity key.

### revokeIdentityTag(tag: string, registryUrl?: string): Promise<void>
Remove a registered tag.

## Registry API Format
The identity registry expects these API endpoints:
- \`GET ?action=lookup&query=...\` → \`{ success, results: [{ tag, identityKey }] }\`
- \`GET ?action=list&identityKey=...\` → \`{ success, tags: [{ tag, createdAt }] }\`
- \`POST ?action=register\` body: \`{ tag, identityKey }\` → \`{ success }\`
- \`POST ?action=revoke\` body: \`{ tag, identityKey }\` → \`{ success }\`
`

export const certificationApiReference = `# @bsv/simple — Certification API Reference

## Certifier Class (standalone)

### Certifier.create(config?): Promise<Certifier>
\`\`\`typescript
const certifier = await Certifier.create()  // random key
const certifier = await Certifier.create({
  privateKey: 'hex',
  certificateType: 'base64type',
  defaultFields: { role: 'admin' },
  includeTimestamp: true  // default: true
})
\`\`\`

### certifier.getInfo(): { publicKey, certificateType }

### certifier.certify(wallet: WalletCore, additionalFields?): Promise<CertificateData>
Issues a certificate AND acquires it into the wallet in one call.

## Wallet Methods

### acquireCertificateFrom(config): Promise<CertificateData>
\`\`\`typescript
await wallet.acquireCertificateFrom({
  serverUrl: 'https://certifier.example.com',
  replaceExisting: true  // revoke old certs first (default: true)
})
\`\`\`
Server must expose: \`GET /api/info\` → \`{ certifierPublicKey, certificateType }\`, \`POST /api/certify\` → CertificateData

### listCertificatesFrom(config): Promise<{ totalCertificates, certificates }>
\`\`\`typescript
const result = await wallet.listCertificatesFrom({
  certifiers: [certifierPubKey],
  types: [certificateType],
  limit: 100
})
\`\`\`

### relinquishCert(args): Promise<void>
\`\`\`typescript
await wallet.relinquishCert({ type, serialNumber, certifier })
\`\`\`

## CertificateData Type
\`\`\`typescript
interface CertificateData {
  type: string; serialNumber: string; subject: string; certifier: string
  revocationOutpoint: string; fields: Record<string, string>
  signature: string; keyringForSubject: Record<string, string>
}
\`\`\`
`

export const didApiReference = `# @bsv/simple — DID API Reference

## DID Class (standalone, no wallet needed)

### DID.fromIdentityKey(identityKey: string): DIDDocument
Generate a W3C DID Document from a compressed public key.

### DID.parse(didString: string): DIDParseResult
Parse \`did:bsv:02abc...\` → \`{ method: 'bsv', identityKey: '02abc...' }\`

### DID.isValid(didString: string): boolean
Check if a DID string is valid \`did:bsv:\` format.

### DID.getCertificateType(): string
Returns the base64 certificate type for DID persistence.

## Wallet Methods

### getDID(): DIDDocument
Get this wallet's DID Document (synchronous).

### resolveDID(didString: string): DIDDocument
Resolve any \`did:bsv:\` string to its DID Document (synchronous).

### registerDID(options?: { persist?: boolean }): Promise<DIDDocument>
Persist DID as a BSV certificate using an ephemeral Certifier.

## Types
\`\`\`typescript
interface DIDDocument {
  '@context': string[]
  id: string               // 'did:bsv:{identityKey}'
  controller: string
  verificationMethod: DIDVerificationMethod[]
  authentication: string[]
  assertionMethod: string[]
}
interface DIDVerificationMethod {
  id: string               // 'did:bsv:{key}#key-1'
  type: string             // 'EcdsaSecp256k1VerificationKey2019'
  controller: string
  publicKeyHex: string
}
interface DIDParseResult { method: string; identityKey: string }
\`\`\`

## Example
\`\`\`typescript
import { DID } from '@bsv/simple/browser'

const doc = DID.fromIdentityKey('02abc...')
console.log(doc.id)  // 'did:bsv:02abc...'

const didDoc = wallet.getDID()
await wallet.registerDID()  // persists as certificate
const resolved = wallet.resolveDID('did:bsv:02abc...')
\`\`\`
`

export const credentialsApiReference = `# @bsv/simple — Credentials API Reference

## CredentialSchema

### Constructor
\`\`\`typescript
const schema = new CredentialSchema({
  id: 'my-schema',
  name: 'My Credential',
  description: 'Optional',
  fields: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'role', label: 'Role', type: 'select', options: [{ value: 'admin', label: 'Admin' }] }
  ],
  validate: (values) => values.name.length < 2 ? 'Name too short' : null,
  computedFields: (values) => ({ verified: 'true', timestamp: Date.now().toString() })
})
\`\`\`

### Methods
- \`validate(values: Record<string, string>): string | null\`
- \`computeFields(values: Record<string, string>): Record<string, string>\`
- \`getInfo(): { id, name, description?, certificateTypeBase64, fieldCount }\`
- \`getConfig(): CredentialSchemaConfig\`

## CredentialIssuer

### CredentialIssuer.create(config): Promise<CredentialIssuer>
\`\`\`typescript
const issuer = await CredentialIssuer.create({
  privateKey: 'hex_key',
  schemas: [schemaConfig],
  revocation: {
    enabled: true,
    wallet: walletInstance,                // for creating revocation UTXOs
    store: new MemoryRevocationStore()     // or FileRevocationStore
  }
})
\`\`\`

### Methods
- \`issue(subjectIdentityKey, schemaId, fields): Promise<VerifiableCredential>\`
- \`verify(vc: VerifiableCredential): Promise<VerificationResult>\`
- \`revoke(serialNumber: string): Promise<{ txid }>\`
- \`isRevoked(serialNumber: string): Promise<boolean>\`
- \`getInfo(): { publicKey, did, schemas: [{ id, name }] }\`

## Revocation Stores

### MemoryRevocationStore (browser/tests)
\`\`\`typescript
import { MemoryRevocationStore } from '@bsv/simple/browser'
const store = new MemoryRevocationStore()
\`\`\`

### FileRevocationStore (server only)
\`\`\`typescript
import { FileRevocationStore } from '@bsv/simple/server'
const store = new FileRevocationStore()           // default: .revocation-secrets.json
const store = new FileRevocationStore('/custom/path.json')
\`\`\`

### RevocationStore Interface
\`\`\`typescript
interface RevocationStore {
  save(serialNumber: string, record: RevocationRecord): Promise<void>
  load(serialNumber: string): Promise<RevocationRecord | undefined>
  delete(serialNumber: string): Promise<void>
  has(serialNumber: string): Promise<boolean>
  findByOutpoint(outpoint: string): Promise<boolean>
}
\`\`\`

## W3C VC/VP Utilities
\`\`\`typescript
import { toVerifiableCredential, toVerifiablePresentation } from '@bsv/simple/browser'

const vc = toVerifiableCredential(certData, issuerPublicKey, { credentialType: 'MyType' })
const vp = toVerifiablePresentation([vc1, vc2], holderKey)
\`\`\`

## Wallet Methods
- \`acquireCredential(config): Promise<VerifiableCredential>\` — Acquire VC from remote issuer
- \`listCredentials(config): Promise<VerifiableCredential[]>\` — List certs as W3C VCs
- \`createPresentation(credentials): VerifiablePresentation\` — Wrap VCs into a VP
`

export const overlayApiReference = `# @bsv/simple — Overlay API Reference

## Overlay Class (standalone)

### Overlay.create(config): Promise<Overlay>
\`\`\`typescript
const overlay = await Overlay.create({
  topics: ['tm_my_topic'],              // MUST start with 'tm_'
  network: 'mainnet',                   // 'mainnet' | 'testnet' | 'local'
  slapTrackers: ['https://...'],        // optional
  hostOverrides: { tm_topic: ['url'] }, // optional
  additionalHosts: { tm_topic: ['url'] } // optional
})
\`\`\`

### Instance Methods
- \`getInfo(): OverlayInfo\` — { topics, network }
- \`addTopic(topic: string): void\` — Add topic (must start with 'tm_')
- \`removeTopic(topic: string): void\` — Remove topic
- \`broadcast(tx: Transaction, topics?: string[]): Promise<OverlayBroadcastResult>\`
- \`query(service: string, query: unknown, timeout?: number): Promise<LookupAnswer>\`
- \`lookupOutputs(service: string, query: unknown): Promise<OverlayOutput[]>\`
- \`getBroadcaster(): TopicBroadcaster\` — Raw SDK broadcaster
- \`getResolver(): LookupResolver\` — Raw SDK resolver

## Wallet Methods (overlay module)

### advertiseSHIP(domain, topic, basket?): Promise<TransactionResult>
Create a SHIP advertisement token. Topic must start with 'tm_'.

### advertiseSLAP(domain, service, basket?): Promise<TransactionResult>
Create a SLAP advertisement token. Service must start with 'ls_'.

### broadcastAction(overlay, actionOptions, topics?): Promise<{ txid, broadcast }>
Create an action and broadcast to overlay in one step.

### withRetry<T>(operation, overlay, maxRetries?): Promise<T>
Double-spend retry wrapper using \`withDoubleSpendRetry\`.

## Types
\`\`\`typescript
interface OverlayConfig {
  topics: string[]
  network?: 'mainnet' | 'testnet' | 'local'
  slapTrackers?: string[]
  hostOverrides?: Record<string, string[]>
  additionalHosts?: Record<string, string[]>
}
interface OverlayBroadcastResult { success: boolean; txid?: string; code?: string; description?: string }
interface OverlayOutput { beef: number[]; outputIndex: number; context?: number[] }
\`\`\`
`
