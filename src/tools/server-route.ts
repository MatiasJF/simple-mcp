export function generateServerRoute(actions: string[], walletPersistence: string): string {
  const persistenceCode = walletPersistence === 'env'
    ? `const privateKey = process.env.SERVER_PRIVATE_KEY!
    if (!privateKey) throw new Error('SERVER_PRIVATE_KEY env var is required')`
    : walletPersistence === 'file'
    ? `const WALLET_FILE = join(process.cwd(), '.server-wallet.json')

function loadSavedKey(): string | null {
  try {
    if (existsSync(WALLET_FILE)) {
      return JSON.parse(readFileSync(WALLET_FILE, 'utf-8')).privateKey || null
    }
  } catch {}
  return null
}

function saveKey(privateKey: string, identityKey: string) {
  writeFileSync(WALLET_FILE, JSON.stringify({ privateKey, identityKey }, null, 2))
}`
    : `const WALLET_FILE = join(process.cwd(), '.server-wallet.json')

function loadSavedKey(): string | null {
  try {
    if (existsSync(WALLET_FILE)) {
      return JSON.parse(readFileSync(WALLET_FILE, 'utf-8')).privateKey || null
    }
  } catch {}
  return null
}

function saveKey(privateKey: string, identityKey: string) {
  writeFileSync(WALLET_FILE, JSON.stringify({ privateKey, identityKey }, null, 2))
}`

  const keyResolution = walletPersistence === 'env'
    ? 'const privateKey = process.env.SERVER_PRIVATE_KEY!'
    : walletPersistence === 'file'
    ? `const savedKey = loadSavedKey()
    const privateKey = savedKey || PrivateKey.fromRandom().toHex()`
    : `const savedKey = loadSavedKey()
    const privateKey = process.env.SERVER_PRIVATE_KEY || savedKey || PrivateKey.fromRandom().toHex()`

  const saveStep = walletPersistence !== 'env'
    ? `\n    if (!process.env.SERVER_PRIVATE_KEY) {
      saveKey(privateKey, serverWallet.getIdentityKey())
    }`
    : ''

  const fsImport = walletPersistence !== 'env'
    ? `import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'`
    : ''

  const getHandlers: string[] = []
  const postHandlers: string[] = []

  if (actions.includes('create') || actions.includes('status')) {
    getHandlers.push(`    if (action === 'create') {
      const wallet = await getServerWallet()
      return NextResponse.json({
        success: true,
        serverIdentityKey: wallet.getIdentityKey(),
        status: wallet.getStatus()
      })
    }`)
  }

  if (actions.includes('request')) {
    getHandlers.push(`    if (action === 'request') {
      const wallet = await getServerWallet()
      const satoshis = Number(req.nextUrl.searchParams.get('satoshis')) || 1000
      const request = wallet.createPaymentRequest({ satoshis })
      return NextResponse.json({ success: true, paymentRequest: request })
    }`)
  }

  if (actions.includes('balance')) {
    getHandlers.push(`    if (action === 'balance') {
      const wallet = await getServerWallet()
      const client = wallet.getClient()
      const raw = await client.listOutputs({ basket: 'default', include: 'locking scripts' })
      const outputs = raw?.outputs ?? (Array.isArray(raw) ? raw : [])
      const totalSatoshis = outputs.reduce((sum: number, o: any) => sum + (o.satoshis || 0), 0)
      return NextResponse.json({ success: true, totalOutputs: outputs.length, totalSatoshis })
    }`)
  }

  if (actions.includes('receive')) {
    postHandlers.push(`    if (action === 'receive') {
      const wallet = await getServerWallet()
      const { tx, senderIdentityKey, derivationPrefix, derivationSuffix, outputIndex } = await req.json()

      if (!tx || !senderIdentityKey || !derivationPrefix || !derivationSuffix) {
        return NextResponse.json({
          success: false,
          error: 'Missing: tx, senderIdentityKey, derivationPrefix, derivationSuffix'
        }, { status: 400 })
      }

      await wallet.receivePayment({
        tx, senderIdentityKey, derivationPrefix, derivationSuffix,
        outputIndex: outputIndex ?? 0
      })

      return NextResponse.json({ success: true, message: 'Payment internalized' })
    }`)
  }

  return `\`\`\`typescript
// app/api/server-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
${fsImport}

${persistenceCode}

let serverWallet: any = null
let initPromise: Promise<any> | null = null

async function getServerWallet() {
  if (serverWallet) return serverWallet
  if (initPromise) return initPromise

  initPromise = (async () => {
    const { ServerWallet } = await import('@bsv/simple/server')
    ${walletPersistence !== 'env' ? "const { PrivateKey } = await import('@bsv/sdk')" : ''}
    ${keyResolution}

    serverWallet = await ServerWallet.create({
      privateKey,
      network: 'main',
      storageUrl: 'https://storage.babbage.systems'
    })
    ${saveStep}
    return serverWallet
  })()

  return initPromise
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'create'

  try {
${getHandlers.join('\n\n')}

    return NextResponse.json({ error: \`Unknown action: \${action}\` }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

${postHandlers.length > 0 ? `export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'receive'

  try {
${postHandlers.join('\n\n')}

    return NextResponse.json({ error: \`Unknown action: \${action}\` }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}` : ''}
\`\`\``
}
