export const integratePrompt = {
  name: 'integrate_simplifier',
  description: 'Walk through adding @bsv/simplifier to a project. Asks about framework, features needed, and generates complete setup.',
  arguments: [
    {
      name: 'framework',
      description: 'Target framework: nextjs, react, or vanilla',
      required: false
    },
    {
      name: 'features',
      description: 'Comma-separated features: payments, tokens, inscriptions, messagebox, certification, did, credentials, overlay, server-wallet',
      required: false
    }
  ],
  getMessages(args: Record<string, string>) {
    const framework = args.framework || 'nextjs'
    const features = args.features ? args.features.split(',').map(f => f.trim()) : ['payments']

    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `I want to integrate @bsv/simplifier into my ${framework} project. I need these features: ${features.join(', ')}.

Please help me:
1. Set up the project configuration (next.config.ts if Next.js, package.json dependencies)
2. Create wallet initialization code (browser wallet for client, server wallet if needed)
3. Generate handler functions for each feature I listed
4. Show me the critical gotchas I should watch out for

Use the MCP resources and tools to generate the code. Start with scaffold_nextjs_config, then generate_wallet_setup, then the feature-specific generators.`
        }
      }
    ]
  }
}
