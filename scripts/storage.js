// Local Storage Management for SecureBank Card System

class CardStorage {
    constructor() {
        this.CARDS_KEY = 'securebank_cards';
        this.ADMIN_KEY = 'securebank_admin';
        this.TRANSACTIONS_KEY = 'securebank_transactions';
        
        // Initialize default admin credentials if not exists
        this.initializeAdmin();
    }

    // Initialize default admin credentials
    initializeAdmin() {
        const admin = this.getAdmin();
        if (!admin) {
            this.setAdmin({
                username: 'admin',
                password: 'securebank123', // In production, this should be hashed
                lastLogin: null,
                loginAttempts: 0
            });
        }
    }

    // Admin management
    getAdmin() {
        try {
            const admin = localStorage.getItem(this.ADMIN_KEY);
            return admin ? JSON.parse(admin) : null;
        } catch (error) {
            console.error('Error getting admin data:', error);
            return null;
        }
    }

    setAdmin(adminData) {
        try {
            localStorage.setItem(this.ADMIN_KEY, JSON.stringify(adminData));
            return true;
        } catch (error) {
            console.error('Error setting admin data:', error);
            return false;
        }
    }

    // Card management
    getAllCards() {
        try {
            const cards = localStorage.getItem(this.CARDS_KEY);
            return cards ? JSON.parse(cards) : [];
        } catch (error) {
            console.error('Error getting cards:', error);
            return [];
        }
    }

    saveCard(cardData) {
        try {
            const cards = this.getAllCards();
            
            // Generate unique card ID if not exists
            if (!cardData.id) {
                cardData.id = this.generateCardId();
            }
            
            // Add timestamps
            cardData.createdAt = cardData.createdAt || new Date().toISOString();
            cardData.updatedAt = new Date().toISOString();
            
            // Add default status if not exists
            cardData.status = cardData.status || 'active';
            
            cards.push(cardData);
            localStorage.setItem(this.CARDS_KEY, JSON.stringify(cards));
            
            return cardData;
        } catch (error) {
            console.error('Error saving card:', error);
            return null;
        }
    }

    updateCard(cardId, updateData) {
        try {
            const cards = this.getAllCards();
            const cardIndex = cards.findIndex(card => card.id === cardId);
            
            if (cardIndex === -1) {
                throw new Error('Card not found');
            }
            
            // Update card data
            cards[cardIndex] = {
                ...cards[cardIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.CARDS_KEY, JSON.stringify(cards));
            return cards[cardIndex];
        } catch (error) {
            console.error('Error updating card:', error);
            return null;
        }
    }

    deleteCard(cardId) {
        try {
            const cards = this.getAllCards();
            const filteredCards = cards.filter(card => card.id !== cardId);
            
            if (cards.length === filteredCards.length) {
                throw new Error('Card not found');
            }
            
            localStorage.setItem(this.CARDS_KEY, JSON.stringify(filteredCards));
            return true;
        } catch (error) {
            console.error('Error deleting card:', error);
            return false;
        }
    }

    getCardById(cardId) {
        try {
            const cards = this.getAllCards();
            return cards.find(card => card.id === cardId) || null;
        } catch (error) {
            console.error('Error getting card by ID:', error);
            return null;
        }
    }

    getCardByNumber(cardNumber) {
        try {
            const cards = this.getAllCards();
            // Remove spaces for comparison
            const cleanCardNumber = cardNumber.replace(/\s/g, '');
            return cards.find(card => card.number.replace(/\s/g, '') === cleanCardNumber) || null;
        } catch (error) {
            console.error('Error getting card by number:', error);
            return null;
        }
    }

    // Search and filter cards
    searchCards(query, filters = {}) {
        try {
            let cards = this.getAllCards();
            
            // Apply text search
            if (query && query.trim()) {
                const searchTerm = query.toLowerCase().trim();
                cards = cards.filter(card => 
                    card.cardholder.toLowerCase().includes(searchTerm) ||
                    card.number.includes(searchTerm) ||
                    card.id.toLowerCase().includes(searchTerm)
                );
            }
            
            // Apply filters
            if (filters.status) {
                cards = cards.filter(card => card.status === filters.status);
            }
            
            if (filters.type) {
                cards = cards.filter(card => card.type === filters.type);
            }
            
            if (filters.dateFrom) {
                cards = cards.filter(card => new Date(card.createdAt) >= new Date(filters.dateFrom));
            }
            
            if (filters.dateTo) {
                cards = cards.filter(card => new Date(card.createdAt) <= new Date(filters.dateTo));
            }
            
            return cards;
        } catch (error) {
            console.error('Error searching cards:', error);
            return [];
        }
    }

    // Statistics
    getCardStats() {
        try {
            const cards = this.getAllCards();
            const today = new Date();
            const todayStr = today.toDateString();
            
            const stats = {
                total: cards.length,
                active: cards.filter(card => card.status === 'active').length,
                inactive: cards.filter(card => card.status === 'inactive').length,
                todayCreated: cards.filter(card => 
                    new Date(card.createdAt).toDateString() === todayStr
                ).length,
                totalBalance: cards.reduce((sum, card) => sum + (parseFloat(card.balance) || 0), 0),
                byType: {
                    visa: cards.filter(card => card.type === 'visa').length,
                    mastercard: cards.filter(card => card.type === 'mastercard').length,
                    amex: cards.filter(card => card.type === 'amex').length
                }
            };
            
            return stats;
        } catch (error) {
            console.error('Error getting card stats:', error);
            return {
                total: 0,
                active: 0,
                inactive: 0,
                todayCreated: 0,
                totalBalance: 0,
                byType: { visa: 0, mastercard: 0, amex: 0 }
            };
        }
    }

    // Transaction management
    getAllTransactions() {
        try {
            const transactions = localStorage.getItem(this.TRANSACTIONS_KEY);
            return transactions ? JSON.parse(transactions) : [];
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }

    addTransaction(cardId, transactionData) {
        try {
            const transactions = this.getAllTransactions();
            
            const transaction = {
                id: this.generateTransactionId(),
                cardId: cardId,
                ...transactionData,
                timestamp: new Date().toISOString()
            };
            
            transactions.push(transaction);
            localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
            
            return transaction;
        } catch (error) {
            console.error('Error adding transaction:', error);
            return null;
        }
    }

    getTransactionsByCardId(cardId) {
        try {
            const transactions = this.getAllTransactions();
            return transactions.filter(transaction => transaction.cardId === cardId)
                              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error getting transactions by card ID:', error);
            return [];
        }
    }

    // Utility functions
    generateCardId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `card_${timestamp}_${random}`.toUpperCase();
    }

    generateTransactionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `txn_${timestamp}_${random}`.toUpperCase();
    }

    // Data export/import
    exportAllData() {
        try {
            const data = {
                cards: this.getAllCards(),
                transactions: this.getAllTransactions(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.cards && Array.isArray(data.cards)) {
                localStorage.setItem(this.CARDS_KEY, JSON.stringify(data.cards));
            }
            
            if (data.transactions && Array.isArray(data.transactions)) {
                localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(data.transactions));
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data (for testing/reset)
    clearAllData() {
        try {
            localStorage.removeItem(this.CARDS_KEY);
            localStorage.removeItem(this.TRANSACTIONS_KEY);
            this.initializeAdmin(); // Reinitialize admin
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Validate card credentials
    validateCardCredentials(cardNumber, expiryDate, cvv) {
        try {
            const card = this.getCardByNumber(cardNumber);
            if (!card) {
                return { valid: false, error: 'Card not found' };
            }
            
            if (card.status !== 'active') {
                return { valid: false, error: 'Card is inactive' };
            }
            
            // Clean inputs for comparison
            const cleanExpiry = expiryDate.replace(/\D/g, '');
            const cleanCardExpiry = card.expiry.replace(/\D/g, '');
            
            if (cleanExpiry !== cleanCardExpiry) {
                return { valid: false, error: 'Invalid expiry date' };
            }
            
            if (cvv !== card.cvv) {
                return { valid: false, error: 'Invalid CVV' };
            }
            
            return { valid: true, card: card };
        } catch (error) {
            console.error('Error validating card credentials:', error);
            return { valid: false, error: 'Validation failed' };
        }
    }
}

// Create global instance
const cardStorage = new CardStorage();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardStorage;
}
