export function scaffoldNextjsConfig(features: string[]): string {
  const deps: Record<string, string> = {
    '@bsv/simple': '^0.2.0',
    '@bsv/sdk': '^1.10.1'
  }

  if (features.includes('server-wallet')) {
    deps['@bsv/wallet-toolbox'] = '^1.8.2'
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
Create \`app/api/server-wallet/route.ts\` — use the \`generate_server_route\` tool.` : ''}
${features.includes('messagebox') ? `### MessageBox setup
Create \`app/api/identity-registry/route.ts\` for handle registration.` : ''}
`
}
