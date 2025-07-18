// Balance Check JavaScript for SecureBank

document.addEventListener('DOMContentLoaded', function() {
    const balanceForm = document.getElementById('balanceForm');
    const balanceResult = document.getElementById('balanceResult');
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    const historyModal = document.getElementById('historyModal');

    let currentCard = null;

    // Initialize balance form
    initializeBalanceForm();
    initializeModal();

    function initializeBalanceForm() {
        // Handle form submission
        balanceForm.addEventListener('submit', handleBalanceCheck);
        
        // Format inputs as user types
        cardNumberInput.addEventListener('input', formatCardNumberInput);
        expiryDateInput.addEventListener('input', formatExpiryInput);
        cvvInput.addEventListener('input', formatCVVInput);
        
        // Validate inputs on blur
        cardNumberInput.addEventListener('blur', validateCardNumber);
        expiryDateInput.addEventListener('blur', validateExpiryDate);
        cvvInput.addEventListener('blur', validateCVV);
    }

    function initializeModal() {
        // Close modal when clicking X or outside
        const closeBtn = historyModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeHistoryModal);
        }
        
        historyModal.addEventListener('click', function(e) {
            if (e.target === historyModal) {
                closeHistoryModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && historyModal.classList.contains('show')) {
                closeHistoryModal();
            }
        });
    }

    function formatCardNumberInput(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        // Limit length based on card type
        const maxLength = value.startsWith('34') || value.startsWith('37') ? 15 : 16;
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        // Format with spaces
        if (value.startsWith('34') || value.startsWith('37')) {
            // American Express: 4-6-5 format
            value = value.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
        } else {
            // Visa/Mastercard: 4-4-4-4 format
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        }
        
        e.target.value = value;
        
        // Clear previous errors when user starts typing
        clearFieldError(e.target);
    }

    function formatExpiryInput(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        e.target.value = value;
        clearFieldError(e.target);
    }

    function formatCVVInput(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        // Limit CVV length based on card type
        const cardNumber = cardNumberInput.value.replace(/\D/g, '');
        const isAmex = cardNumber.startsWith('34') || cardNumber.startsWith('37');
        const maxLength = isAmex ? 4 : 3;
        
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        e.target.value = value;
        clearFieldError(e.target);
    }

    function validateCardNumber() {
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        
        if (!cardNumber) {
            showFieldError(cardNumberInput, 'Card number is required');
            return false;
        }
        
        if (!cardGenerator.validateCardNumber(cardNumber)) {
            showFieldError(cardNumberInput, 'Invalid card number');
            return false;
        }
        
        return true;
    }

    function validateExpiryDate() {
        const expiry = expiryDateInput.value;
        
        if (!expiry) {
            showFieldError(expiryDateInput, 'Expiry date is required');
            return false;
        }
        
        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
            showFieldError(expiryDateInput, 'Invalid format. Use MM/YY');
            return false;
        }
        
        if (!cardGenerator.validateExpiryDate(expiry)) {
            showFieldError(expiryDateInput, 'Card has expired or invalid date');
            return false;
        }
        
        return true;
    }

    function validateCVV() {
        const cvv = cvvInput.value;
        const cardNumber = cardNumberInput.value.replace(/\D/g, '');
        const cardType = cardGenerator.getCardTypeFromNumber(cardNumber);
        
        if (!cvv) {
            showFieldError(cvvInput, 'CVV is required');
            return false;
        }
        
        if (!cardGenerator.validateCVV(cvv, cardType)) {
            const expectedLength = cardType === 'amex' ? 4 : 3;
            showFieldError(cvvInput, `CVV must be ${expectedLength} digits`);
            return false;
        }
        
        return true;
    }

    function handleBalanceCheck(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        hideBalanceResult();
        
        // Validate all fields
        const isCardNumberValid = validateCardNumber();
        const isExpiryValid = validateExpiryDate();
        const isCVVValid = validateCVV();
        
        if (!isCardNumberValid || !isExpiryValid || !isCVVValid) {
            return;
        }
        
        // Get form data
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        const expiryDate = expiryDateInput.value;
        const cvv = cvvInput.value;
        
        // Validate credentials against stored cards
        const validation = cardStorage.validateCardCredentials(cardNumber, expiryDate, cvv);
        
        if (!validation.valid) {
            showError(validation.error || 'Invalid card credentials');
            return;
        }
        
        // Display balance result
        currentCard = validation.card;
        displayBalanceResult(currentCard);
    }

    function displayBalanceResult(card) {
        try {
            // Update balance display
            document.getElementById('balanceAmount').textContent = parseFloat(card.balance).toFixed(2);
            
            // Update card details
            const cardType = cardGenerator.getCardTypeInfo(card.type);
            document.getElementById('resultCardType').textContent = cardType ? cardType.name : card.type.toUpperCase();
            document.getElementById('resultCardNumber').textContent = cardGenerator.maskCardNumber(card.number);
            document.getElementById('resultCardholder').textContent = card.cardholder;
            
            // Update status
            const statusElement = document.getElementById('resultStatus');
            statusElement.textContent = card.status.charAt(0).toUpperCase() + card.status.slice(1);
            statusElement.className = `value status status-${card.status}`;
            
            // Update last updated
            document.getElementById('resultLastUpdated').textContent = formatDate(card.updatedAt);
            
            // Show result section
            balanceResult.style.display = 'block';
            balanceResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Add success animation
            const balanceCard = balanceResult.querySelector('.balance-card');
            balanceCard.style.transform = 'translateY(20px)';
            balanceCard.style.opacity = '0';
            balanceCard.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                balanceCard.style.transform = 'translateY(0)';
                balanceCard.style.opacity = '1';
            }, 100);
            
        } catch (error) {
            console.error('Error displaying balance result:', error);
            showError('An error occurred while displaying the balance. Please try again.');
        }
    }

    function showTransactionHistory() {
        if (!currentCard) {
            showError('No card selected for transaction history');
            return;
        }
        
        try {
            // Get transactions for this card
            const transactions = cardStorage.getTransactionsByCardId(currentCard.id);
            const transactionList = document.getElementById('transactionList');
            
            // Clear previous content
            transactionList.innerHTML = '';
            
            if (transactions.length === 0) {
                // Show no transactions message
                transactionList.innerHTML = `
                    <div class="no-transactions">
                        <p>No transactions found for this card.</p>
                        <small>Transaction history will appear here once card is used.</small>
                    </div>
                `;
            } else {
                // Display transactions
                transactions.forEach(transaction => {
                    const transactionElement = createTransactionElement(transaction);
                    transactionList.appendChild(transactionElement);
                });
            }
            
            // Show modal
            historyModal.classList.add('show');
            historyModal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error showing transaction history:', error);
            showError('Failed to load transaction history. Please try again.');
        }
    }

    function createTransactionElement(transaction) {
        const element = document.createElement('div');
        element.className = 'transaction-item';
        
        const isCredit = transaction.type === 'credit' || transaction.amount > 0;
        const amountClass = isCredit ? 'credit' : 'debit';
        const amountSign = isCredit ? '+' : '-';
        
        element.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type">${transaction.description || transaction.type}</div>
                <div class="transaction-date">${formatDate(transaction.timestamp)}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountSign}${cardGenerator.formatCurrency(Math.abs(transaction.amount))}
            </div>
        `;
        
        return element;
    }

    function closeHistoryModal() {
        historyModal.classList.remove('show');
        setTimeout(() => {
            historyModal.style.display = 'none';
        }, 300);
    }

    function resetForm() {
        // Reset form fields
        balanceForm.reset();
        
        // Hide result section
        hideBalanceResult();
        
        // Clear errors
        clearErrors();
        
        // Reset current card
        currentCard = null;
        
        // Focus first input
        cardNumberInput.focus();
        
        // Scroll back to form
        balanceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideBalanceResult() {
        balanceResult.style.display = 'none';
    }

    function showError(message) {
        const errorElement = document.getElementById('balanceError');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }

    function showFieldError(field, message) {
        // Add error styling to field
        field.style.borderColor = '#ef4444';
        
        // Create or find error message element
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    function clearFieldError(field) {
        // Reset field styling
        field.style.borderColor = '';
        
        // Hide error message
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    function clearErrors() {
        // Clear main error
        const mainError = document.getElementById('balanceError');
        if (mainError) {
            mainError.classList.remove('show');
        }
        
        // Clear field errors
        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => {
            error.classList.remove('show');
        });
        
        // Reset field styling
        const fields = balanceForm.querySelectorAll('input');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Make functions globally available
    window.resetForm = resetForm;
    window.showTransactionHistory = showTransactionHistory;
    window.closeHistoryModal = closeHistoryModal;

    // Auto-focus first input on page load
    cardNumberInput.focus();
});
