export function generateDIDIntegration(features: string[]): string {
  const sections: string[] = []

  sections.push(`\`\`\`typescript
import { DID } from '@bsv/simple/browser'
\`\`\``)

  if (features.includes('get')) {
    sections.push(`### Get Wallet DID
\`\`\`typescript
function getWalletDID(wallet: BrowserWallet) {
  const didDoc = wallet.getDID()
  console.log('DID:', didDoc.id)
  console.log('Controller:', didDoc.controller)
  console.log('Verification Method:', didDoc.verificationMethod[0].publicKeyHex)
  return didDoc
}
\`\`\``)
  }

  if (features.includes('register')) {
    sections.push(`### Register DID (persist as certificate)
\`\`\`typescript
async function registerDID(wallet: BrowserWallet) {
  const didDoc = await wallet.registerDID({ persist: true })
  console.log('DID registered:', didDoc.id)
  return didDoc
}
\`\`\``)
  }

  if (features.includes('resolve')) {
    sections.push(`### Resolve DID
\`\`\`typescript
function resolveDID(wallet: BrowserWallet, didString: string) {
  if (!DID.isValid(didString)) {
    throw new Error('Invalid DID format. Must be: did:bsv:{identityKey}')
  }

  const didDoc = wallet.resolveDID(didString)
  console.log('Resolved DID:', didDoc.id)
  console.log('Public Key:', didDoc.verificationMethod[0].publicKeyHex)
  return didDoc
}

// Static utility (no wallet needed)
function parseDID(didString: string) {
  const parsed = DID.parse(didString)
  console.log('Method:', parsed.method)      // 'bsv'
  console.log('Key:', parsed.identityKey)     // '02abc...'
  return parsed
}
\`\`\``)
  }

  return sections.join('\n\n')
}
