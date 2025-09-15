# Overview

This is a full-stack web application for managing table data with a drag-and-drop interface. The application serves as a data management system where users can create, edit, and organize table rows and columns with support for different data types including text, numbers, currency, and images. The system provides real-time statistics, image galleries with lightbox functionality, and comprehensive CRUD operations for both table structure and content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation
- **Drag & Drop**: @hello-pangea/dnd for reordering table rows and columns

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with standard HTTP methods
- **Validation**: Zod schemas for request/response validation
- **Storage**: In-memory storage with interface abstraction for future database integration
- **Development**: Hot reload with Vite integration in development mode

## Data Storage Solutions
- **Current**: In-memory storage using JavaScript Maps for development
- **Schema**: Drizzle ORM with PostgreSQL schema definitions
- **Database Config**: Configured for Neon Database (serverless PostgreSQL)
- **Migration**: Drizzle Kit for database migrations and schema management

## Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic session middleware setup with connect-pg-simple
- **Security**: CORS configuration and request logging middleware

## External Dependencies
- **Database**: Neon Database (@neondatabase/serverless) for PostgreSQL hosting
- **Image Gallery**: LightGallery for image viewing with zoom and thumbnail plugins
- **Fonts**: Google Fonts integration (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter)
- **Development**: Replit-specific plugins for runtime error handling and cartographer
- **UI Library**: Comprehensive Radix UI components for accessibility
- **Utilities**: Date-fns for date manipulation, clsx/class-variance-authority for styling