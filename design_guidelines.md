# Design Guidelines: Attendance Management System

## Design Approach
**System-Based Approach**: Following Material Design principles for data-heavy enterprise applications, with inspiration from Notion and Airtable's clean data organization patterns.

## Core Design Elements

### A. Color Palette
**Light Mode:**
- Primary: `218 69% 59%` (Professional Blue #2563EB)
- Secondary: `158 64% 52%` (Success Green #10B981) 
- Accent: `38 92% 50%` (Warning Amber #F59E0B)
- Background: `210 40% 98%` (Light Grey #F8FAFC)
- Text: `215 25% 27%` (Slate Grey #1E293B)
- Error: `0 84% 60%` (Red #EF4444)

**Dark Mode:**
- Primary: `217 91% 60%` (Brightened blue for contrast)
- Secondary: `158 64% 52%` (Maintained green)
- Accent: `38 92% 50%` (Maintained amber)
- Background: `222 84% 5%` (Dark slate)
- Surface: `215 28% 17%` (Elevated dark surface)
- Text: `210 40% 98%` (Light text)

### B. Typography
- **Primary Font**: Inter (Google Fonts CDN)
- **Display Font**: SF Pro Display fallback to Inter
- **Hierarchy**: 
  - Display: 2.25rem (36px) semibold
  - H1: 1.875rem (30px) semibold  
  - H2: 1.5rem (24px) medium
  - H3: 1.25rem (20px) medium
  - Body: 1rem (16px) regular
  - Caption: 0.875rem (14px) regular

### C. Layout System
**Spacing Units**: Consistent use of Tailwind units 2, 4, 8, 12, and 16
- Micro spacing: `p-2, m-2` (8px)
- Standard spacing: `p-4, m-4` (16px) 
- Section spacing: `p-8, m-8` (32px)
- Large spacing: `p-12, m-12` (48px)
- Extra large: `p-16, m-16` (64px)

### D. Component Library

**Navigation:**
- Sidebar navigation with collapsible sections
- Clean icons from Heroicons (CDN)
- Active states with subtle background highlighting

**Data Display:**
- Card-based layout with subtle shadows (`shadow-sm`)
- Clean table designs with alternating row colors
- Status badges with color-coded states (present/absent/tardy)

**Forms:**
- Consistent input styling with focus states
- File upload areas for photos with drag-and-drop
- Toggle switches for settings and preferences

**ID Cards:**
- Professional template with company logo placement
- QR code positioned bottom-right
- Clean typography hierarchy with user photo top-left
- Print-optimized styling

**Dashboard Elements:**
- Statistics cards with large numbers and trend indicators
- Simple bar/line charts for attendance analytics
- Quick action buttons with primary color scheme

### E. Key Interactions
- QR code scanning interface with camera viewfinder overlay
- Smooth transitions between list and detail views
- Hover states on interactive elements with subtle color shifts
- Loading states for data imports and processing

## Images
No large hero images required. System focuses on functional imagery:
- **User Profile Photos**: Circular avatars (64px standard, 128px for ID cards)
- **Company Logo**: Flexible sizing for ID cards and navigation
- **QR Code Graphics**: Generated programmatically, black on white background
- **Empty State Illustrations**: Simple line-art style for empty lists/tables

## Professional Enterprise Aesthetic
The design emphasizes clarity, efficiency, and trustworthiness suitable for educational and corporate environments. Clean lines, generous whitespace, and consistent component patterns create a professional atmosphere while maintaining usability across desktop and mobile devices.