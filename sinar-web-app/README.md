# SINAR Web App

Modern, responsive web application built with SvelteKit and TypeScript featuring glassmorphism design, interactive animations, and modular architecture.

![SINAR Logo](static/assets/logo.png)

## 🚀 Features

- **Modern UI/UX**: Glassmorphism design with interactive mouse-following light gradients
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript support with strict configurations
- **Modular Architecture**: Component-based structure for scalability
- **Interactive Animations**: CSS animations and real-time mouse tracking effects
- **Hot Reload**: Fast development with Vite HMR
- **Code Quality**: ESLint, Prettier, and Svelte Check integration

## 🛠️ Tech Stack

### Core Framework
- **[SvelteKit](https://kit.svelte.dev/)** `^2.26.0` - Full-stack framework
- **[Svelte 5](https://svelte.dev/)** `^5.36.16` - Reactive UI framework with latest features
- **[TypeScript](https://www.typescriptlang.org/)** `^5.8.3` - Type safety and enhanced DX
- **[Vite](https://vitejs.dev/)** `^7.0.6` - Fast build tool and dev server

### Styling & UI
- **[Tailwind CSS](https://tailwindcss.com/)** `^3.4.17` - Utility-first CSS framework
- **[PostCSS](https://postcss.org/)** `^8.5.6` - CSS post-processing
- **[Lucide Svelte](https://lucide.dev/)** `^0.525.0` - Beautiful SVG icons
- **[Tailwind Merge](https://github.com/dcastil/tailwind-merge)** `^3.3.1` - Conditional class merging
- **[clsx](https://github.com/lukeed/clsx)** `^2.1.1` - Class name utility

### Development Tools
- **[ESLint](https://eslint.org/)** `^9.31.0` - Code linting
- **[Prettier](https://prettier.io/)** `^3.6.2` - Code formatting
- **[Svelte Check](https://github.com/sveltejs/language-tools)** `^4.3.0` - Type checking for Svelte

### Package Manager
- **[pnpm](https://pnpm.io/)** `10.13.1` - Fast, disk space efficient package manager

## 📁 Project Structure

```
sinar-web-app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── LoginForm.svelte       # Reusable login form component
│   │   │   ├── layout/
│   │   │   │   ├── AuthLayout.svelte      # Authentication pages layout
│   │   │   │   ├── Footer.svelte          # App footer component
│   │   │   │   ├── Header.svelte          # App header/navigation
│   │   │   │   └── MainLayout.svelte      # Main app layout wrapper
│   │   │   └── ui/
│   │   │       ├── button.svelte          # Reusable button component
│   │   │       ├── card.svelte            # Card container component
│   │   │       ├── input.svelte           # Form input component
│   │   │       └── label.svelte           # Form label component
│   │   ├── index.ts                       # Component exports
│   │   └── utils.ts                       # Utility functions
│   ├── routes/
│   │   ├── login/
│   │   │   └── +page.svelte               # Login page
│   │   ├── +layout.svelte                 # Root layout
│   │   └── +page.svelte                   # Home page
│   ├── app.css                            # Global styles with Tailwind
│   ├── app.d.ts                           # TypeScript declarations
│   └── app.html                           # HTML template
├── static/
│   ├── assets/
│   │   └── logo.png                       # SINAR brand logo
│   ├── favicon.png                        # Favicon (PNG fallback)
│   └── favicon.svg                        # Favicon (SVG, scalable)
├── .vscode/
│   └── settings.json                      # VS Code TypeScript settings
├── postcss.config.js                     # PostCSS configuration
├── svelte.config.js                      # SvelteKit configuration
├── tailwind.config.ts                    # Tailwind CSS configuration
├── tsconfig.json                         # TypeScript configuration
├── tsconfig.node.json                    # Node.js TypeScript config
├── vite.config.ts                        # Vite build configuration
└── package.json                          # Dependencies and scripts
```

## 🎨 Design Features

### Glassmorphism UI
- Semi-transparent components with backdrop blur effects
- Multi-layer shadows for 3D depth perception
- Interactive glass elements with hover states

### Interactive Lighting
- Real-time mouse tracking light gradients
- Dynamic dark overlay creating spotlight effect
- Multiple gradient layers with different animation speeds
- Smooth transitions with linear easing for responsiveness

### Responsive Layout
- Mobile-first design approach
- Split-screen layout for desktop (form + branding)
- Adaptive typography and spacing
- Touch-friendly interactive elements

## 🚦 Getting Started

### Prerequisites
- Node.js 18.x or higher
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sinar-web-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build production-ready application |
| `pnpm preview` | Preview production build locally |
| `pnpm check` | Run Svelte type checking |
| `pnpm check:watch` | Run type checking in watch mode |
| `pnpm lint` | Lint code with ESLint |
| `pnpm format` | Format code with Prettier |

## 🏗️ Architecture

### Component Philosophy
- **Modular Design**: Each component has a single responsibility
- **Reusability**: Components are designed to be used across different pages
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Accessibility**: Semantic HTML and ARIA attributes

### Layout System
- **AuthLayout**: For authentication pages (login, register) with split-screen design
- **MainLayout**: For main application pages with header/footer
- **Flexible**: Easy to add new layout types for different page categories

### State Management
- **Svelte 5 Runes**: Using modern `$state()` and `$props()` syntax
- **Component-level**: State managed at component level for simplicity
- **Reactive**: Automatic UI updates with Svelte's reactivity

## 🎯 Key Pages

### Home Page (`/`)
- Hero section with gradient background
- Feature showcase with icons
- Call-to-action buttons
- Full MainLayout with header/footer

### Login Page (`/login`)
- Glassmorphism card design
- Interactive mouse-tracking lighting effects
- Form validation and accessibility
- Split-screen layout with SINAR branding
- Responsive design for all devices

## 🔧 Configuration

### TypeScript
- Strict mode enabled for enhanced type safety
- Path aliases configured (`@/*` for `src/*`)
- Svelte-specific type checking with svelte-check

### Tailwind CSS
- Custom color palette matching brand identity
- CSS custom properties for dynamic theming
- Responsive breakpoints optimized for modern devices
- Typography and spacing scales

### VS Code Integration
- Automatic import suggestions
- TypeScript IntelliSense optimization
- Path mapping for better developer experience

## 🚀 Deployment

### Build for Production
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

The application can be deployed to any static hosting service like:
- Vercel (recommended for SvelteKit)
- Netlify
- GitHub Pages
- Firebase Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🏢 About SINAR

**SINAR (Sinergi Narasi)** - Building the future with modern web technologies. Clean, fast, and beautiful applications for everyone.

---

Built with ❤️ using SvelteKit, TypeScript, and Tailwind CSS