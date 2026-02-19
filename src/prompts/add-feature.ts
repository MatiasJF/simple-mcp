export const addFeaturePrompt = {
  name: 'add_bsv_feature',
  description: 'Generate code for adding a specific BSV feature (payments, tokens, messagebox, etc.) to an existing project.',
  arguments: [
    {
      name: 'feature',
      description: 'The feature to add: payments, tokens, inscriptions, messagebox, certification, did, credentials, overlay, server-wallet',
      required: true
    },
    {
      name: 'framework',
      description: 'Target framework: nextjs, react, or vanilla',
      required: false
    }
  ],
  getMessages(args: Record<string, string>) {
    const feature = args.feature || 'payments'
    const framework = args.framework || 'nextjs'

    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `I have an existing ${framework} project with @bsv/simple already set up. I want to add the "${feature}" feature.

Please:
1. Read the relevant API reference for this feature (use the simple://api/${feature} resource)
2. Generate the implementation code using the appropriate tool
3. Show me any gotchas specific to this feature
4. Provide a complete, working code example I can drop into my project

Assume I already have a wallet instance available. Generate production-ready TypeScript code.`
        }
      }
    ]
  }
}
