# Career Search AI

An AI-powered career guidance platform that provides personalized insights, practical guides, and alternative perspectives for career-related questions.

## Features

- 🤖 AI-powered career insights using GPT-4
- 🔍 Real-time search results integration with SerpAPI
- 💡 Three types of insights for each query:
  - Practical Guides: Step-by-step actionable advice
  - Theoretical Insights: Broader industry perspectives
  - Contradictory Takes: Alternative viewpoints
- 🎨 Modern, responsive UI with dark mode support
- ⌨️ Keyboard shortcuts for power users
- 📱 Mobile-friendly design
- 🔄 Search history with favorites
- 📊 Basic analytics tracking

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- OpenAI API
- SerpAPI
- React Hot Toast

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/career-search-ai.git
   cd career-search-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SERP_API_KEY=your_serpapi_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (get it from [OpenAI Platform](https://platform.openai.com/api-keys))
- `SERP_API_KEY`: Your SerpAPI key (get it from [SerpAPI](https://serpapi.com/))

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for GPT-4 API
- SerpAPI for search results
- Next.js team for the amazing framework
- All contributors and users of the project
