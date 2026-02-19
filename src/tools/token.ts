export function generateTokenHandler(operations: string[]): string {
  const sections: string[] = []

  if (operations.includes('create')) {
    sections.push(`### Create Token
\`\`\`typescript
async function createToken(wallet: BrowserWallet, data: any, basket = 'my-tokens') {
  const result = await wallet.createToken({
    data,
    basket,
    satoshis: 1
  })

  console.log('Token created:', result.txid)
  console.log('Basket:', result.basket, '| Encrypted:', result.encrypted)
  return result
}

// Usage:
// await createToken(wallet, { type: 'loyalty', points: 100 })
\`\`\``)
  }

  if (operations.includes('list')) {
    sections.push(`### List Tokens
\`\`\`typescript
async function listTokens(wallet: BrowserWallet, basket = 'my-tokens') {
  const tokens = await wallet.listTokenDetails(basket)

  for (const token of tokens) {
    console.log(\`[\${token.outpoint}] \${token.satoshis} sats\`, token.data)
  }

  return tokens
}
\`\`\``)
  }

  if (operations.includes('send')) {
    sections.push(`### Send Token
\`\`\`typescript
async function sendToken(
  wallet: BrowserWallet,
  basket: string,
  outpoint: string,
  recipientKey: string
) {
  const result = await wallet.sendToken({ basket, outpoint, to: recipientKey })
  console.log('Token sent:', result.txid)
  return result
}
\`\`\``)
  }

  if (operations.includes('redeem')) {
    sections.push(`### Redeem Token
\`\`\`typescript
async function redeemToken(wallet: BrowserWallet, basket: string, outpoint: string) {
  const result = await wallet.redeemToken({ basket, outpoint })
  console.log('Token redeemed:', result.txid)
  return result
}
\`\`\``)
  }

  if (operations.includes('messagebox')) {
    sections.push(`### Send Token via MessageBox
\`\`\`typescript
async function sendTokenViaMessageBox(
  wallet: BrowserWallet,
  basket: string,
  outpoint: string,
  recipientKey: string
) {
  const result = await wallet.sendTokenViaMessageBox({ basket, outpoint, to: recipientKey })
  console.log('Token sent via MessageBox:', result.txid)
  return result
}

async function receiveTokens(wallet: BrowserWallet, targetBasket = 'received-tokens') {
  const incoming = await wallet.listIncomingTokens()
  console.log(\`\${incoming.length} incoming tokens\`)

  for (const token of incoming) {
    const accepted = await wallet.acceptIncomingToken(token, targetBasket)
    console.log('Accepted token from:', accepted.sender)
  }

  return incoming.length
}
\`\`\``)
  }

  return sections.join('\n\n')
}
