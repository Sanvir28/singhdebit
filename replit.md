# SinghDebit - Debit Card Portal

## Overview

SinghDebit is a client-side web application that provides a digital banking portal for debit card management, developed by Singh Studios. The system allows users to check card balances, view transaction history, transfer and withdraw money, and provides admin functionality for card and transaction management. The application uses localStorage for data persistence and Firebase for Google Sign-In authentication, designed for GitHub Pages deployment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla HTML, CSS, and JavaScript
- **Client-Side Rendering**: All content is dynamically generated and managed through JavaScript
- **Page-Based Navigation**: Simple navigation system with JavaScript-powered page switching
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox layouts

### Backend Architecture
- **Firebase Integration**: Firebase v12.0.0 for Google Sign-In authentication only
- **Client-Side Storage**: localStorage for all data persistence (cards, transactions, admin)
- **Serverless Architecture**: No traditional backend server required, works with GitHub Pages
- **Authentication Only**: Firebase used solely for Google OAuth, not for data storage

### Data Storage Solutions
- **Primary Storage**: localStorage with three main data structures:
  - `cards`: Stores debit card information and balances
  - `transactions`: Stores transaction history linked to cards
  - `admin`: Stores admin-related data and configurations
- **No Migration Required**: All data persists in localStorage for simplicity
- **GitHub Pages Compatible**: No server-side dependencies or database requirements

## Key Components

### 1. Authentication System
- **Admin Authentication**: Simple username/password system with hardcoded credentials
- **Google Sign-In**: Firebase OAuth integration for user authentication
- **Dual User Access**: Users can login with Google or card details (legacy support)
- **Session Management**: Basic session handling for admin access and Google authentication
- **Security**: Admin credentials stored in JavaScript constants (username: 'admin', password: 'singhdebit2025')

### 2. Card Management System
- **Card Creation**: Admin can create new debit cards with initial balances
- **Balance Checking**: Users can check card balance by entering card number and expiration date
- **Card Validation**: Input validation for card number format and expiration dates
- **Real-time Updates**: Automatic balance updates when transactions are added

### 3. Transaction Management
- **Transaction Recording**: Admin can add transactions to existing cards
- **Transaction History**: Users can view complete transaction history for their cards
- **Balance Calculation**: Automatic balance updates based on transaction history
- **Date Handling**: Transaction dates with proper formatting and validation

### 4. User Interface Components
- **Navigation System**: Button-based navigation between Home, Check Balance, and Admin pages
- **Google Sign-In Button**: Styled OAuth button with Google branding and divider design
- **Loading States**: Visual feedback during Firebase operations with loading overlays
- **Form Handling**: Multiple forms for card creation, transaction entry, admin login, and user authentication
- **Data Tables**: Admin interface displays cards and transactions in tabular format
- **Modal Popouts**: Interactive card and transaction detail modals with smooth animations
- **Clickable Elements**: Cards and transactions are clickable to show detailed information
- **Card Selection**: Dynamic dropdowns for Google users to select cards for transfers and withdrawals

## Data Flow

### User Flow
1. **Welcome Page**: Users land on the homepage with feature overview
2. **Balance Check**: Users enter card details to view balance and transaction history
3. **Admin Access**: Administrators log in to manage cards and transactions

### Admin Flow
1. **Authentication**: Admin logs in with credentials
2. **Card Management**: Create new cards with initial balances
3. **Transaction Management**: Add transactions to existing cards
4. **Data Overview**: View all cards and transactions in organized tables

### Firebase Integration Flow
1. **Initialization**: Firebase config setup and Firestore initialization
2. **Real-time Listeners**: Set up listeners for cards and transactions collections
3. **Data Migration**: Automatic migration from localStorage to Firestore
4. **CRUD Operations**: Create, read, update operations through Firebase SDK

## External Dependencies

### Firebase Services
- **Firebase SDK v12.0.0**: Core Firebase functionality for authentication
- **Firebase Auth**: Google Sign-In OAuth integration
- **No Database**: Firebase not used for data storage, only authentication

### Frontend Dependencies
- **Google Fonts**: Inter and Crimson Text font families
- **CSS3**: Modern styling with gradients, flexbox, and grid layouts
- **ES6+ JavaScript**: Modern JavaScript features for application logic

### Development Tools
- **npm**: Package management
- **No build process**: Direct browser execution without compilation

## Deployment Strategy

### Current Setup
- **Static Hosting**: HTML, CSS, and JavaScript files served directly
- **Firebase Hosting**: Recommended for production deployment
- **CDN Integration**: Firebase SDK loaded from CDN

### Configuration Requirements
- **Firebase Project**: Requires Firebase project setup with Firestore enabled
- **API Keys**: Firebase configuration object needs real project credentials
- **Security Rules**: Firestore security rules for data access control

### Migration Considerations
- **Data Migration**: Automatic migration from localStorage to Firestore on first load
- **Backward Compatibility**: Supports both localStorage and Firestore during transition
- **Error Handling**: Comprehensive error handling for Firebase operations

### Performance Optimizations
- **Loading States**: Visual feedback during database operations
- **Real-time Updates**: Efficient listeners for live data synchronization
- **Caching Strategy**: Browser caching for static assets