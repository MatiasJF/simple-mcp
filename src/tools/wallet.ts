export function generateWalletSetup(target: string, framework: string): string {
  if (target === 'browser') {
    if (framework === 'nextjs') {
      return `\`\`\`typescript
'use client'
import { useState } from 'react'
import { createWallet, type BrowserWallet } from '@bsv/simple/browser'

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    try {
      setError(null)
      const w = await createWallet()
      setWallet(w)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!wallet) {
    return (
      <div>
        <button onClick={connect}>Connect Wallet</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <p>Connected: {wallet.getIdentityKey().substring(0, 20)}...</p>
      <p>Address: {wallet.getAddress()}</p>
      {children}
    </div>
  )
}
\`\`\``
    }

    if (framework === 'react') {
      return `\`\`\`typescript
import { useState, useEffect } from 'react'
import { createWallet, type BrowserWallet } from '@bsv/simple/browser'

export function useWallet() {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    try {
      setLoading(true)
      setError(null)
      const w = await createWallet()
      setWallet(w)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return { wallet, loading, error, connect }
}
\`\`\``
    }

    return `\`\`\`typescript
import { createWallet } from '@bsv/simple/browser'

async function main() {
  const wallet = await createWallet()
  console.log('Connected:', wallet.getIdentityKey())
  console.log('Address:', wallet.getAddress())
  console.log('Status:', wallet.getStatus())
}

main().catch(console.error)
\`\`\``
  }

  // Server target
  if (framework === 'nextjs') {
    return `\`\`\`typescript
// app/api/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const WALLET_FILE = join(process.cwd(), '.server-wallet.json')
let serverWallet: any = null
let initPromise: Promise<any> | null = null

function loadSavedKey(): string | null {
  try {
    if (existsSync(WALLET_FILE)) {
      return JSON.parse(readFileSync(WALLET_FILE, 'utf-8')).privateKey || null
    }
  } catch {}
  return null
}

async function getServerWallet() {
  if (serverWallet) return serverWallet
  if (initPromise) return initPromise

  initPromise = (async () => {
    const { ServerWallet } = await import('@bsv/simple/server')
    const { PrivateKey } = await import('@bsv/sdk')

    const savedKey = loadSavedKey()
    const privateKey = process.env.SERVER_PRIVATE_KEY || savedKey || PrivateKey.fromRandom().toHex()

    serverWallet = await ServerWallet.create({
      privateKey,
      network: 'main',
      storageUrl: 'https://storage.babbage.systems'
    })

    if (!process.env.SERVER_PRIVATE_KEY) {
      writeFileSync(WALLET_FILE, JSON.stringify({
        privateKey,
        identityKey: serverWallet.getIdentityKey()
      }, null, 2))
    }

    return serverWallet
  })()

  return initPromise
}

export async function GET() {
  try {
    const wallet = await getServerWallet()
    return NextResponse.json({
      success: true,
      identityKey: wallet.getIdentityKey(),
      status: wallet.getStatus()
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
\`\`\``
  }

  return `\`\`\`typescript
import { ServerWallet } from '@bsv/simple/server'

async function main() {
  const wallet = await ServerWallet.create({
    privateKey: process.env.SERVER_PRIVATE_KEY!,
    network: 'main',
    storageUrl: 'https://storage.babbage.systems'
  })

  console.log('Server wallet ready:', wallet.getIdentityKey())
  console.log('Status:', wallet.getStatus())
}

main().catch(console.error)
\`\`\``
}
