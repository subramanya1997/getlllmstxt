# GetLLMsTxt

GetLLMsTxt simplifies complex websites into concise, plain text tailored for large language models. By removing ads, navigation, and unnecessary code, it extracts key information into a streamlined format.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Supabase

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/getlllmstxt.git
cd getlllmstxt
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Clean text extraction from web pages
- Remove unnecessary elements (ads, navigation, etc.)
- Format content for optimal LLM consumption
- Modern UI with Shadcn components
- Real-time processing with Supabase

## Development

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling
- Shadcn UI for component library
