// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: "AIzaSyDg0GqckIo6tzkE-P6r4-Kqrv8MJT60lIk",
    authDomain: "singhdebit-843f2.firebaseapp.com",
    projectId: "singhdebit-843f2",
    storageBucket: "singhdebit-843f2.firebasestorage.app",
    messagingSenderId: "985351671931",
    appId: "1:985351671931:web:f70309d9ebb5c2545312de",
    measurementId: "G-9ZC8CQ8QBW"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
}

// Initialize Firestore
let db;
try {
    db = firebase.firestore();
    console.log('Firestore initialized successfully');
} catch (error) {
    console.error('Firestore initialization failed:', error);
    throw error;
}

// Initialize Auth
let auth;
try {
    auth = firebase.auth();
    console.log('Firebase Auth initialized successfully');
} catch (error) {
    console.error('Firebase Auth initialization failed:', error);
    throw error;
}

// Firestore collections
const COLLECTIONS = {
    CARDS: 'cards',
    TRANSACTIONS: 'transactions',
    ADMIN: 'admin'
};

// Google Sign-In provider
const provider = new firebase.auth.GoogleAuthProvider();

// Firebase utility functions
const FirebaseUtils = {
    // Show loading overlay
    showLoading: function() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    // Hide loading overlay
    hideLoading: function() {
        document.getElementById('loading-overlay').style.display = 'none';
    },

    // Show button loading state
    showButtonLoading: function(buttonElement) {
        const btnText = buttonElement.querySelector('.btn-text');
        const btnLoader = buttonElement.querySelector('.btn-loader');
        if (btnText && btnLoader) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
        }
        buttonElement.disabled = true;
    },

    // Hide button loading state
    hideButtonLoading: function(buttonElement) {
        const btnText = buttonElement.querySelector('.btn-text');
        const btnLoader = buttonElement.querySelector('.btn-loader');
        if (btnText && btnLoader) {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
        buttonElement.disabled = false;
    },

    // Error handler
    handleError: function(error, context = '') {
        console.error(`Firebase Error ${context}:`, error);
        let errorMessage = 'An error occurred. Please try again.';
        
        if (error.code) {
            switch (error.code) {
                case 'permission-denied':
                    errorMessage = 'Permission denied. Please check your access rights.';
                    break;
                case 'unavailable':
                    errorMessage = 'Service temporarily unavailable. Please try again later.';
                    break;
                case 'deadline-exceeded':
                    errorMessage = 'Request timed out. Please try again.';
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }
        }
        
        return errorMessage;
    },

    // Google Sign-In
    signInWithGoogle: async function() {
        try {
            const result = await auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Google Sign-In error:', error);
            throw error;
        }
    },

    // Sign out
    signOut: async function() {
        try {
            await auth.signOut();
            console.log('User signed out');
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    },

    // Check authentication state
    getCurrentUser: function() {
        return auth.currentUser;
    },

    // Auth state listener
    onAuthStateChanged: function(callback) {
        return auth.onAuthStateChanged(callback);
    },

    // Get all cards
    getCards: async function() {
        try {
            const snapshot = await db.collection(COLLECTIONS.CARDS).get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error(this.handleError(error, 'getting cards'));
        }
    },

    // Add new card
    addCard: async function(cardData) {
        try {
            const docRef = await db.collection(COLLECTIONS.CARDS).add({
                ...cardData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...cardData };
        } catch (error) {
            throw new Error(this.handleError(error, 'adding card'));
        }
    },

    // Update card
    updateCard: async function(cardId, updateData) {
        try {
            await db.collection(COLLECTIONS.CARDS).doc(cardId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            throw new Error(this.handleError(error, 'updating card'));
        }
    },

    // Delete card
    deleteCard: async function(cardId) {
        try {
            await db.collection(COLLECTIONS.CARDS).doc(cardId).delete();
        } catch (error) {
            throw new Error(this.handleError(error, 'deleting card'));
        }
    },

    // Get card by details
    getCardByDetails: async function(cardNumber, expMonth, expYear, cvv) {
        try {
            const snapshot = await db.collection(COLLECTIONS.CARDS)
                .where('cardNumber', '==', cardNumber)
                .where('expMonth', '==', expMonth)
                .where('expYear', '==', expYear)
                .where('cvv', '==', cvv)
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            throw new Error(this.handleError(error, 'finding card'));
        }
    },

    // Get all transactions
    getTransactions: async function() {
        try {
            const snapshot = await db.collection(COLLECTIONS.TRANSACTIONS)
                .orderBy('date', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error(this.handleError(error, 'getting transactions'));
        }
    },

    // Get transactions by card number
    getTransactionsByCard: async function(cardNumber) {
        try {
            const snapshot = await db.collection(COLLECTIONS.TRANSACTIONS)
                .where('cardNumber', '==', cardNumber)
                .orderBy('date', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error(this.handleError(error, 'getting card transactions'));
        }
    },

    // Add transaction
    addTransaction: async function(transactionData) {
        try {
            const docRef = await db.collection(COLLECTIONS.TRANSACTIONS).add({
                ...transactionData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...transactionData };
        } catch (error) {
            throw new Error(this.handleError(error, 'adding transaction'));
        }
    },

    // Delete transactions by card number
    deleteTransactionsByCard: async function(cardNumber) {
        try {
            const snapshot = await db.collection(COLLECTIONS.TRANSACTIONS)
                .where('cardNumber', '==', cardNumber)
                .get();
            
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
        } catch (error) {
            throw new Error(this.handleError(error, 'deleting transactions'));
        }
    },

    // Listen to cards collection changes
    listenToCards: function(callback) {
        return db.collection(COLLECTIONS.CARDS).onSnapshot(
            snapshot => {
                const cards = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(cards);
            },
            error => {
                console.error('Error listening to cards:', error);
                callback([]);
            }
        );
    },

    // Listen to transactions collection changes
    listenToTransactions: function(callback) {
        return db.collection(COLLECTIONS.TRANSACTIONS)
            .orderBy('date', 'desc')
            .onSnapshot(
                snapshot => {
                    const transactions = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    callback(transactions);
                },
                error => {
                    console.error('Error listening to transactions:', error);
                    callback([]);
                }
            );
    },

    // Transfer money between cards
    transferMoney: async function(fromCardNumber, toCardNumber, amount, description) {
        try {
            // Get both cards to verify they exist
            const fromCardQuery = await db.collection(COLLECTIONS.CARDS)
                .where('cardNumber', '==', fromCardNumber)
                .get();
            
            const toCardQuery = await db.collection(COLLECTIONS.CARDS)
                .where('cardNumber', '==', toCardNumber)
                .get();
            
            if (fromCardQuery.empty) {
                throw new Error('Source card not found');
            }
            
            if (toCardQuery.empty) {
                throw new Error('Destination card not found');
            }
            
            // Check if sender has sufficient balance
            const fromCard = fromCardQuery.docs[0].data();
            const fromCardTransactions = await this.getTransactionsByCard(fromCardNumber);
            
            let currentBalance = parseFloat(fromCard.balance || 0);
            fromCardTransactions.forEach(transaction => {
                const transactionAmount = parseFloat(transaction.amount);
                if (transaction.type === 'deposit') {
                    currentBalance += transactionAmount;
                } else {
                    currentBalance -= transactionAmount;
                }
            });
            
            if (currentBalance < amount) {
                throw new Error('Insufficient funds');
            }
            
            // Create both transactions
            const timestamp = new Date().toISOString();
            
            // Debit transaction for sender
            await this.addTransaction({
                cardNumber: fromCardNumber,
                type: 'withdrawal',
                amount: amount,
                description: `Transfer to ${toCardNumber.slice(-4)}: ${description}`,
                date: timestamp
            });
            
            // Credit transaction for receiver
            await this.addTransaction({
                cardNumber: toCardNumber,
                type: 'deposit',
                amount: amount,
                description: `Transfer from ${fromCardNumber.slice(-4)}: ${description}`,
                date: timestamp
            });
            
            return { success: true, message: 'Transfer completed successfully' };
            
        } catch (error) {
            throw new Error(this.handleError(error, 'transferring money'));
        }
    },

    // Withdraw money from card
    withdrawMoney: async function(cardNumber, amount, description) {
        try {
            // Get card to verify it exists
            const cardQuery = await db.collection(COLLECTIONS.CARDS)
                .where('cardNumber', '==', cardNumber)
                .get();
            
            if (cardQuery.empty) {
                throw new Error('Card not found');
            }
            
            // Check if card has sufficient balance
            const card = cardQuery.docs[0].data();
            const cardTransactions = await this.getTransactionsByCard(cardNumber);
            
            let currentBalance = parseFloat(card.balance || 0);
            cardTransactions.forEach(transaction => {
                const transactionAmount = parseFloat(transaction.amount);
                if (transaction.type === 'deposit') {
                    currentBalance += transactionAmount;
                } else {
                    currentBalance -= transactionAmount;
                }
            });
            
            if (currentBalance < amount) {
                throw new Error('Insufficient funds');
            }
            
            // Create withdrawal transaction
            const timestamp = new Date().toISOString();
            
            await this.addTransaction({
                cardNumber: cardNumber,
                type: 'withdrawal',
                amount: amount,
                description: description,
                date: timestamp
            });
            
            return { success: true, message: 'Withdrawal completed successfully' };
            
        } catch (error) {
            throw new Error(this.handleError(error, 'withdrawing money'));
        }
    },

    // Calculate current balance for a card
    calculateCardBalance: async function(cardNumber) {
        try {
            const cardQuery = await db.collection(COLLECTIONS.CARDS)
                .where('cardNumber', '==', cardNumber)
                .get();
            
            if (cardQuery.empty) {
                throw new Error('Card not found');
            }
            
            const card = cardQuery.docs[0].data();
            const cardTransactions = await this.getTransactionsByCard(cardNumber);
            
            let currentBalance = parseFloat(card.balance || 0);
            cardTransactions.forEach(transaction => {
                const transactionAmount = parseFloat(transaction.amount);
                if (transaction.type === 'deposit') {
                    currentBalance += transactionAmount;
                } else {
                    currentBalance -= transactionAmount;
                }
            });
            
            return currentBalance;
            
        } catch (error) {
            throw new Error(this.handleError(error, 'calculating balance'));
        }
    }
};

// Migration utility for existing localStorage data
const MigrationUtils = {
    // Migrate existing localStorage data to Firestore
    migrateLocalStorageData: async function() {
        try {
            // Check if data exists in localStorage
            const localCards = JSON.parse(localStorage.getItem('cards') || '[]');
            const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            
            if (localCards.length > 0 || localTransactions.length > 0) {
                console.log('Migrating localStorage data to Firestore...');
                
                // Migrate cards
                for (const card of localCards) {
                    await FirebaseUtils.addCard(card);
                }
                
                // Migrate transactions
                for (const transaction of localTransactions) {
                    await FirebaseUtils.addTransaction(transaction);
                }
                
                console.log('Migration completed successfully');
                
                // Clear localStorage after successful migration
                localStorage.removeItem('cards');
                localStorage.removeItem('transactions');
            }
        } catch (error) {
            console.error('Migration failed:', error);
        }
    }
};
