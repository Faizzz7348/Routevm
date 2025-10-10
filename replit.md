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
- **Current**: PostgreSQL database (Replit-provisioned) with Drizzle ORM
- **Schema**: Drizzle ORM with PostgreSQL schema definitions
- **Database Config**: Uses standard pg driver for Replit's PostgreSQL instance
- **Migration**: Drizzle Kit for database migrations and schema management

## Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic session middleware setup with connect-pg-simple
- **Security**: CORS configuration and request logging middleware

## External Dependencies
- **Database**: PostgreSQL with standard pg driver (Replit-provisioned instance)
- **Image Gallery**: LightGallery for image viewing with zoom and thumbnail plugins
- **Google Maps API**: Integration for toll price calculation using Routes API with vehicle-specific pricing
- **Fonts**: Google Fonts integration (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter)
- **Development**: Replit-specific plugins for runtime error handling and cartographer
- **Vite Configuration**: Configured for Replit proxy with 0.0.0.0:5000 binding and WSS HMR
- **UI Library**: Comprehensive Radix UI components for accessibility
- **Utilities**: Date-fns for date manipulation, clsx/class-variance-authority for styling

## Recent Changes

### October 8, 2025
- **Replit Environment Setup**: Successfully configured GitHub import for Replit deployment
  - Switched database driver from Neon websocket (@neondatabase/serverless) to standard pg driver for Replit PostgreSQL
  - Configured Vite for Replit proxy compatibility (host: 0.0.0.0, port: 5000, HMR with wss/443)
  - Fixed database initialization to use onConflictDoNothing() for idempotent QL Kitchen row insertion
  - Prevented duplicate sortOrder constraint violations that caused startup crashes
  - Updated .gitignore with proper Node.js patterns (dist, .env, logs, migrations)
  - Fixed calculateDistance function export in distance.ts utility
  - Configured deployment with autoscale target using npm build and start scripts
  - Development workflow running successfully on port 5000
  - Database schema successfully migrated using drizzle-kit push

### October 2, 2025
- **Per-User Layout Preferences**: Implemented browser-based user identification for individual layout settings
  - Each user gets their own layout preferences (column visibility, order, creator name/URL)
  - User identification uses localStorage with unique browser-based IDs
  - Backend validates userId on all layout API requests using Zod schema validation
  - Database schema updated with userId field and unique index for per-user records
  - Frontend gracefully handles new users with no saved layouts (404 responses)
  - Prevents cross-user data collisions with proper filtering and validation
- **Default Table Sorting by Code**: Table now sorts by code column by default
  - Rows are ordered numerically by code value (e.g., code 25 appears at position 25)
  - "No" column displays sequential numbers (1, 2, 3...) without gaps, even when codes have gaps
  - QL Kitchen row always stays at the top with infinity symbol (∞)
- **Editable No Column for Sorting**: Made the "No" column editable in edit mode for manual sort order control
  - Users can now click and edit the "No" value to set custom sort numbers
  - Works with filters - users can filter routes and then manually adjust the sort order
  - Table automatically resets to default sorting when filters are cleared
  - QL Kitchen row remains protected with infinity symbol (∞) and cannot be edited
  - Number input validation ensures only valid integers are accepted
- **AI Generator Row (Totals) Calculation**: Enhanced to calculate based on currently visible filtered/searched data
  - Totals row now dynamically calculates sums based on active filters and search results
  - When all routes are shown, calculates across all routes
  - When filters or search are applied, calculates only filtered/searched results
  - Added support for tollPrice column calculations in addition to tngRoute
  - Clear documentation in code explaining the filtered data calculation behavior
- **Safari/iPad Compatibility**: Removed all backdrop-blur effects from table headers
  - Table headers now use solid opaque backgrounds (white/dark slate) for reliable cross-browser rendering
  - Resolves rendering issues with backdrop-filter CSS property on Safari/iPad
- **Pagination Layout**: Fixed page number display to stay grouped with navigation buttons

### October 1, 2025
- **Multi-Page Carousel Feature**: Implemented sliding carousel for header content with left/right navigation
  - Users can now create, edit, and delete multiple pages with unique titles and descriptions
  - Carousel navigation with Previous/Next arrows (hidden when only one page exists)
  - Smooth transitions and premium blue gradient styling maintained
  - Automatic migration from old single title/description to page-based system
  - Comprehensive error handling with user-friendly toast notifications
  - Proper index management and bounds checking for edge cases
  - Pages stored in database with sortOrder for deterministic ordering
  - Add/Edit/Delete functionality accessible in edit mode with disabled states during operations

### September 30, 2025
- Enhanced Google Maps Routes API with lorry-optimized route calculation for both distance and toll prices
- Implemented `TRAFFIC_AWARE_OPTIMAL` routing preference for shortest road routes avoiding detours
- Added automatic distance (kilometer) calculation using lorry-specific vehicle parameters
- Route calculation now avoids ferries and optimizes for highways suitable for lorries
- Updated toll price calculation API to return both distance and toll data in single request
- Table header styling improved with premium blue colors (blue-600/blue-400) and 11px font size
- Added comprehensive mobile optimizations with responsive font sizes and touch-friendly interfaces
- Vehicle specifications: diesel lorry, class 1 toll pricing, optimized for shortest practical routes