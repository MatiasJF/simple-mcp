export const debugPrompt = {
  name: 'debug_simple',
  description: 'Help debug issues with @bsv/simple code. Checks common gotchas and suggests fixes.',
  arguments: [
    {
      name: 'error',
      description: 'The error message or description of the problem',
      required: true
    },
    {
      name: 'feature',
      description: 'Which feature area: wallet, payments, tokens, inscriptions, messagebox, certification, did, credentials, overlay, server-wallet',
      required: false
    }
  ],
  getMessages(args: Record<string, string>) {
    const error = args.error || 'Unknown error'
    const feature = args.feature || 'general'

    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `I'm having an issue with @bsv/simple in the "${feature}" area.

Error/Problem: ${error}

Please:
1. Read the gotchas reference (simple://guide/gotchas resource) to check if this is a known issue
2. Read the relevant API reference for the feature area
3. Identify the likely cause based on common patterns
4. Suggest a fix with corrected code

Common causes to check:
- basket insertion vs wallet payment confusion
- PeerPayClient.acceptPayment() swallowing errors
- Missing changeBasket for change recovery
- result.tx being undefined
- Missing serverExternalPackages in next.config.ts
- Static vs dynamic imports for server code
- Overlay topic/service prefix requirements (tm_, ls_)
- FileRevocationStore used in browser context
- Server wallet not cached (re-initializing every request)`
        }
      }
    ]
  }
}
