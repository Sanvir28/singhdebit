// Card Generation and Validation for SecureBank

class CardGenerator {
    constructor() {
        this.cardTypes = {
            visa: {
                name: 'Visa',
                prefixes: ['4'],
                lengths: [16],
                logo: 'VISA',
                color: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)'
            },
            mastercard: {
                name: 'Mastercard',
                prefixes: ['5'],
                lengths: [16],
                logo: 'MC',
                color: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
            },
            amex: {
                name: 'American Express',
                prefixes: ['34', '37'],
                lengths: [15],
                logo: 'AMEX',
                color: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            }
        };
    }

    // Generate a valid card number using Luhn algorithm
    generateCardNumber(type) {
        const cardType = this.cardTypes[type];
        if (!cardType) {
            throw new Error('Invalid card type');
        }

        // Select random prefix for the card type
        const prefix = cardType.prefixes[Math.floor(Math.random() * cardType.prefixes.length)];
        const length = cardType.lengths[0];
        
        // Generate random digits for the middle part
        let cardNumber = prefix;
        while (cardNumber.length < length - 1) {
            cardNumber += Math.floor(Math.random() * 10);
        }

        // Calculate and append Luhn check digit
        const checkDigit = this.calculateLuhnCheckDigit(cardNumber);
        cardNumber += checkDigit;

        return this.formatCardNumber(cardNumber);
    }

    // Calculate Luhn algorithm check digit
    calculateLuhnCheckDigit(cardNumber) {
        let sum = 0;
        let isEven = true;

        // Process digits from right to left (excluding the check digit position)
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit = digit % 10 + 1;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return (10 - (sum % 10)) % 10;
    }

    // Validate card number using Luhn algorithm
    validateCardNumber(cardNumber) {
        // Remove spaces and non-digits
        const cleanNumber = cardNumber.replace(/\D/g, '');
        
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            return false;
        }

        let sum = 0;
        let isEven = false;

        // Process digits from right to left
        for (let i = cleanNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cleanNumber[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit = digit % 10 + 1;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    // Format card number with spaces
    formatCardNumber(cardNumber) {
        const cleanNumber = cardNumber.replace(/\D/g, '');
        
        // Different formatting for different card types
        if (cleanNumber.length === 15) {
            // American Express: 4-6-5 format
            return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
        } else {
            // Visa/Mastercard: 4-4-4-4 format
            return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
        }
    }

    // Generate expiry date (2-5 years from now)
    generateExpiryDate() {
        const now = new Date();
        const futureYears = Math.floor(Math.random() * 4) + 2; // 2-5 years
        const futureDate = new Date(now.getFullYear() + futureYears, now.getMonth());
        
        const month = String(futureDate.getMonth() + 1).padStart(2, '0');
        const year = String(futureDate.getFullYear()).slice(-2);
        
        return `${month}/${year}`;
    }

    // Generate CVV
    generateCVV(type) {
        const length = type === 'amex' ? 4 : 3;
        let cvv = '';
        
        for (let i = 0; i < length; i++) {
            cvv += Math.floor(Math.random() * 10);
        }
        
        return cvv;
    }

    // Generate random cardholder name
    generateCardholderName() {
        const firstNames = [
            'JAMES', 'JOHN', 'ROBERT', 'MICHAEL', 'WILLIAM', 'DAVID', 'RICHARD', 'JOSEPH',
            'THOMAS', 'CHARLES', 'MARY', 'PATRICIA', 'JENNIFER', 'LINDA', 'ELIZABETH',
            'BARBARA', 'SUSAN', 'JESSICA', 'SARAH', 'KAREN', 'NANCY', 'LISA', 'BETTY',
            'HELEN', 'SANDRA', 'DONNA', 'CAROL', 'RUTH', 'SHARON', 'MICHELLE', 'LAURA',
            'SARAH', 'KIMBERLY', 'DEBORAH', 'DOROTHY', 'AMY', 'ANGELA', 'ASHLEY'
        ];

        const lastNames = [
            'SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER',
            'DAVIS', 'RODRIGUEZ', 'MARTINEZ', 'HERNANDEZ', 'LOPEZ', 'GONZALEZ',
            'WILSON', 'ANDERSON', 'THOMAS', 'TAYLOR', 'MOORE', 'JACKSON', 'MARTIN',
            'LEE', 'PEREZ', 'THOMPSON', 'WHITE', 'HARRIS', 'SANCHEZ', 'CLARK',
            'RAMIREZ', 'LEWIS', 'ROBINSON', 'WALKER', 'YOUNG', 'ALLEN', 'KING',
            'WRIGHT', 'SCOTT', 'TORRES', 'NGUYEN', 'HILL', 'FLORES', 'GREEN'
        ];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }

    // Generate complete card data
    generateCard(type, cardholderName = null, initialBalance = 0, additionalInfo = {}) {
        if (!this.cardTypes[type]) {
            throw new Error('Invalid card type');
        }

        const cardData = {
            type: type,
            number: this.generateCardNumber(type),
            cardholder: cardholderName || this.generateCardholderName(),
            expiry: this.generateExpiryDate(),
            cvv: this.generateCVV(type),
            balance: parseFloat(initialBalance) || 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            phoneNumber: additionalInfo.phoneNumber || '',
            email: additionalInfo.email || '',
            billingAddress: additionalInfo.billingAddress || {}
        };

        return cardData;
    }

    // Get card type from number
    getCardTypeFromNumber(cardNumber) {
        const cleanNumber = cardNumber.replace(/\D/g, '');
        
        if (cleanNumber.startsWith('4')) {
            return 'visa';
        } else if (cleanNumber.startsWith('5')) {
            return 'mastercard';
        } else if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) {
            return 'amex';
        }
        
        return null;
    }

    // Get card type info
    getCardTypeInfo(type) {
        return this.cardTypes[type] || null;
    }

    // Format card number for display (mask middle digits)
    maskCardNumber(cardNumber, showLast = 4) {
        const cleanNumber = cardNumber.replace(/\D/g, '');
        const masked = '•'.repeat(cleanNumber.length - showLast) + cleanNumber.slice(-showLast);
        return this.formatCardNumber(masked);
    }

    // Validate expiry date
    validateExpiryDate(expiryDate) {
        const cleanExpiry = expiryDate.replace(/\D/g, '');
        
        if (cleanExpiry.length !== 4) {
            return false;
        }

        const month = parseInt(cleanExpiry.substring(0, 2));
        const year = parseInt('20' + cleanExpiry.substring(2, 4));

        if (month < 1 || month > 12) {
            return false;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return false;
        }

        return true;
    }

    // Validate CVV
    validateCVV(cvv, cardType = null) {
        const cleanCVV = cvv.replace(/\D/g, '');
        
        if (cardType === 'amex') {
            return cleanCVV.length === 4;
        } else {
            return cleanCVV.length === 3;
        }
    }

    // Generate random balance within range
    generateRandomBalance(min = 100, max = 10000) {
        const balance = Math.random() * (max - min) + min;
        return Math.round(balance * 100) / 100; // Round to 2 decimal places
    }

    // Update card preview
    updateCardPreview(element, cardData) {
        if (!element || !cardData) return;

        const cardTypeInfo = this.getCardTypeInfo(cardData.type);
        
        // Update card styling
        if (cardTypeInfo) {
            element.style.background = cardTypeInfo.color;
        }

        // Update card number
        const numberElement = element.querySelector('.card-number, .card-number-full');
        if (numberElement) {
            numberElement.textContent = cardData.number || '•••• •••• •••• ••••';
        }

        // Update cardholder name
        const cardholderElement = element.querySelector('.cardholder, .cardholder-full');
        if (cardholderElement) {
            cardholderElement.textContent = cardData.cardholder || 'CARDHOLDER NAME';
        }

        // Update expiry date
        const expiryElement = element.querySelector('.expiry, .expiry-full');
        if (expiryElement) {
            expiryElement.textContent = cardData.expiry || 'MM/YY';
        }

        // Update card logo
        const logoElement = element.querySelector('.card-logo, .card-logo-full');
        if (logoElement && cardTypeInfo) {
            logoElement.textContent = cardTypeInfo.logo;
        }
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Parse currency string to number
    parseCurrency(currencyString) {
        return parseFloat(currencyString.replace(/[^0-9.-]+/g, '')) || 0;
    }
}

// Create global instance
const cardGenerator = new CardGenerator();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardGenerator;
}
