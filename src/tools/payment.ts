export function generatePaymentHandler(type: string, basket?: string): string {
  const effectiveBasket = basket || 'payments'

  if (type === 'simple') {
    return `\`\`\`typescript
async function sendPayment(
  wallet: BrowserWallet,
  recipientKey: string,
  satoshis: number
) {
  const result = await wallet.pay({
    to: recipientKey,
    satoshis
  })

  console.log('TXID:', result.txid)

  return result
}
\`\`\``
  }

  if (type === 'multi-output') {
    return `\`\`\`typescript
async function sendMultiOutput(
  wallet: BrowserWallet,
  outputs: Array<{
    to?: string
    satoshis?: number
    data?: (string | object | number[])[]
    basket?: string
  }>
) {
  const result = await wallet.send({
    outputs: outputs.map(o => ({
      to: o.to,
      satoshis: o.satoshis,
      data: o.data,
      basket: o.basket || '${effectiveBasket}'
    })),
    description: 'Multi-output transaction'
  })

  console.log('TXID:', result.txid)
  console.log('Outputs:', result.outputDetails.map(d => \`#\${d.index}: \${d.type} (\${d.satoshis} sats)\`))

  return result
}

// Usage:
// await sendMultiOutput(wallet, [
//   { to: recipientKey, satoshis: 1000 },                    // P2PKH
//   { data: ['Hello!'] },                                     // OP_RETURN
//   { to: wallet.getIdentityKey(), data: [{ v: 1 }], satoshis: 1 }  // PushDrop
// ])
\`\`\``
  }

  if (type === 'server-funding') {
    return `\`\`\`typescript
async function fundServer(wallet: BrowserWallet, serverApiUrl: string) {
  // 1. Get payment request from server
  const res = await fetch(\`\${serverApiUrl}?action=request\`)
  const { paymentRequest } = await res.json()

  // 2. Fund server wallet via BRC-29 derivation
  const result = await wallet.fundServerWallet(
    paymentRequest,
    '${effectiveBasket}'
  )

  if (!result.tx) {
    throw new Error('No transaction bytes returned')
  }

  // 3. Send tx to server for internalization
  const receiveRes = await fetch(\`\${serverApiUrl}?action=receive\`, {
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

  const receiveData = await receiveRes.json()
  if (!receiveData.success) {
    throw new Error(receiveData.error || 'Server receive failed')
  }

  console.log('Server funded:', result.txid)
  return result
}
\`\`\``
  }

  return `Unknown payment type: ${type}. Use 'simple', 'multi-output', or 'server-funding'.`
}
