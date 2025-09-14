# Attendance Management System

## Overview

This is a comprehensive attendance management system built for educational institutions. The application enables tracking student and staff attendance through QR code scanning, manual entry, and comprehensive reporting. It features a modern React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and Drizzle ORM for database operations.

The system supports multiple user roles (students and staff), class management, real-time attendance tracking, ID card generation, and detailed analytics. The interface is built with shadcn/ui components following Material Design principles for a clean, data-focused user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system supporting light/dark themes
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Design System**: Material Design-inspired with custom color palette and spacing units

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Build System**: esbuild for production bundling

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database serverless platform
- **ORM**: Drizzle ORM with schema-first approach and automatic type generation
- **Connection Pooling**: @neondatabase/serverless with WebSocket support
- **Migrations**: Drizzle Kit for schema migrations and database management

### Key Features & Components
- **QR Code System**: Generation and scanning for contactless attendance tracking
- **User Management**: Student and staff profiles with role-based permissions
- **Class Management**: Course creation, enrollment tracking, and schedule management
- **Attendance Tracking**: Multiple status types (present, absent, tardy, excused)
- **Analytics Dashboard**: Real-time statistics and pie charts using Recharts
- **ID Card Generation**: Printable ID cards with QR codes using html2canvas and jsPDF
- **Responsive Design**: Mobile-first approach with collapsible sidebar navigation

### Authentication & Authorization
- **Session-based Authentication**: Server-side sessions stored in PostgreSQL
- **Role-based Access**: Student and staff roles with different permission levels
- **Security**: CSRF protection and secure session management

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection and serverless compatibility
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **express**: Web application framework for API routes
- **react**: Frontend UI library with hooks and modern patterns
- **@tanstack/react-query**: Server state management and caching

### UI & Design Libraries
- **@radix-ui/***: Accessible UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for components
- **lucide-react**: Icon library with consistent design

### Specialized Features
- **qrcode**: QR code generation for ID cards and attendance tracking
- **react-webcam**: Camera access for QR code scanning
- **qr-scanner**: QR code detection and parsing
- **recharts**: Data visualization library for attendance analytics
- **html2canvas & jspdf**: PDF generation for ID card printing
- **react-hook-form**: Form validation and state management
- **zod**: Schema validation for forms and API data

### Development & Build Tools
- **vite**: Frontend build tool and development server
- **typescript**: Static type checking across the application
- **drizzle-kit**: Database migration and schema management
- **@replit/vite-plugin-***: Replit-specific development tools and error handling