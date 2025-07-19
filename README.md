# SecureBank - Debit Card Management System
Default credentials: admin / securebank123
## Overview
SecureBank is a client-side web application that simulates a debit card management system. It provides functionality for creating virtual debit cards, checking balances, and administrative management through a clean, modern web interface. The application is built entirely with vanilla HTML, CSS, and JavaScript, using local storage for data persistence.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application follows a traditional client-side architecture with a multi-page layout:

- **Frontend**: Pure HTML/CSS/JavaScript without frameworks
- **Data Storage**: Browser LocalStorage for persistence
- **Architecture Pattern**: Modular JavaScript with class-based components
- **Styling**: Custom CSS with modern design principles and responsive layout
- **Navigation**: Multi-page application with shared header navigation

## Key Components

### Frontend Structure
- **Main Pages**: 
  - `index.html` - Card creation interface
  - `balance.html` - Balance checking interface  
  - `admin.html` - Administrative panel
- **Styling**: Modular CSS approach with `main.css` for global styles and `modal.css` for modal components
- **Scripts**: Feature-based JavaScript modules for specific functionality

### JavaScript Modules
- **`card-generator.js`**: Handles card number generation using Luhn algorithm validation
- **`storage.js`**: Manages localStorage operations for cards, admin data, and transactions
- **`main.js`**: Controls card creation form and preview functionality
- **`balance.js`**: Manages balance checking and transaction history
- **`admin.js`**: Provides administrative interface for card management

### Data Models
The application manages three main data types in localStorage:
- **Cards**: Card details, balances, and metadata
- **Admin**: Authentication credentials and session data
- **Transactions**: Transaction history for balance tracking

## Data Flow

### Card Creation Flow
1. User fills out card creation form (name, type, initial balance)
2. Card generator creates valid card number using Luhn algorithm
3. Card preview updates in real-time
4. Form submission stores card data in localStorage
5. Success modal displays generated card details

### Balance Check Flow
1. User enters card credentials (number, expiry, CVV)
2. System validates card format and existence
3. Current balance and transaction history retrieved from storage
4. Balance information displayed with transaction history option

### Admin Management Flow
1. Admin authentication using default credentials
2. Dashboard displays all cards with filtering and search capabilities
3. CRUD operations for card management
4. Real-time updates to localStorage

## External Dependencies
- **Google Fonts**: Inter and JetBrains Mono font families
- **No JavaScript frameworks**: Pure vanilla JavaScript implementation
- **No backend services**: Completely client-side application

## Deployment Strategy
The application is designed for static hosting and can be deployed to any web server or static hosting service:

- **Requirements**: Any web server capable of serving static files
- **Build Process**: None required - direct file deployment
- **Configuration**: No server-side configuration needed
- **Browser Compatibility**: Modern browsers with localStorage support

### Security Considerations
- Default admin credentials are hardcoded (admin/securebank123)
- All data stored in browser localStorage (not suitable for production)
- No encryption for stored card data
- Client-side validation only

### Scalability Notes
The current localStorage-based approach is suitable for demonstration purposes but would need migration to a proper backend database system for production use. The modular JavaScript architecture supports future migration to a framework-based approach if needed.
