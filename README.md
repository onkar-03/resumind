# Resumind

<div align="center">
  <img src="/public/docs/images/resumind-hero.png" alt="Resumind - AI Resume Analyzer" />
  
  <p align="center">
    <strong>An intelligent resume analysis platform that leverages AI to provide comprehensive feedback, ATS scoring, and optimization suggestions for resumes.</strong>
  </p>
  
  <p align="center">
    <a href="https://getresumind.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-blue?style=for-the-badge&logoColor=white" alt="Live Demo" />
    </a>
    <a href="https://github.com/onkar-03/resumind" target="_blank">
      <img src="https://img.shields.io/badge/📂_Repository-View_Code-green?style=for-the-badge&logoColor=white" alt="Repository" />
    </a>
  </p>
</div>

## ✨ Features

- **AI-Powered Analysis**: Advanced natural language processing to analyze resume content
- **Comprehensive Scoring**: Multi-dimensional scoring system covering various aspects
- **Smart Recommendations**: Personalized suggestions for resume improvement
- **Industry-Specific Insights**: Tailored feedback based on target industry
- **ATS Compatibility Check**: Ensures resumes are ATS-friendly
- **Real-time Preview**: Live preview of resume changes and improvements
- **Export Options**: Download optimized resumes in multiple formats

## 🚀 Tech Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **AI/ML**: OpenAI GPT API, Natural Language Processing
- **Database**: MongoDB
- **Authentication**: JWT
- **File Processing**: PDF parsing, Document analysis
- **Deployment**: Docker, AWS/Vercel

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- npm or yarn
- MongoDB database
- OpenAI API key

## ⚙️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ai-resume-analyzer.git
   cd ai-resume-analyzer
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies (if separate)
   cd client && npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/ai-resume-analyzer

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key_here

   # JWT
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d

   # Server
   PORT=5000
   NODE_ENV=development

   # Frontend URL (for CORS)
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🖥️ Usage

1. **Upload Resume**: Upload your resume in PDF or DOCX format
2. **AI Analysis**: The system analyzes your resume using advanced AI algorithms
3. **Get Insights**: Receive detailed feedback on:
   - Content quality and relevance
   - Formatting and structure
   - ATS compatibility
   - Industry-specific recommendations
4. **Optimize**: Apply suggested improvements
5. **Download**: Export your optimized resume

### Development Guidelines

- Follow ESLint and Prettier configurations
- Write unit tests for new features
- Update documentation for API changes
- Use conventional commit messages

---

⭐ **Star this repository if you find it helpful!**

Made with ❤️ by [Your Name](https://github.com/yourusername)
