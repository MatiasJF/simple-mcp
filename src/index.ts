import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// Resources
import {
  walletApiReference,
  tokensApiReference,
  inscriptionsApiReference,
  messageboxApiReference,
  certificationApiReference,
  didApiReference,
  credentialsApiReference,
  overlayApiReference
} from './resources/api-reference'
import { nextjsIntegrationGuide } from './resources/integration'
import { gotchasReference } from './resources/gotchas'
import { codePatterns } from './resources/patterns'

// Tools
import { scaffoldNextjsConfig } from './tools/scaffold'
import { generateWalletSetup } from './tools/wallet'
import { generatePaymentHandler } from './tools/payment'
import { generateTokenHandler } from './tools/token'
import { generateInscriptionHandler } from './tools/inscription'
import { generateMessageBoxSetup } from './tools/messagebox'
import { generateServerRoute } from './tools/server-route'
import { generateCredentialIssuer } from './tools/credential'
import { generateDIDIntegration } from './tools/did'

// Prompts
import { integratePrompt } from './prompts/integrate'
import { addFeaturePrompt } from './prompts/add-feature'
import { debugPrompt } from './prompts/debug'

// ============================================================================
// Create MCP Server
// ============================================================================

const server = new McpServer({
  name: 'simple-mcp',
  version: '1.0.0'
})

// ============================================================================
// Resources
// ============================================================================

server.resource('wallet-api', 'simplifier://api/wallet', async () => ({
  contents: [{ uri: 'simplifier://api/wallet', mimeType: 'text/markdown', text: walletApiReference }]
}))

server.resource('tokens-api', 'simplifier://api/tokens', async () => ({
  contents: [{ uri: 'simplifier://api/tokens', mimeType: 'text/markdown', text: tokensApiReference }]
}))

server.resource('inscriptions-api', 'simplifier://api/inscriptions', async () => ({
  contents: [{ uri: 'simplifier://api/inscriptions', mimeType: 'text/markdown', text: inscriptionsApiReference }]
}))

server.resource('messagebox-api', 'simplifier://api/messagebox', async () => ({
  contents: [{ uri: 'simplifier://api/messagebox', mimeType: 'text/markdown', text: messageboxApiReference }]
}))

server.resource('certification-api', 'simplifier://api/certification', async () => ({
  contents: [{ uri: 'simplifier://api/certification', mimeType: 'text/markdown', text: certificationApiReference }]
}))

server.resource('did-api', 'simplifier://api/did', async () => ({
  contents: [{ uri: 'simplifier://api/did', mimeType: 'text/markdown', text: didApiReference }]
}))

server.resource('credentials-api', 'simplifier://api/credentials', async () => ({
  contents: [{ uri: 'simplifier://api/credentials', mimeType: 'text/markdown', text: credentialsApiReference }]
}))

server.resource('overlay-api', 'simplifier://api/overlay', async () => ({
  contents: [{ uri: 'simplifier://api/overlay', mimeType: 'text/markdown', text: overlayApiReference }]
}))

server.resource('nextjs-guide', 'simplifier://guide/nextjs', async () => ({
  contents: [{ uri: 'simplifier://guide/nextjs', mimeType: 'text/markdown', text: nextjsIntegrationGuide }]
}))

server.resource('gotchas', 'simplifier://guide/gotchas', async () => ({
  contents: [{ uri: 'simplifier://guide/gotchas', mimeType: 'text/markdown', text: gotchasReference }]
}))

server.resource('patterns', 'simplifier://guide/patterns', async () => ({
  contents: [{ uri: 'simplifier://guide/patterns', mimeType: 'text/markdown', text: codePatterns }]
}))

// ============================================================================
// Tools
// ============================================================================

server.tool(
  'scaffold_nextjs_config',
  'Generate next.config.ts, package.json additions, and .gitignore for a BSV app',
  { features: z.array(z.string()).describe('Features to enable: payments, tokens, inscriptions, messagebox, certification, did, credentials, overlay, server-wallet') },
  async ({ features }) => ({
    content: [{ type: 'text', text: scaffoldNextjsConfig(features) }]
  })
)

server.tool(
  'generate_wallet_setup',
  'Generate wallet initialization code for browser or server',
  {
    target: z.enum(['browser', 'server']).describe('Target environment'),
    framework: z.enum(['nextjs', 'react', 'vanilla']).describe('Target framework')
  },
  async ({ target, framework }) => ({
    content: [{ type: 'text', text: generateWalletSetup(target, framework) }]
  })
)

server.tool(
  'generate_payment_handler',
  'Generate payment handler function',
  {
    type: z.enum(['simple', 'multi-output', 'server-funding']).describe('Payment type'),
    basket: z.string().optional().describe('Basket name for tracking payments')
  },
  async ({ type, basket }) => ({
    content: [{ type: 'text', text: generatePaymentHandler(type, basket) }]
  })
)

server.tool(
  'generate_token_handler',
  'Generate token handler functions',
  {
    operations: z.array(z.enum(['create', 'list', 'send', 'redeem', 'messagebox'])).describe('Token operations to generate')
  },
  async ({ operations }) => ({
    content: [{ type: 'text', text: generateTokenHandler(operations) }]
  })
)

server.tool(
  'generate_inscription_handler',
  'Generate inscription handler functions',
  {
    types: z.array(z.enum(['text', 'json', 'file-hash', 'image-hash'])).describe('Inscription types to generate')
  },
  async ({ types }) => ({
    content: [{ type: 'text', text: generateInscriptionHandler(types) }]
  })
)

server.tool(
  'generate_messagebox_setup',
  'Generate MessageBox integration code',
  {
    features: z.array(z.enum(['certify', 'send', 'receive', 'search'])).describe('MessageBox features to generate'),
    registryUrl: z.string().optional().describe('Identity registry URL (default: /api/identity-registry)')
  },
  async ({ features, registryUrl }) => ({
    content: [{ type: 'text', text: generateMessageBoxSetup(features, registryUrl) }]
  })
)

server.tool(
  'generate_server_route',
  'Generate Next.js API route for server wallet',
  {
    actions: z.array(z.string()).describe('Actions: create, request, balance, receive'),
    walletPersistence: z.enum(['env', 'file', 'both']).describe('Key persistence: env (env var only), file (file only), both (env + file fallback)')
  },
  async ({ actions, walletPersistence }) => ({
    content: [{ type: 'text', text: generateServerRoute(actions, walletPersistence) }]
  })
)

server.tool(
  'generate_credential_issuer',
  'Generate CredentialIssuer setup with schema',
  {
    schemaFields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.string(),
      required: z.boolean().optional()
    })).describe('Schema field definitions'),
    revocation: z.boolean().describe('Enable revocation support')
  },
  async ({ schemaFields, revocation }) => ({
    content: [{ type: 'text', text: generateCredentialIssuer(schemaFields, revocation) }]
  })
)

server.tool(
  'generate_did_integration',
  'Generate DID integration code',
  {
    features: z.array(z.enum(['get', 'register', 'resolve'])).describe('DID features to generate')
  },
  async ({ features }) => ({
    content: [{ type: 'text', text: generateDIDIntegration(features) }]
  })
)

// ============================================================================
// Prompts
// ============================================================================

server.prompt(
  integratePrompt.name,
  integratePrompt.description,
  {
    framework: z.string().optional().describe('Target framework: nextjs, react, or vanilla'),
    features: z.string().optional().describe('Comma-separated features: payments, tokens, inscriptions, messagebox, certification, did, credentials, overlay, server-wallet')
  },
  ({ framework, features }) => ({
    messages: integratePrompt.getMessages({ framework: framework || 'nextjs', features: features || 'payments' })
  })
)

server.prompt(
  addFeaturePrompt.name,
  addFeaturePrompt.description,
  {
    feature: z.string().describe('Feature to add: payments, tokens, inscriptions, messagebox, certification, did, credentials, overlay, server-wallet'),
    framework: z.string().optional().describe('Target framework: nextjs, react, or vanilla')
  },
  ({ feature, framework }) => ({
    messages: addFeaturePrompt.getMessages({ feature, framework: framework || 'nextjs' })
  })
)

server.prompt(
  debugPrompt.name,
  debugPrompt.description,
  {
    error: z.string().describe('Error message or problem description'),
    feature: z.string().optional().describe('Feature area: wallet, payments, tokens, inscriptions, messagebox, certification, did, credentials, overlay, server-wallet')
  },
  ({ error, feature }) => ({
    messages: debugPrompt.getMessages({ error, feature: feature || 'general' })
  })
)

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
