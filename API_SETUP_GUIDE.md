# API Setup Guide for PlanAI

## 🚨 Critical: AI Functionality Not Working

The AI functionality is currently not working because the required API keys are missing. Follow this guide to fix it.

## Required API Keys

### 1. OpenAI API Key (Primary)
- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Add to your `.env` file: `OPENAI_API_KEY=sk-your-key-here`

### 2. Anthropic API Key (Fallback)
- Go to [Anthropic Console](https://console.anthropic.com/)
- Create a new API key
- Add to your `.env` file: `ANTHROPIC_API_KEY=sk-ant-your-key-here`

## Setup Steps

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` and add your API keys:**
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=sk-your-openai-key-here
   
   # Anthropic Configuration (fallback)
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   
   # Keep existing Supabase config
   NEXT_PUBLIC_SUPABASE_URL=https://wjzmscsoiibzlxejqpgg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Testing

1. Go to `/dashboard/create-plan`
2. Try sending a message to the AI
3. Check browser console for any errors
4. Check server logs for API connection issues

## Cost Considerations

- **OpenAI GPT-4**: ~$0.03 per 1K tokens
- **Anthropic Claude**: ~$0.015 per 1K tokens
- Set usage limits in your API provider dashboards

## Troubleshooting

### Common Issues:

1. **"OpenAI API key không được cấu hình"**
   - Check if `OPENAI_API_KEY` is in your `.env.local`
   - Restart the server after adding keys

2. **"Không thể kết nối với cả OpenAI và Claude"**
   - Both API keys are missing or invalid
   - Check API key format and permissions

3. **Rate limiting errors**
   - You've exceeded API quotas
   - Check usage in provider dashboards

### Debug Mode:

Enable detailed logging by adding to `.env.local`:
```env
NODE_ENV=development
DEBUG=true
```

## Security Notes

- Never commit API keys to git
- Use `.env.local` for local development
- Use environment variables in production
- Rotate keys regularly
