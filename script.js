// Application State
let currentUser = null;
let cards = JSON.parse(localStorage.getItem('cards')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'singhdebit2025'
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Initialize year dropdowns
    populateYearDropdowns();
    
    // Set default date for transaction form
    const today = new Date().toISOString().split('T')[0];
    const transactionDateInput = document.getElementById('transaction-date');
    if (transactionDateInput) {
        transactionDateInput.value = today;
    }
    
    // Load initial data
    refreshCardTable();
    populateTransactionCardSelect();
}

function setupEventListeners() {
    // Card form submission
    document.getElementById('card-form').addEventListener('submit', handleCardSubmission);
    
    // Admin login form
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    
    // New card form
    document.getElementById('new-card-form').addEventListener('submit', handleNewCardSubmission);
    
    // Transaction form
    document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmission);
    
    // Card number formatting
    document.getElementById('card-number').addEventListener('input', formatCardNumber);
    document.getElementById('new-card-number').addEventListener('input', formatCardNumber);
    
    // CVV validation
    document.getElementById('cvv').addEventListener('input', validateCVV);
    document.getElementById('new-cvv').addEventListener('input', validateCVV);
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
function handleCardSubmission(event) {
    event.preventDefault();
    
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
    
    // Find card in storage
    const card = cards.find(c => 
        c.cardNumber === cardNumber && 
        c.expMonth === expMonth && 
        c.expYear === expYear && 
        c.cvv === cvv
    );
    
    if (card) {
        displayCardBalance(card);
    } else {
        showError('card-number-error', 'Card not found. Please check your details or contact administrator.');
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
function displayCardBalance(card) {
    const balanceDisplay = document.getElementById('balance-display');
    const cardTransactions = transactions.filter(t => t.cardNumber === card.cardNumber);
    
    // Calculate current balance
    let currentBalance = parseFloat(card.balance);
    cardTransactions.forEach(transaction => {
        if (transaction.type === 'deposit') {
            currentBalance += parseFloat(transaction.amount);
        } else {
            currentBalance -= parseFloat(transaction.amount);
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
    
    balanceDisplay.style.display = 'block';
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
        transactionItem.className = 'transaction-item';
        
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

// Admin login
function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        currentUser = 'admin';
        showPage('admin-dashboard');
    } else {
        showError('admin-login-error', 'Invalid credentials. Please try again.');
    }
}

// Logout
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
function handleNewCardSubmission(event) {
    event.preventDefault();
    
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
    if (cards.find(c => c.cardNumber === cardNumber)) {
        alert('Card with this number already exists');
        return;
    }
    
    // Create new card
    const newCard = {
        cardNumber,
        cardholder,
        expMonth,
        expYear,
        cvv,
        balance: parseFloat(balance),
        createdAt: new Date().toISOString()
    };
    
    cards.push(newCard);
    saveCards();
    
    // Reset form and hide
    hideAddCardForm();
    refreshCardTable();
    populateTransactionCardSelect();
    
    alert('Card added successfully!');
}

// Refresh card table
function refreshCardTable() {
    const tableBody = document.getElementById('card-table-body');
    tableBody.innerHTML = '';
    
    cards.forEach((card, index) => {
        const row = document.createElement('tr');
        
        // Calculate current balance
        const cardTransactions = transactions.filter(t => t.cardNumber === card.cardNumber);
        let currentBalance = parseFloat(card.balance);
        cardTransactions.forEach(transaction => {
            if (transaction.type === 'deposit') {
                currentBalance += parseFloat(transaction.amount);
            } else {
                currentBalance -= parseFloat(transaction.amount);
            }
        });
        
        row.innerHTML = `
            <td>${formatCardNumberDisplay(card.cardNumber)}</td>
            <td>${card.cardholder}</td>
            <td>${card.expMonth}/${card.expYear}</td>
            <td style="color: ${currentBalance >= 0 ? '#10b981' : '#ef4444'}">$${currentBalance.toFixed(2)}</td>
            <td class="table-actions">
                <button class="edit-btn" onclick="editCard(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteCard(${index})">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Edit card
function editCard(index) {
    const card = cards[index];
    const newBalance = prompt('Enter new balance:', card.balance);
    
    if (newBalance !== null && !isNaN(newBalance)) {
        card.balance = parseFloat(newBalance);
        saveCards();
        refreshCardTable();
        alert('Card balance updated successfully!');
    }
}

// Delete card
function deleteCard(index) {
    if (confirm('Are you sure you want to delete this card?')) {
        const cardNumber = cards[index].cardNumber;
        
        // Remove card
        cards.splice(index, 1);
        
        // Remove associated transactions
        transactions = transactions.filter(t => t.cardNumber !== cardNumber);
        
        saveCards();
        saveTransactions();
        refreshCardTable();
        populateTransactionCardSelect();
        
        alert('Card deleted successfully!');
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
function handleTransactionSubmission(event) {
    event.preventDefault();
    
    const cardNumber = document.getElementById('transaction-card').value;
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('transaction-description').value;
    
    if (!cardNumber || !type || !amount || !date || !description) {
        alert('Please fill in all fields');
        return;
    }
    
    if (amount <= 0) {
        alert('Amount must be greater than 0');
        return;
    }
    
    // Create new transaction
    const newTransaction = {
        cardNumber,
        type,
        amount,
        date,
        description,
        createdAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    saveTransactions();
    
    // Reset form
    document.getElementById('transaction-form').reset();
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    
    // Refresh displays
    refreshCardTable();
    displayAllTransactions();
    
    alert('Transaction recorded successfully!');
}

// Display all transactions in admin panel
function displayAllTransactions() {
    const transactionList = document.getElementById('admin-transaction-list');
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p>No transactions found.</p>';
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const card = cards.find(c => c.cardNumber === transaction.cardNumber);
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        const amount = parseFloat(transaction.amount);
        const isPositive = transaction.type === 'deposit';
        
        transactionItem.innerHTML = `
            <div class="transaction-details">
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-type">${transaction.type} - ${card ? card.cardholder : 'Unknown Card'}</div>
            </div>
            <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : '-'}$${amount.toFixed(2)}
            </div>
        `;
        
        transactionList.appendChild(transactionItem);
    });
}

// Save data to localStorage
function saveCards() {
    localStorage.setItem('cards', JSON.stringify(cards));
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initialize with sample data if no cards exist
if (cards.length === 0) {
    const sampleCards = [
        {
            cardNumber: '1234567890123456',
            cardholder: 'John Doe',
            expMonth: '12',
            expYear: '2027',
            cvv: '123',
            balance: 1500.00,
            createdAt: new Date().toISOString()
        },
        {
            cardNumber: '9876543210987654',
            cardholder: 'Jane Smith',
            expMonth: '06',
            expYear: '2026',
            cvv: '456',
            balance: 2750.50,
            createdAt: new Date().toISOString()
        }
    ];
    
    cards = sampleCards;
    saveCards();
}

// Initialize with sample transactions if none exist
if (transactions.length === 0) {
    const sampleTransactions = [
        {
            cardNumber: '1234567890123456',
            type: 'deposit',
            amount: 500.00,
            date: '2025-07-15',
            description: 'Salary deposit',
            createdAt: new Date().toISOString()
        },
        {
            cardNumber: '1234567890123456',
            type: 'purchase',
            amount: 75.25,
            date: '2025-07-16',
            description: 'Grocery shopping',
            createdAt: new Date().toISOString()
        },
        {
            cardNumber: '9876543210987654',
            type: 'deposit',
            amount: 1000.00,
            date: '2025-07-14',
            description: 'Freelance payment',
            createdAt: new Date().toISOString()
        }
    ];
    
    transactions = sampleTransactions;
    saveTransactions();
}

// Auto-refresh admin transaction list when switching to transactions tab
document.addEventListener('click', function(event) {
    if (event.target.textContent === 'Transaction Entry') {
        setTimeout(displayAllTransactions, 100);
    }
});
