export function generateInscriptionHandler(types: string[]): string {
  const sections: string[] = []

  if (types.includes('text')) {
    sections.push(`### Text Inscription
\`\`\`typescript
async function inscribeText(wallet: BrowserWallet, text: string) {
  const result = await wallet.inscribeText(text)
  console.log('Text inscribed:', result.txid)
  console.log('Size:', result.dataSize, 'bytes | Basket:', result.basket)
  return result
}
\`\`\``)
  }

  if (types.includes('json')) {
    sections.push(`### JSON Inscription
\`\`\`typescript
async function inscribeJSON(wallet: BrowserWallet, data: object) {
  const result = await wallet.inscribeJSON(data)
  console.log('JSON inscribed:', result.txid)
  console.log('Size:', result.dataSize, 'bytes | Basket:', result.basket)
  return result
}
\`\`\``)
  }

  if (types.includes('file-hash')) {
    sections.push(`### File Hash Inscription
\`\`\`typescript
async function inscribeFileHash(wallet: BrowserWallet, file: File) {
  // Compute SHA-256 hash of the file
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const result = await wallet.inscribeFileHash(hash, {
    description: \`Hash of \${file.name}\`
  })

  console.log('File hash inscribed:', result.txid)
  console.log('Hash:', hash)
  return { ...result, hash, fileName: file.name }
}
\`\`\``)
  }

  if (types.includes('image-hash')) {
    sections.push(`### Image Hash Inscription
\`\`\`typescript
async function inscribeImageHash(wallet: BrowserWallet, imageFile: File) {
  if (!imageFile.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  const buffer = await imageFile.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const result = await wallet.inscribeImageHash(hash, {
    description: \`Hash of image \${imageFile.name}\`
  })

  console.log('Image hash inscribed:', result.txid)
  return { ...result, hash, fileName: imageFile.name }
}
\`\`\``)
  }

  return sections.join('\n\n')
}
