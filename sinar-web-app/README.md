# SINAR Web Application

A modern document management system built with SvelteKit, TypeScript, and Tailwind CSS featuring role-based access control, document management, and comprehensive admin tools.

![SINAR Logo](static/assets/logo.png)

## 🚀 Tech Stack

- **Frontend Framework**: [SvelteKit](https://kit.svelte.dev/) v2.26.0
- **Language**: [TypeScript](https://www.typescriptlang.org/) v5.8.3
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v3.4.17
- **Build Tool**: [Vite](https://vitejs.dev/) v7.0.6
- **Package Manager**: [pnpm](https://pnpm.io/) v10.13.1
- **Runtime**: Node.js v24+

## 📁 Project Structure

```
sinar-web-app/
├── src/
│   ├── lib/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── admin/           # Admin-specific components
│   │   │   │   ├── categories/  # Category management
│   │   │   │   ├── documents/   # Document management
│   │   │   │   └── users/       # User management
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── dashboard/       # Dashboard layout & widgets
│   │   │   ├── layout/          # Layout components
│   │   │   ├── ui/              # Base UI components
│   │   │   └── user/            # User-specific components
│   │   │       ├── categories/  # User category views
│   │   │       ├── documents/   # User document views
│   │   │       └── reports/     # User reports (coming soon)
│   │   ├── services/            # API services
│   │   │   ├── api/             # HTTP client configuration
│   │   │   ├── auth/            # Authentication services
│   │   │   ├── categories/      # Category services
│   │   │   ├── documents/       # Document services
│   │   │   └── users/           # User services
│   │   ├── stores/              # Svelte stores for state management
│   │   └── utils/               # Utility functions
│   │       └── table/           # Table-related utilities
│   ├── routes/                  # SvelteKit file-based routing
│   │   ├── admin/               # Admin routes
│   │   │   ├── categories/      # Category management pages
│   │   │   ├── documents/       # Document management pages
│   │   │   ├── master/          # Master data management
│   │   │   └── users/           # User management pages
│   │   ├── user/                # User routes
│   │   │   ├── categories/      # User category views
│   │   │   ├── documents/       # User document views
│   │   │   └── reports/         # User reports
│   │   ├── home/                # Home page
│   │   └── login/               # Authentication
│   ├── app.html                 # Main HTML template
│   ├── app.css                  # Global styles & Tailwind imports
│   ├── app.d.ts                 # Global type definitions
│   └── vite-env.d.ts           # Vite environment types
├── static/                      # Static assets
│   ├── assets/
│   │   └── logo.png
│   ├── favicon.png
│   └── favicon.svg
├── package.json                 # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── svelte.config.js            # SvelteKit configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── postcss.config.js           # PostCSS configuration
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000

# Development Server
VITE_PORT=5173
VITE_HOST=localhost

# Application Info
VITE_APP_NAME=SINAR Web Application
VITE_APP_VERSION=1.0.0

# Development Options
VITE_ENABLE_DEBUG=false
VITE_BUILD_TARGET=es2022
VITE_SOURCEMAP=false
```

### Build Configuration

- **Target**: ES2022 for modern browser support
- **TypeScript**: Strict mode with comprehensive type checking
- **Bundler**: Uses Vite's optimized bundling
- **Path Aliases**: `@` points to `./src` directory

## 🛠️ Development

### Prerequisites

- Node.js v24+
- pnpm v10.13.1+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sinar-web-app

# Install dependencies
pnpm install
```

### Available Scripts

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check

# Type checking with watch mode
pnpm check:watch

# Linting
pnpm lint

# Code formatting
pnpm format
```

## 🏗️ Build & Deployment

### Production Build

```bash
pnpm build
```

The build output will be in the `.svelte-kit/output` directory.

### Docker Deployment

#### Build Docker Image

```bash
docker build -t sinar-web-app .
```

#### Run with Docker Compose

```bash
docker-compose up -d
```

The application will be available at `http://localhost:4173`.

## 🔧 Features

### Authentication
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure login/logout functionality

### Admin Panel
- **User Management**: CRUD operations for user accounts
- **Document Management**: Upload, download, and organize documents
- **Category Management**: Create and manage document categories
- **Master Data**: Centralized data management

### User Interface
- **Document Browser**: View and download available documents
- **Category Explorer**: Browse documents by categories
- **Reports**: Analytics and insights (coming soon)

### UI/UX
- Responsive design with Tailwind CSS
- Modern component library
- Dark/light theme support
- Toast notifications and modals
- Loading states and error handling

## 🎨 Styling

### Tailwind CSS Setup
- Custom design system with CSS variables
- Semantic color tokens
- Typography and spacing scales
- Component variants and utilities

### Design Tokens
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96%;
  /* ... more tokens */
}
```

## 🔌 API Integration

### HTTP Client
- Axios-based HTTP client with interceptors
- Automatic token management
- Request/response transformation
- Error handling

### Services Structure
- **AuthService**: Authentication operations
- **UserService**: User management
- **DocumentService**: Document operations
- **CategoryService**: Category management

## 📱 Responsive Design

- Mobile-first approach
- Breakpoint-based responsive components
- Touch-friendly interactions
- Optimized for tablets and desktops

## 🧪 Development Tools

### Code Quality
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Svelte Check**: Svelte-specific type checking

### Build Tools
- **Vite**: Fast development and building
- **PostCSS**: CSS processing with Autoprefixer
- **Tailwind JIT**: Just-in-time CSS compilation

## 🐳 Docker Configuration

The application includes Docker support for containerized deployment:

- **Dockerfile**: Multi-stage build for optimized production images
- **docker-compose.yml**: Complete application stack
- **.dockerignore**: Optimized build context

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team.

---

Built with ❤️ using modern web technologies.