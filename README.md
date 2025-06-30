# EverBloom - AI-Powered Relationship Nurturer

EverBloom is a beautiful, AI-powered relationship management application that helps you nurture meaningful connections with personalized suggestions, reminders, and insights.

## ✨ Features

- **AI-Powered Insights**: Get personalized suggestions to strengthen your relationships
- **Relationship Tracking**: Monitor connection strength and interaction history
- **Smart Reminders**: Never miss important dates or forget to reach out
- **Message Crafting**: AI-assisted message composition for meaningful communication
- **Gift Suggestions**: Personalized gift ideas based on preferences and occasions
- **Activity Planning**: Discover meaningful activities to share with loved ones
- **Beautiful 3D Interface**: Immersive Spline 3D scenes for an engaging experience

## 🚀 Live Demo

Visit the live application: [EverBloom on Netlify](https://wondrous-parfait-be4b74.netlify.app)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **3D Graphics**: Spline 3D scenes
- **Backend**: Supabase (Database, Authentication, Real-time)
- **AI**: OpenRouter API integration
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/everbloom.git
cd everbloom
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

4. Set up the database:
- Create a new Supabase project
- Run the migration files in the `supabase/migrations` folder
- Enable Row Level Security (RLS) on all tables

5. Start the development server:
```bash
npm run dev
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User profiles with subscription status and preferences
- **relationships**: User's relationships with detailed preferences and metadata
- **interaction_logs**: History of all interactions and communications
- **ai_suggestions**: AI-generated suggestions with feedback tracking

## 🎨 Design Philosophy

EverBloom follows a "love theme" design with:
- Soft, warm color palette (pinks, lavenders, creams)
- Transparent text effects that reveal 3D scenes
- Smooth animations and micro-interactions
- Apple-level design aesthetics with attention to detail
- Responsive design for all devices

## 🔐 Security

- Row Level Security (RLS) enabled on all database tables
- User authentication through Supabase Auth
- API keys secured through environment variables
- Data encryption at rest and in transit

## 🚀 Deployment

The application is automatically deployed to Netlify. To deploy your own instance:

1. Fork this repository
2. Connect your GitHub repository to Netlify
3. Set up environment variables in Netlify dashboard
4. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spline for the beautiful 3D scenes
- Supabase for the backend infrastructure
- OpenRouter for AI capabilities
- The React and TypeScript communities

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact us at support@everbloom.app

---

Made with 💖 by the EverBloom team