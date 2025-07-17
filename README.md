# SinghDebit - Debit Card Portal

## Overview

SinghDebit is a client-side web application that simulates a banking portal for debit card management, developed by Singh Studios. The system allows users to check card balances, view transaction history, and provides admin functionality for managing cards and transactions. The application uses local storage for data persistence and implements a simple authentication system for admin access.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla HTML, CSS, and JavaScript
- **Client-Side Rendering**: All content is dynamically generated and managed through JavaScript
- **Local Storage**: Data persistence using browser's localStorage API
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

### Data Storage
- **Browser Local Storage**: Primary data storage for cards and transactions
- **In-Memory State**: Application state managed through JavaScript objects
- **No Backend**: Fully client-side application with no server dependencies

### Authentication System
- **Admin Authentication**: Simple username/password system stored in JavaScript constants
- **Session Management**: Basic session handling for admin access
- **No User Authentication**: Regular users access card information directly through card details

## Key Components

### 1. Navigation System
- **Purpose**: Provides navigation between different application pages
- **Implementation**: Button-based navigation with JavaScript page switching
- **Pages**: Home, Check Balance, Admin Login

### 2. Card Management
- **Balance Checking**: Users can check card balance by entering card number and expiration date
- **Card Creation**: Admin can create new debit cards with initial balances
- **Card Validation**: Basic validation for card number format and expiration dates

### 3. Transaction Management
- **Transaction Recording**: Admin can add transactions to existing cards
- **Transaction History**: Users can view transaction history for their cards
- **Balance Updates**: Automatic balance calculation based on transaction history

### 4. Admin Panel
- **Authentication**: Simple login system with hardcoded credentials
- **Card Management**: Create new cards, view all cards
- **Transaction Management**: Add transactions to existing cards
- **Data Overview**: View all cards and transactions in tabular format

## Data Flow

### User Flow
1. **Card Balance Check**: User enters card details → System validates → Displays balance and transactions
2. **Navigation**: User clicks navigation buttons → JavaScript switches page visibility
3. **Data Retrieval**: Application reads from localStorage → Processes data → Displays results

### Admin Flow
1. **Login**: Admin enters credentials → System validates → Grants access to admin panel
2. **Card Creation**: Admin fills form → System validates → Creates card → Saves to localStorage
3. **Transaction Addition**: Admin selects card → Enters transaction details → Updates card balance → Saves to localStorage

### Data Persistence
- **Save Operations**: All data changes immediately written to localStorage
- **Load Operations**: Data loaded from localStorage on page refresh
- **State Management**: In-memory objects synchronized with localStorage

## External Dependencies

### Fonts
- **Google Fonts**: Crimson Text and Inter font families for typography
- **Purpose**: Enhanced visual design and readability

### No Other Dependencies
- **Pure JavaScript**: No frameworks or libraries used
- **Native APIs**: Relies solely on browser APIs (localStorage, DOM manipulation)
- **Self-Contained**: All functionality implemented within the application

## Deployment Strategy

### Static Hosting
- **Hosting Type**: Can be deployed to any static hosting service
- **Files Required**: HTML, CSS, JavaScript files only
- **No Build Process**: Direct deployment of source files
- **No Server Requirements**: Client-side only application

### Browser Requirements
- **Modern Browser**: Requires support for ES6+ JavaScript features
- **Local Storage**: Must support localStorage API
- **CSS Grid/Flexbox**: For responsive layout

### Security Considerations
- **Client-Side Only**: All data stored in user's browser
- **No Server Communication**: No network requests or data transmission
- **Demo Purpose**: Hardcoded admin credentials suitable for demonstration only

## Key Design Decisions

### Local Storage Choice
- **Problem**: Need for data persistence without backend
- **Solution**: Browser localStorage for simple data storage
- **Rationale**: Simplifies deployment and eliminates server requirements
- **Limitation**: Data is device-specific and not shared across browsers

### Single Page Application
- **Problem**: Need for multiple views and navigation
- **Solution**: JavaScript-based page switching with show/hide functionality
- **Rationale**: Maintains fast navigation and simple deployment
- **Trade-off**: Limited SEO capabilities and browser history management

### Client-Side Authentication
- **Problem**: Need for admin access control
- **Solution**: Simple JavaScript-based authentication with hardcoded credentials
- **Rationale**: Sufficient for demo purposes and maintains simplicity
- **Security Note**: Not suitable for production use
