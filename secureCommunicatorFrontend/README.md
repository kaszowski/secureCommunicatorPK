# Secure Communicator Frontend 🔒

A modern React frontend application for secure communication built with React Router, TypeScript, and Material-UI following atomic design principles.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended: Node 22 with Volta)
- npm or yarn

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## 📂 Project Structure

This project follows **Atomic Design** principles for component organization:

```
secureCommunicatorFrontend/
├── app/                          # Main application code
│   ├── app.css                   # Global styles
│   ├── root.tsx                  # Root component
│   ├── routes.ts                 # Route definitions
│   ├── components/               # Component library (Atomic Design)
│   │   ├── atoms/               # Basic building blocks
│   │   │   ├── Button/          # Button component
│   │   │   └── Input/           # Input component
│   │   ├── molecules/           # Combinations of atoms
│   │   ├── organisms/           # Complex UI components
│   │   └── templates/           # Page-level layout components
│   └── routes/                  # Page components
│       └── LoginPage.tsx        # Login page
├── tests/                       # Test files
│   └── components/              # Component tests
│       ├── Button.test.tsx      # Button component tests
│       └── Input.test.tsx       # Input component tests
├── types/                       # TypeScript type definitions
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite bundler configuration
├── vitest.config.ts            # Testing configuration
└── react-router.config.ts      # React Router configuration
```

### Component Architecture (Atomic Design)

- **Atoms** (`components/atoms/`): Basic UI elements (Button, Input, etc.)
- **Molecules** (`components/molecules/`): Simple combinations of atoms
- **Organisms** (`components/organisms/`): Complex UI sections
- **Templates** (`components/templates/`): Page layouts and wireframes
- **Pages** (`routes/`): Actual pages that use templates

## 🧪 Testing

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run specific test file:
```bash
npm test Button.test.tsx
```

### Test Structure

- Tests are located in the `tests/` directory
- Component tests follow the naming convention: `ComponentName.test.tsx`
- Uses Vitest as the test runner with React Testing Library
- Current test coverage includes:
  - Button component: 6 test cases (variants, colors, events, validation)
  - Input component: 5 test cases (variants, controlled state, validation)

## 🏗️ Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🐳 Docker Deployment

Build the Docker image:
```bash
docker build -t secure-communicator-frontend .
```

Run the container:
```bash
docker run -p 3000:3000 secure-communicator-frontend
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

## 🎨 Styling & UI

- **Material-UI (MUI)**: Primary UI component library
- **CSS-in-JS**: Styling with MUI's `sx` prop system
- **Responsive Design**: Mobile-first approach
- **Theme Support**: Customizable Material-UI theme

### Key UI Components

- `Button`: Customizable button with Material-UI variants
- `Input`: Form input component with validation support
- `LoginPage`: Secure login form with validation

## 🔧 Development Guidelines

### Component Creation

1. **Atoms**: Create basic components in `app/components/atoms/`
2. **Molecules**: Combine atoms in `app/components/molecules/`
3. **Testing**: Add corresponding test files in `tests/components/`
4. **TypeScript**: All components must be fully typed

### Code Style

- Use TypeScript for all components
- Follow React functional component patterns
- Use React hooks for state management
- Implement proper prop interfaces
- Add JSDoc comments for complex functions

### Testing Standards

- Write tests for all components
- Test user interactions and state changes
- Verify accessibility and proper rendering
- Maintain high test coverage

## 🔒 Security Features

- **Type Safety**: Full TypeScript implementation
- **Input Validation**: Form validation with Material-UI
- **Secure Routing**: Protected routes for authenticated users
- **CSP Ready**: Content Security Policy compatible build

## 📚 Tech Stack

- **React 18+**: Modern React with hooks
- **React Router**: Client-side routing
- **TypeScript**: Type-safe development
- **Material-UI (MUI)**: Component library
- **Vite**: Fast build tool and dev server
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Testing utilities
- **ESLint**: Code linting and formatting

## 🤝 Contributing

1. Follow the atomic design structure
2. Write comprehensive tests for new components
3. Use TypeScript for all new code
4. Follow the existing code style and patterns
5. Update documentation for new features
