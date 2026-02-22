export function scaffoldNextjsConfig(features: string[]): string {
  const deps: Record<string, string> = {
    '@bsv/simple': '^0.2.0'
  }

  const nextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@bsv/wallet-toolbox",
    "knex",
    "better-sqlite3",
    "tedious",
    "mysql",
    "mysql2",
    "pg",
    "pg-query-stream",
    "oracledb",
    "dotenv"
  ]
};

export default nextConfig;`

  const packageAdditions = JSON.stringify({ dependencies: deps }, null, 2)

  return `## next.config.ts

\`\`\`typescript
${nextConfig}
\`\`\`

## package.json additions

\`\`\`json
${packageAdditions}
\`\`\`

## .gitignore additions

\`\`\`
.server-wallet.json
.revocation-secrets.json
\`\`\`

## Features configured: ${features.join(', ')}

${features.includes('server-wallet') ? `### Server wallet setup
\`\`\`typescript
// app/api/server-wallet/route.ts
import { createServerWalletHandler } from '@bsv/simple/server'
const handler = createServerWalletHandler()
export const GET = handler.GET, POST = handler.POST
\`\`\`` : ''}
${features.includes('messagebox') ? `### MessageBox setup
\`\`\`typescript
// app/api/identity-registry/route.ts
import { createIdentityRegistryHandler } from '@bsv/simple/server'
const handler = createIdentityRegistryHandler()
export const GET = handler.GET, POST = handler.POST
\`\`\`` : ''}
${features.includes('did') ? `### DID Resolution Proxy
\`\`\`typescript
// app/api/resolve-did/route.ts
import { createDIDResolverHandler } from '@bsv/simple/server'
const handler = createDIDResolverHandler()
export const GET = handler.GET
\`\`\`` : ''}
${features.includes('credentials') ? `### Credential Issuer
\`\`\`typescript
// app/api/credential-issuer/route.ts
import { createCredentialIssuerHandler } from '@bsv/simple/server'
const handler = createCredentialIssuerHandler({
  schemas: [{ id: 'my-cred', name: 'MyCred', fields: [{ key: 'name', label: 'Name', type: 'text', required: true }] }]
})
export const GET = handler.GET, POST = handler.POST
\`\`\`` : ''}
`
}
