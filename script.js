// Application State
let currentUser = null;
let currentUserCard = null;
let cards = [];
let transactions = [];
let cardsListener = null;
let transactionsListener = null;
let isFirebaseMode = false;

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'singhdebit2025'
};

// Data access layer - localStorage only
const DataUtils = {
    // Get all cards
    async getCards() {
        return JSON.parse(localStorage.getItem('cards') || '[]');
    },

    // Get all transactions
    async getTransactions() {
        return JSON.parse(localStorage.getItem('transactions') || '[]');
    },

    // Add a card
    async addCard(cardData) {
        const cards = JSON.parse(localStorage.getItem('cards') || '[]');
        const newCard = {
            id: 'card_' + Date.now(),
            ...cardData,
            createdAt: new Date().toISOString()
        };
        cards.push(newCard);
        localStorage.setItem('cards', JSON.stringify(cards));
        return newCard;
    },

    // Add a transaction
    async addTransaction(transactionData) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const newTransaction = {
            id: 'trans_' + Date.now(),
            ...transactionData,
            createdAt: new Date().toISOString()
        };
        transactions.push(newTransaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        return newTransaction;
    },

    // Get card by details
    async getCardByDetails(cardNumber, expMonth, expYear, cvv) {
        const cards = JSON.parse(localStorage.getItem('cards') || '[]');
        return cards.find(card => 
            card.cardNumber === cardNumber &&
            card.expMonth === expMonth &&
            card.expYear === expYear &&
            card.cvv === cvv
        ) || null;
    },

    // Update card balance
    async updateCardBalance(cardId, newBalance) {
        const cards = JSON.parse(localStorage.getItem('cards') || '[]');
        const cardIndex = cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            cards[cardIndex].balance = newBalance;
            localStorage.setItem('cards', JSON.stringify(cards));
            return cards[cardIndex];
        }
        return null;
    },

    // Get transactions by card
    async getTransactionsByCard(cardNumber) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        return transactions.filter(transaction => transaction.cardNumber === cardNumber);
    }
};

// Calculate card balance from transactions
async function calculateCardBalance(cardNumber) {
    try {
        const card = cards.find(c => c.cardNumber === cardNumber);
        if (!card) return 0;
        
        const cardTransactions = await DataUtils.getTransactionsByCard(cardNumber);
        let balance = parseFloat(card.balance || 0);
        
        cardTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'deposit') {
                balance += amount;
            } else {
                balance -= amount;
            }
        });
        
        return balance;
    } catch (error) {
        console.error('Error calculating balance:', error);
        return 0;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    FirebaseUtils.showLoading();
    
    try {
        console.log('Initializing application with localStorage...');
        
        // Initialize the app with localStorage
        await initializeAppWithoutFirebase();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set localStorage mode flag
        isFirebaseMode = false;
        
        console.log('Application initialized successfully with localStorage');
        
    } catch (error) {
        console.error('Application initialization failed:', error);
        alert('Failed to initialize application. Please refresh the page.');
    } finally {
        // Force hide loading overlay after a short delay to ensure DOM is ready
        setTimeout(() => {
            FirebaseUtils.hideLoading();
        }, 100);
    }
});

async function initializeApp() {
    // Initialize year dropdowns
    populateYearDropdowns();
    
    // Set default date for transaction form
    const today = new Date().toISOString().split('T')[0];
    const transactionDateInput = document.getElementById('transaction-date');
    if (transactionDateInput) {
        transactionDateInput.value = today;
    }
    
    // Load initial data
    await loadInitialData();
}

async function initializeAppWithoutFirebase() {
    // Initialize year dropdowns
    populateYearDropdowns();
    populateUserYearDropdown();
    
    // Set default date for transaction form
    const today = new Date().toISOString().split('T')[0];
    const transactionDateInput = document.getElementById('transaction-date');
    if (transactionDateInput) {
        transactionDateInput.value = today;
    }
    
    // Initialize with some sample data for demonstration
    if (!localStorage.getItem('cards')) {
        const sampleCards = [
            {
                id: 'card1',
                cardNumber: '1234567890123456',
                cardholder: 'John Doe',
                expMonth: '12',
                expYear: '2025',
                cvv: '123',
                balance: '1000.00'
            },
            {
                id: 'card2',
                cardNumber: '9876543210987654',
                cardholder: 'Jane Smith',
                expMonth: '06',
                expYear: '2026',
                cvv: '456',
                balance: '750.50'
            }
        ];
        
        const sampleTransactions = [
            {
                id: 'trans1',
                cardNumber: '1234567890123456',
                type: 'deposit',
                amount: '100.00',
                description: 'Initial deposit',
                date: '2025-07-15'
            },
            {
                id: 'trans2',
                cardNumber: '1234567890123456',
                type: 'withdrawal',
                amount: '50.00',
                description: 'ATM withdrawal',
                date: '2025-07-16'
            }
        ];
        
        localStorage.setItem('cards', JSON.stringify(sampleCards));
        localStorage.setItem('transactions', JSON.stringify(sampleTransactions));
    }
}

async function loadInitialData() {
    try {
        console.log('Loading initial data...');
        
        // Load cards and transactions using the appropriate data source
        cards = await DataUtils.getCards();
        transactions = await DataUtils.getTransactions();
        
        console.log('Data loaded successfully:', {
            cards: cards.length,
            transactions: transactions.length,
            source: isFirebaseMode ? 'Firebase' : 'localStorage'
        });
        
        // Update UI
        refreshCardTable();
        populateTransactionCardSelect();
        refreshAdminTransactionList();
        
    } catch (error) {
        console.error('Failed to load initial data:', error);
        throw error;
    }
}

function setupRealtimeListeners() {
    // Only set up Firebase listeners when in Firebase mode
    if (isFirebaseMode) {
        // Listen to cards collection changes
        cardsListener = FirebaseUtils.listenToCards((updatedCards) => {
            cards = updatedCards;
            refreshCardTable();
            populateTransactionCardSelect();
        });
        
        // Listen to transactions collection changes
        transactionsListener = FirebaseUtils.listenToTransactions((updatedTransactions) => {
            transactions = updatedTransactions;
            refreshAdminTransactionList();
        });
    }
}

function setupEventListeners() {
    // Card form submission
    document.getElementById('card-form').addEventListener('submit', handleCardSubmission);
    
    // User login form
    document.getElementById('user-login-form').addEventListener('submit', handleUserLogin);
    
    // Admin login form
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    
    // New card form
    document.getElementById('new-card-form').addEventListener('submit', handleNewCardSubmission);
    
    // Transaction form
    document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmission);
    
    // Transfer form
    document.getElementById('transfer-form').addEventListener('submit', handleTransferSubmission);
    
    // Withdraw form
    document.getElementById('withdraw-form').addEventListener('submit', handleWithdrawSubmission);
    
    // Card number formatting
    document.getElementById('card-number').addEventListener('input', formatCardNumber);
    document.getElementById('new-card-number').addEventListener('input', formatCardNumber);
    document.getElementById('user-card-number').addEventListener('input', formatCardNumber);
    document.getElementById('transfer-to-card').addEventListener('input', formatCardNumber);
    
    // CVV validation
    document.getElementById('cvv').addEventListener('input', validateCVV);
    document.getElementById('new-cvv').addEventListener('input', validateCVV);
    document.getElementById('user-cvv').addEventListener('input', validateCVV);
    
    // Populate user year dropdown
    populateUserYearDropdown();
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Special handling for admin dashboard
    if (pageId === 'admin-dashboard') {
        refreshCardTable();
        populateTransactionCardSelect();
        refreshAdminTransactionList();
    }
}

// Year dropdown population
function populateYearDropdowns() {
    const currentYear = new Date().getFullYear();
    const yearSelects = ['exp-year', 'new-exp-year'];
    
    yearSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Year</option>';
            for (let year = currentYear; year <= currentYear + 10; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
        }
    });
}

// User year dropdown population
function populateUserYearDropdown() {
    const currentYear = new Date().getFullYear();
    const select = document.getElementById('user-exp-year');
    
    if (select) {
        select.innerHTML = '<option value="">Year</option>';
        for (let year = currentYear; year <= currentYear + 10; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }
}

// Card number formatting
function formatCardNumber(event) {
    let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    event.target.value = formattedValue;
}

// CVV validation
function validateCVV(event) {
    const value = event.target.value.replace(/[^0-9]/g, '');
    event.target.value = value;
}

// Error message display
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }
}

// Card form submission
async function handleCardSubmission(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.submit-btn');
    FirebaseUtils.showButtonLoading(submitButton);
    
    try {
        const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
        const expMonth = document.getElementById('exp-month').value;
        const expYear = document.getElementById('exp-year').value;
        const cvv = document.getElementById('cvv').value;
        
        // Validate card number
        if (!validateCardNumber(cardNumber)) {
            showError('card-number-error', 'Please enter a valid 16-digit card number');
            return;
        }
        
        // Validate CVV
        if (!validateCVVFormat(cvv)) {
            showError('cvv-error', 'Please enter a valid 3 or 4 digit CVV');
            return;
        }
        
        // Find card using appropriate data source
        const card = await DataUtils.getCardByDetails(cardNumber, expMonth, expYear, cvv);
        
        if (card) {
            await displayCardBalance(card);
        } else {
            showError('card-number-error', 'Card not found. Please check your details or contact administrator.');
        }
        
    } catch (error) {
        showError('card-number-error', error.message);
    } finally {
        FirebaseUtils.hideButtonLoading(submitButton);
    }
}

// Card number validation
function validateCardNumber(cardNumber) {
    return /^\d{16}$/.test(cardNumber);
}

// CVV format validation
function validateCVVFormat(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

// Display card balance
async function displayCardBalance(card) {
    try {
        const balanceDisplay = document.getElementById('balance-display');
        
        // Get card transactions from data source
        const cardTransactions = await DataUtils.getTransactionsByCard(card.cardNumber);
        
        // Calculate current balance
        let currentBalance = parseFloat(card.balance || 0);
        cardTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'deposit') {
                currentBalance += amount;
            } else {
                currentBalance -= amount;
            }
        });
        
        // Update display
        document.getElementById('display-card-number').textContent = formatCardNumberDisplay(card.cardNumber);
        document.getElementById('display-cardholder').textContent = card.cardholder;
        document.getElementById('display-expiration').textContent = `${card.expMonth}/${card.expYear}`;
        document.getElementById('display-balance').textContent = `$${currentBalance.toFixed(2)}`;
        
        // Update balance color
        const balanceElement = document.getElementById('display-balance');
        if (currentBalance >= 0) {
            balanceElement.style.color = '#10b981';
        } else {
            balanceElement.style.color = '#ef4444';
        }
        
        // Display recent transactions
        displayTransactions(cardTransactions);
        
        // Store current card for modal
        currentBalanceCard = card;
        
        balanceDisplay.style.display = 'block';
        
    } catch (error) {
        showError('card-number-error', `Failed to load card details: ${error.message}`);
    }
}

// Format card number for display
function formatCardNumberDisplay(cardNumber) {
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
}

// Display transactions
function displayTransactions(cardTransactions) {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';
    
    if (cardTransactions.length === 0) {
        transactionList.innerHTML = '<p>No transactions found.</p>';
        return;
    }
    
    // Sort transactions by date (newest first)
    cardTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    cardTransactions.slice(0, 10).forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item transaction-item-clickable';
        transactionItem.onclick = () => showTransactionDetails(transaction);
        
        const amount = parseFloat(transaction.amount);
        const isPositive = transaction.type === 'deposit';
        
        transactionItem.innerHTML = `
            <div class="transaction-details">
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-type">${transaction.type}</div>
            </div>
            <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : '-'}$${amount.toFixed(2)}
            </div>
        `;
        
        transactionList.appendChild(transactionItem);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Google Sign-In for users
async function handleGoogleSignIn() {
    try {
        console.log('Attempting Google Sign-In...');
        FirebaseUtils.showLoading();
        
        const user = await FirebaseUtils.signInWithGoogle();
        console.log('Google Sign-In successful:', user.displayName);
        
        // Set current user
        currentUser = 'google-user';
        currentUserCard = null;
        
        // Show user dashboard
        await loadUserDashboard();
        showPage('user-dashboard');
        
    } catch (error) {
        console.error('Google Sign-In failed:', error);
        showError('user-login-error', 'Google Sign-In failed. Please try again.');
    } finally {
        FirebaseUtils.hideLoading();
    }
}

// User card login (legacy)
async function handleUserLogin(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.submit-btn');
    FirebaseUtils.showButtonLoading(submitButton);
    
    try {
        const cardNumber = document.getElementById('user-card-number').value.replace(/\s/g, '');
        const expMonth = document.getElementById('user-exp-month').value;
        const expYear = document.getElementById('user-exp-year').value;
        const cvv = document.getElementById('user-cvv').value;
        
        // Validate card number
        if (!validateCardNumber(cardNumber)) {
            showError('user-login-error', 'Please enter a valid 16-digit card number');
            return;
        }
        
        // Validate CVV
        if (!validateCVVFormat(cvv)) {
            showError('user-login-error', 'Please enter a valid 3 or 4 digit CVV');
            return;
        }
        
        // Find card using appropriate data source
        const card = await DataUtils.getCardByDetails(cardNumber, expMonth, expYear, cvv);
        
        if (card) {
            currentUser = 'user';
            currentUserCard = card;
            await loadUserDashboard();
            showPage('user-dashboard');
        } else {
            showError('user-login-error', 'Card not found. Please check your details.');
        }
        
    } catch (error) {
        showError('user-login-error', error.message);
    } finally {
        FirebaseUtils.hideButtonLoading(submitButton);
    }
}

// Admin login
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.submit-btn');
    FirebaseUtils.showButtonLoading(submitButton);
    
    try {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            currentUser = 'admin';
            showPage('admin-dashboard');
        } else {
            showError('admin-login-error', 'Invalid credentials. Please try again.');
        }
        
    } catch (error) {
        showError('admin-login-error', 'Login failed. Please try again.');
    } finally {
        FirebaseUtils.hideButtonLoading(submitButton);
    }
}

// User logout
async function userLogout() {
    try {
        // Sign out from Google if user is Google-authenticated
        if (currentUser === 'google-user') {
            await FirebaseUtils.signOut();
        }
        
        currentUser = null;
        currentUserCard = null;
        showPage('welcome');
        
        // Clear user form
        document.getElementById('user-login-form').reset();
        
        console.log('User logged out successfully');
        
    } catch (error) {
        console.error('Logout error:', error);
        // Still proceed with local logout even if Firebase logout fails
        currentUser = null;
        currentUserCard = null;
        showPage('welcome');
    }
}

// Admin logout
function logout() {
    currentUser = null;
    showPage('welcome');
    // Clear admin form
    document.getElementById('admin-login-form').reset();
}

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Show add card form
function showAddCardForm() {
    document.getElementById('add-card-form').style.display = 'block';
}

// Hide add card form
function hideAddCardForm() {
    document.getElementById('add-card-form').style.display = 'none';
    document.getElementById('new-card-form').reset();
}

// Handle new card submission
async function handleNewCardSubmission(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.submit-btn');
    FirebaseUtils.showButtonLoading(submitButton);
    
    try {
        const cardNumber = document.getElementById('new-card-number').value.replace(/\s/g, '');
        const cardholder = document.getElementById('new-cardholder').value;
        const expMonth = document.getElementById('new-exp-month').value;
        const expYear = document.getElementById('new-exp-year').value;
        const cvv = document.getElementById('new-cvv').value;
        const balance = document.getElementById('new-balance').value;
        
        // Validate card number
        if (!validateCardNumber(cardNumber)) {
            alert('Please enter a valid 16-digit card number');
            return;
        }
        
        // Check if card already exists
        const existingCard = await DataUtils.getCardByDetails(cardNumber, expMonth, expYear, cvv);
        if (existingCard) {
            alert('Card with these details already exists');
            return;
        }
        
        // Create new card
        const newCard = {
            cardNumber,
            cardholder,
            expMonth,
            expYear,
            cvv,
            balance: parseFloat(balance)
        };
        
        await DataUtils.addCard(newCard);
        
        // Reset form and hide
        hideAddCardForm();
        
        alert('Card added successfully!');
        
    } catch (error) {
        alert(`Failed to add card: ${error.message}`);
    } finally {
        FirebaseUtils.hideButtonLoading(submitButton);
    }
}

// Refresh card table
function refreshCardTable() {
    const tableBody = document.getElementById('card-table-body');
    tableBody.innerHTML = '';
    
    if (cards.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; padding: 2rem;">No cards found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    cards.forEach((card, index) => {
        const row = document.createElement('tr');
        
        // Calculate current balance
        const cardTransactions = transactions.filter(t => t.cardNumber === card.cardNumber);
        let currentBalance = parseFloat(card.balance || 0);
        cardTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'deposit') {
                currentBalance += amount;
            } else {
                currentBalance -= amount;
            }
        });
        
        row.className = 'card-row-clickable';
        row.innerHTML = `
            <td onclick="showCardDetails('${card.id}')">${formatCardNumberDisplay(card.cardNumber)}</td>
            <td onclick="showCardDetails('${card.id}')">${card.cardholder}</td>
            <td onclick="showCardDetails('${card.id}')">${card.expMonth}/${card.expYear}</td>
            <td onclick="showCardDetails('${card.id}')" style="color: ${currentBalance >= 0 ? '#10b981' : '#ef4444'}">$${currentBalance.toFixed(2)}</td>
            <td class="table-actions">
                <button class="edit-btn" onclick="editCard('${card.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteCard('${card.id}')">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Edit card
async function editCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const newBalance = prompt('Enter new balance:', card.balance);
    
    if (newBalance !== null && !isNaN(newBalance)) {
        try {
            await FirebaseUtils.updateCard(cardId, { balance: parseFloat(newBalance) });
            alert('Card balance updated successfully!');
        } catch (error) {
            alert(`Failed to update card: ${error.message}`);
        }
    }
}

// Delete card
async function deleteCard(cardId) {
    if (confirm('Are you sure you want to delete this card? This will also delete all associated transactions.')) {
        try {
            const card = cards.find(c => c.id === cardId);
            if (card) {
                // Delete associated transactions
                await FirebaseUtils.deleteTransactionsByCard(card.cardNumber);
                
                // Delete card
                await FirebaseUtils.deleteCard(cardId);
                
                alert('Card and associated transactions deleted successfully!');
            }
        } catch (error) {
            alert(`Failed to delete card: ${error.message}`);
        }
    }
}

// Populate transaction card select
function populateTransactionCardSelect() {
    const select = document.getElementById('transaction-card');
    select.innerHTML = '<option value="">Select a card...</option>';
    
    cards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.cardNumber;
        option.textContent = `${formatCardNumberDisplay(card.cardNumber)} - ${card.cardholder}`;
        select.appendChild(option);
    });
}

// Handle transaction submission
async function handleTransactionSubmission(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.submit-btn');
    FirebaseUtils.showButtonLoading(submitButton);
    
    try {
        const cardNumber = document.getElementById('transaction-card').value;
        const type = document.getElementById('transaction-type').value;
        const amount = document.getElementById('transaction-amount').value;
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        
        const transaction = {
            cardNumber,
            type,
            amount: parseFloat(amount),
            date,
            description
        };
        
        await DataUtils.addTransaction(transaction);
        
        // Reset form
        document.getElementById('transaction-form').reset();
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
        
        alert('Transaction added successfully!');
        
    } catch (error) {
        alert(`Failed to add transaction: ${error.message}`);
    } finally {
        FirebaseUtils.hideButtonLoading(submitButton);
    }
}

// Refresh admin transaction list
function refreshAdminTransactionList() {
    const transactionList = document.getElementById('admin-transaction-list');
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p style="text-align: center; padding: 2rem;">No transactions found</p>';
        return;
    }
    
    transactions.slice(0, 50).forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        const amount = parseFloat(transaction.amount);
        const isPositive = transaction.type === 'deposit';
        
        // Find cardholder name
        const card = cards.find(c => c.cardNumber === transaction.cardNumber);
        const cardholderName = card ? card.cardholder : 'Unknown';
        
        transactionItem.className = 'transaction-item transaction-item-clickable';
        transactionItem.onclick = () => showTransactionDetails(transaction);
        
        transactionItem.innerHTML = `
            <div class="transaction-details">
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-type">${transaction.type} - ${formatCardNumberDisplay(transaction.cardNumber)} (${cardholderName})</div>
            </div>
            <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : '-'}$${amount.toFixed(2)}
            </div>
        `;
        
        transactionList.appendChild(transactionItem);
    });
}

// Load user dashboard
async function loadUserDashboard() {
    try {
        if (currentUser === 'google-user') {
            // For Google-authenticated users, show all cards
            const googleUser = FirebaseUtils.getCurrentUser();
            if (googleUser) {
                // Show Google user info
                document.getElementById('user-card-number-display').textContent = 'Multiple Cards Available';
                document.getElementById('user-cardholder-display').textContent = googleUser.displayName || 'Google User';
                document.getElementById('user-expiration-display').textContent = 'N/A';
                
                // Calculate total balance across all cards
                const allCards = await DataUtils.getCards();
                let totalBalance = 0;
                for (const card of allCards) {
                    totalBalance += await calculateCardBalance(card.cardNumber);
                }
                
                document.getElementById('user-balance-display').textContent = `$${totalBalance.toFixed(2)}`;
                
                // Update balance color
                const balanceElement = document.getElementById('user-balance-display');
                if (totalBalance >= 0) {
                    balanceElement.style.color = '#10b981';
                } else {
                    balanceElement.style.color = '#ef4444';
                }
                
                // Load all transaction history
                await loadUserTransactionHistory();
                
                // Show card selection for Google users
                await populateCardSelections();
            }
        } else if (currentUserCard) {
            // For card-authenticated users, show specific card info
            document.getElementById('user-card-number-display').textContent = formatCardNumberDisplay(currentUserCard.cardNumber);
            document.getElementById('user-cardholder-display').textContent = currentUserCard.cardholder;
            document.getElementById('user-expiration-display').textContent = `${currentUserCard.expMonth}/${currentUserCard.expYear}`;
            
            // Calculate and display current balance
            const currentBalance = await calculateCardBalance(currentUserCard.cardNumber);
            document.getElementById('user-balance-display').textContent = `$${currentBalance.toFixed(2)}`;
            
            // Update balance color
            const balanceElement = document.getElementById('user-balance-display');
            if (currentBalance >= 0) {
                balanceElement.style.color = '#10b981';
            } else {
                balanceElement.style.color = '#ef4444';
            }
            
            // Load transaction history for this card
            await loadUserTransactionHistory();
        }
        
    } catch (error) {
        console.error('Failed to load user dashboard:', error);
        alert('Failed to load dashboard. Please try again.');
    }
}

// Load user transaction history
async function loadUserTransactionHistory() {
    try {
        const transactionList = document.getElementById('user-transaction-history');
        transactionList.innerHTML = '';
        
        let userTransactions = [];
        
        if (currentUser === 'google-user') {
            // For Google users, load all transactions
            userTransactions = await DataUtils.getAllTransactions();
        } else if (currentUserCard) {
            // For card users, load transactions for their specific card
            userTransactions = await DataUtils.getTransactionsByCard(currentUserCard.cardNumber);
        }
        
        if (userTransactions.length === 0) {
            transactionList.innerHTML = '<p style="text-align: center; padding: 2rem;">No transactions found</p>';
            return;
        }
        
        userTransactions.slice(0, 20).forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item transaction-item-clickable';
            transactionItem.onclick = () => showTransactionDetails(transaction);
            
            const amount = parseFloat(transaction.amount);
            const isPositive = transaction.type === 'deposit';
            
            transactionItem.innerHTML = `
                <div class="transaction-details">
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-type">${transaction.type}</div>
                    ${currentUser === 'google-user' ? `<div class="transaction-card">Card: ${formatCardNumberDisplay(transaction.cardNumber)}</div>` : ''}
                </div>
                <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : '-'}$${amount.toFixed(2)}
                </div>
            `;
            
            transactionList.appendChild(transactionItem);
        });
        
    } catch (error) {
        console.error('Failed to load transaction history:', error);
    }
}

// Populate card selections for Google users
async function populateCardSelections() {
    if (currentUser !== 'google-user') {
        // Hide card selection for non-Google users
        document.getElementById('transfer-from-card-group').style.display = 'none';
        document.getElementById('withdraw-from-card-group').style.display = 'none';
        return;
    }
    
    try {
        // Show card selection for Google users
        document.getElementById('transfer-from-card-group').style.display = 'block';
        document.getElementById('withdraw-from-card-group').style.display = 'block';
        
        // Load all cards
        const allCards = await DataUtils.getCards();
        
        // Populate transfer from card dropdown
        const transferFromSelect = document.getElementById('transfer-from-card');
        transferFromSelect.innerHTML = '<option value="">Select card to transfer from</option>';
        
        // Populate withdraw from card dropdown
        const withdrawFromSelect = document.getElementById('withdraw-from-card');
        withdrawFromSelect.innerHTML = '<option value="">Select card to withdraw from</option>';
        
        allCards.forEach(card => {
            const optionText = `${formatCardNumberDisplay(card.cardNumber)} - ${card.cardholder}`;
            
            // Transfer dropdown
            const transferOption = document.createElement('option');
            transferOption.value = card.cardNumber;
            transferOption.textContent = optionText;
            transferFromSelect.appendChild(transferOption);
            
            // Withdraw dropdown
            const withdrawOption = document.createElement('option');
            withdrawOption.value = card.cardNumber;
            withdrawOption.textContent = optionText;
            withdrawFromSelect.appendChild(withdrawOption);
        });
        
    } catch (error) {
        console.error('Failed to populate card selections:', error);
    }
}

// Show user tab
function showUserTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('#user-dashboard-page .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('#user-dashboard-page .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Refresh transaction history when history tab is shown
    if (tabName === 'history') {
        loadUserTransactionHistory();
    }
}

// Handle transfer submission
async function handleTransferSubmission(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.submit-btn');
    FirebaseUtils.showButtonLoading(submitButton);
    
    try {
        const toCardNumber = document.getElementById('transfer-to-card').value.replace(/\s/g, '');
        const amount = parseFloat(document.getElementById('transfer-amount').value);
        const description = document.getElementById('transfer-description').value;
        
        // Determine from card number
        let fromCardNumber;
        if (currentUser === 'google-user') {
            fromCardNumber = document.getElementById('transfer-from-card').value;
            if (!fromCardNumber) {
                alert('Please select a card to transfer from');
                return;
            }
        } else {
            fromCardNumber = currentUserCard.cardNumber;
        }
        
        // Validate recipient card number
        if (!validateCardNumber(toCardNumber)) {
            alert('Please enter a valid 16-digit recipient card number');
            return;
        }
        
        // Validate amount
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Check if trying to transfer to same card
        if (toCardNumber === fromCardNumber) {
            alert('Cannot transfer to the same card');
            return;
        }
        
        // Perform transfer
        await DataUtils.transferMoney(fromCardNumber, toCardNumber, amount, description);
        
        // Reset form
        document.getElementById('transfer-form').reset();
        await populateCardSelections(); // Repopulate dropdowns
        
        // Refresh dashboard
        await loadUserDashboard();
        
        alert('Transfer completed successfully!');
        
    } catch (error) {
        alert(`Transfer failed: ${error.message}`);
    } finally {
        FirebaseUtils.hideButtonLoading(submitButton);
    }
}

// Handle withdraw submission
async function handleWithdrawSubmission(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('.submit-btn');
    FirebaseUtils.showButtonLoading(submitButton);
    
    try {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const description = document.getElementById('withdraw-description').value;
        
        // Determine from card number
        let fromCardNumber;
        if (currentUser === 'google-user') {
            fromCardNumber = document.getElementById('withdraw-from-card').value;
            if (!fromCardNumber) {
                alert('Please select a card to withdraw from');
                return;
            }
        } else {
            fromCardNumber = currentUserCard.cardNumber;
        }
        
        // Validate amount
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Perform withdrawal
        await DataUtils.withdrawMoney(fromCardNumber, amount, description);
        
        // Reset form
        document.getElementById('withdraw-form').reset();
        await populateCardSelections(); // Repopulate dropdowns
        
        // Refresh dashboard
        await loadUserDashboard();
        
        alert('Withdrawal completed successfully!');
        
    } catch (error) {
        alert(`Withdrawal failed: ${error.message}`);
    } finally {
        FirebaseUtils.hideButtonLoading(submitButton);
    }
}

// Modal Functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Show card details modal
async function showCardDetails(cardId) {
    try {
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        // Update modal content
        document.getElementById('modal-card-number').textContent = formatCardNumberDisplay(card.cardNumber);
        document.getElementById('modal-card-holder').textContent = card.cardholder;
        document.getElementById('modal-card-expiry').textContent = `${card.expMonth}/${card.expYear}`;
        
        // Calculate balance and statistics
        const balance = await calculateCardBalance(card.cardNumber);
        const cardTransactions = await DataUtils.getTransactionsByCard(card.cardNumber);
        
        // Update balance
        document.getElementById('modal-balance-amount').textContent = `$${balance.toFixed(2)}`;
        const balanceElement = document.getElementById('modal-balance-amount');
        balanceElement.style.color = balance >= 0 ? '#10b981' : '#ef4444';
        
        // Calculate statistics
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        
        cardTransactions.forEach(transaction => {
            if (transaction.type === 'deposit') {
                totalDeposits += parseFloat(transaction.amount);
            } else {
                totalWithdrawals += parseFloat(transaction.amount);
            }
        });
        
        document.getElementById('modal-total-deposits').textContent = `$${totalDeposits.toFixed(2)}`;
        document.getElementById('modal-total-withdrawals').textContent = `$${totalWithdrawals.toFixed(2)}`;
        document.getElementById('modal-transaction-count').textContent = cardTransactions.length;
        
        showModal('card-details-modal');
        
    } catch (error) {
        console.error('Error showing card details:', error);
        alert('Failed to load card details');
    }
}

// Show transaction details modal
function showTransactionDetails(transactionData) {
    // Update modal content
    document.getElementById('modal-transaction-id').textContent = transactionData.id || 'N/A';
    document.getElementById('modal-transaction-date').textContent = formatDate(transactionData.date);
    document.getElementById('modal-transaction-type').textContent = transactionData.type;
    
    const amount = parseFloat(transactionData.amount);
    const isPositive = transactionData.type === 'deposit';
    const amountElement = document.getElementById('modal-transaction-amount');
    amountElement.textContent = `${isPositive ? '+' : '-'}$${amount.toFixed(2)}`;
    amountElement.style.color = isPositive ? '#10b981' : '#ef4444';
    
    document.getElementById('modal-transaction-card').textContent = formatCardNumberDisplay(transactionData.cardNumber);
    document.getElementById('modal-transaction-description').textContent = transactionData.description || 'No description';
    
    showModal('transaction-details-modal');
}

// Show balance card details modal
let currentBalanceCard = null;

async function showBalanceCardDetails() {
    if (!currentBalanceCard) {
        console.log('No balance card available');
        return;
    }
    
    try {
        // Update modal content
        document.getElementById('modal-card-number').textContent = formatCardNumberDisplay(currentBalanceCard.cardNumber);
        document.getElementById('modal-card-holder').textContent = currentBalanceCard.cardholder;
        document.getElementById('modal-card-expiry').textContent = `${currentBalanceCard.expMonth}/${currentBalanceCard.expYear}`;
        
        // Calculate balance and statistics
        const balance = await calculateCardBalance(currentBalanceCard.cardNumber);
        const cardTransactions = await DataUtils.getTransactionsByCard(currentBalanceCard.cardNumber);
        
        // Update balance
        document.getElementById('modal-balance-amount').textContent = `$${balance.toFixed(2)}`;
        const balanceElement = document.getElementById('modal-balance-amount');
        balanceElement.style.color = balance >= 0 ? '#10b981' : '#ef4444';
        
        // Calculate statistics
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        
        cardTransactions.forEach(transaction => {
            if (transaction.type === 'deposit') {
                totalDeposits += parseFloat(transaction.amount);
            } else {
                totalWithdrawals += parseFloat(transaction.amount);
            }
        });
        
        document.getElementById('modal-total-deposits').textContent = `$${totalDeposits.toFixed(2)}`;
        document.getElementById('modal-total-withdrawals').textContent = `$${totalWithdrawals.toFixed(2)}`;
        document.getElementById('modal-transaction-count').textContent = cardTransactions.length;
        
        showModal('card-details-modal');
        
    } catch (error) {
        console.error('Error showing balance card details:', error);
        alert('Failed to load card details');
    }
}

// Fallback function to load data from localStorage
function loadLocalStorageData() {
    try {
        const localCards = JSON.parse(localStorage.getItem('cards') || '[]');
        const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        
        // Update global arrays
        cards = localCards;
        transactions = localTransactions;
        
        // Refresh displays if admin is logged in
        if (currentUser === 'admin') {
            refreshCardTable();
            refreshAdminTransactionList();
        }
        
        console.log('Loaded data from localStorage as fallback');
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        // Initialize with empty arrays if both Firebase and localStorage fail
        cards = [];
        transactions = [];
    }
}

// Cleanup listeners on page unload
window.addEventListener('beforeunload', function() {
    if (cardsListener) {
        cardsListener();
    }
    if (transactionsListener) {
        transactionsListener();
    }
});
