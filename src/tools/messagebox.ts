export function generateMessageBoxSetup(features: string[], registryUrl?: string): string {
  const registry = registryUrl || '/api/identity-registry'
  const sections: string[] = []

  if (features.includes('certify')) {
    sections.push(`### MessageBox Certification
\`\`\`typescript
async function certifyIdentity(wallet: BrowserWallet, handle: string) {
  // Check if already certified
  const existingHandle = await wallet.getMessageBoxHandle('${registry}')
  if (existingHandle) {
    console.log('Already certified as:', existingHandle)
    return existingHandle
  }

  // Register new handle
  const result = await wallet.certifyForMessageBox(handle, '${registry}')
  console.log('Certified as:', result.handle)
  return result.handle
}

async function revokeIdentity(wallet: BrowserWallet) {
  await wallet.revokeMessageBoxCertification('${registry}')
  console.log('Identity revoked')
}
\`\`\``)
  }

  if (features.includes('send')) {
    sections.push(`### Send Payment via MessageBox
\`\`\`typescript
async function sendPayment(wallet: BrowserWallet, recipientKey: string, satoshis: number) {
  const result = await wallet.sendMessageBoxPayment(recipientKey, satoshis, 'messagebox-change')

  console.log('Payment sent:', result.amount, 'sats to', result.recipient)
  if (result.reinternalized) {
    console.log('Change recovered:', result.reinternalized.count)
  }

  return result
}
\`\`\``)
  }

  if (features.includes('receive')) {
    sections.push(`### Receive Payments from MessageBox
\`\`\`typescript
async function receivePayments(wallet: BrowserWallet, basket = 'received-payments') {
  const incoming = await wallet.listIncomingPayments()
  console.log(\`\${incoming.length} incoming payments\`)

  const results = []
  for (const payment of incoming) {
    try {
      const accepted = await wallet.acceptIncomingPayment(payment, basket)
      results.push({ success: true, payment: accepted })
    } catch (e) {
      results.push({ success: false, error: (e as Error).message })
    }
  }

  return results
}
\`\`\``)
  }

  if (features.includes('search')) {
    sections.push(`### Search Identity Registry
\`\`\`typescript
async function searchIdentity(wallet: BrowserWallet, query: string) {
  const results = await wallet.lookupIdentityByTag(query, '${registry}')
  console.log(\`Found \${results.length} matches for "\${query}"\`)

  for (const match of results) {
    console.log(\`  \${match.tag} → \${match.identityKey.substring(0, 20)}...\`)
  }

  return results
}

async function listMyTags(wallet: BrowserWallet) {
  const tags = await wallet.listMyTags('${registry}')
  console.log('My tags:', tags.map(t => t.tag))
  return tags
}
\`\`\``)
  }

  return sections.join('\n\n')
}
