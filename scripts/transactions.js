// Transactions JavaScript for SecureBank

document.addEventListener('DOMContentLoaded', function() {
    const authSection = document.getElementById('authSection');
    const transactionSection = document.getElementById('transactionSection');
    const authForm = document.getElementById('authForm');
    const transactionForm = document.getElementById('transactionForm');
    const successModal = document.getElementById('successModal');
    
    // Form inputs
    const authCardNumberInput = document.getElementById('authCardNumber');
    const authExpiryDateInput = document.getElementById('authExpiryDate');
    const authCvvInput = document.getElementById('authCvv');
    const transactionTypeSelect = document.getElementById('transactionType');
    const recipientGroup = document.getElementById('recipientGroup');
    const recipientInput = document.getElementById('recipient');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const transactionSummary = document.getElementById('transactionSummary');

    let currentCard = null;
    let currentTransaction = null;

    // Initialize the page
    initializeTransactions();

    function initializeTransactions() {
        // Setup form handlers
        authForm.addEventListener('submit', handleAuthentication);
        transactionForm.addEventListener('submit', handleTransaction);
        
        // Setup input formatting
        authCardNumberInput.addEventListener('input', formatCardNumberInput);
        authExpiryDateInput.addEventListener('input', formatExpiryInput);
        authCvvInput.addEventListener('input', formatCVVInput);
        
        // Setup transaction type handler
        transactionTypeSelect.addEventListener('change', handleTransactionTypeChange);
        amountInput.addEventListener('input', updateTransactionSummary);
        
        // Setup modal
        initializeModal();
        
        // Focus first input
        authCardNumberInput.focus();
    }

    function initializeModal() {
        // Close modal when clicking outside or X
        successModal.addEventListener('click', function(e) {
            if (e.target === successModal) {
                closeSuccessModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && successModal.classList.contains('show')) {
                closeSuccessModal();
            }
        });
    }

    function formatCardNumberInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Limit length based on card type
        const maxLength = value.startsWith('34') || value.startsWith('37') ? 15 : 16;
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        // Format with spaces
        if (value.startsWith('34') || value.startsWith('37')) {
            value = value.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
        } else {
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        }
        
        e.target.value = value;
        clearFieldError(e.target);
    }

    function formatExpiryInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        e.target.value = value;
        clearFieldError(e.target);
    }

    function formatCVVInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        const cardNumber = authCardNumberInput.value.replace(/\D/g, '');
        const isAmex = cardNumber.startsWith('34') || cardNumber.startsWith('37');
        const maxLength = isAmex ? 4 : 3;
        
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
        }
        
        e.target.value = value;
        clearFieldError(e.target);
    }

    function handleAuthentication(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        
        // Get form data
        const cardNumber = authCardNumberInput.value.replace(/\s/g, '');
        const expiryDate = authExpiryDateInput.value;
        const cvv = authCvvInput.value;
        
        // Validate inputs
        if (!validateAuthInputs(cardNumber, expiryDate, cvv)) {
            return;
        }
        
        // Validate credentials
        const validation = cardStorage.validateCardCredentials(cardNumber, expiryDate, cvv);
        
        if (!validation.valid) {
            showAuthError(validation.error || 'Invalid card credentials');
            return;
        }
        
        // Success - show transaction form
        currentCard = validation.card;
        showTransactionForm();
    }

    function validateAuthInputs(cardNumber, expiryDate, cvv) {
        let isValid = true;
        
        if (!cardNumber || !cardGenerator.validateCardNumber(cardNumber)) {
            showFieldError(authCardNumberInput, 'Please enter a valid card number');
            isValid = false;
        }
        
        if (!expiryDate || !cardGenerator.validateExpiryDate(expiryDate)) {
            showFieldError(authExpiryDateInput, 'Please enter a valid expiry date');
            isValid = false;
        }
        
        const cardType = cardGenerator.getCardTypeFromNumber(cardNumber);
        if (!cvv || !cardGenerator.validateCVV(cvv, cardType)) {
            const expectedLength = cardType === 'amex' ? 4 : 3;
            showFieldError(authCvvInput, `CVV must be ${expectedLength} digits`);
            isValid = false;
        }
        
        return isValid;
    }

    function showTransactionForm() {
        // Hide auth section
        authSection.style.display = 'none';
        
        // Update card display
        document.getElementById('displayCardNumber').textContent = cardGenerator.maskCardNumber(currentCard.number);
        document.getElementById('displayCardholder').textContent = currentCard.cardholder;
        document.getElementById('displayBalance').textContent = cardGenerator.formatCurrency(currentCard.balance);
        
        // Show transaction section
        transactionSection.style.display = 'block';
        
        // Focus first input
        transactionTypeSelect.focus();
    }

    function handleTransactionTypeChange() {
        const type = transactionTypeSelect.value;
        
        // Show/hide recipient field based on transaction type
        if (type === 'transfer' || type === 'payment') {
            recipientGroup.style.display = 'block';
            recipientInput.required = true;
        } else {
            recipientGroup.style.display = 'none';
            recipientInput.required = false;
            recipientInput.value = '';
        }
        
        updateTransactionSummary();
    }

    function updateTransactionSummary() {
        const type = transactionTypeSelect.value;
        const amount = parseFloat(amountInput.value) || 0;
        
        if (!type || amount <= 0) {
            transactionSummary.style.display = 'none';
            return;
        }
        
        // Calculate fee based on transaction type
        let fee = 0;
        if (type === 'transfer') {
            fee = amount * 0.01; // 1% transfer fee
        } else if (type === 'payment') {
            fee = Math.min(amount * 0.025, 5); // 2.5% payment fee, max $5
        } else if (type === 'withdrawal') {
            fee = 2.50; // Flat withdrawal fee
        }
        
        const total = amount + fee;
        const isDebit = type === 'transfer' || type === 'payment' || type === 'withdrawal';
        const newBalance = isDebit ? currentCard.balance - total : currentCard.balance + amount;
        
        // Update summary display
        document.getElementById('summaryType').textContent = type.charAt(0).toUpperCase() + type.slice(1);
        document.getElementById('summaryAmount').textContent = cardGenerator.formatCurrency(amount);
        document.getElementById('summaryFee').textContent = cardGenerator.formatCurrency(fee);
        document.getElementById('summaryTotal').textContent = cardGenerator.formatCurrency(total);
        document.getElementById('summaryNewBalance').textContent = cardGenerator.formatCurrency(newBalance);
        
        // Show/hide summary
        transactionSummary.style.display = 'block';
        
        // Validate sufficient funds for debit transactions
        if (isDebit && total > currentCard.balance) {
            document.getElementById('summaryNewBalance').style.color = '#ef4444';
        } else {
            document.getElementById('summaryNewBalance').style.color = '';
        }
    }

    function handleTransaction(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearTransactionErrors();
        
        // Get form data
        const type = transactionTypeSelect.value;
        const recipient = recipientInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value.trim();
        
        // Validate transaction
        if (!validateTransaction(type, recipient, amount)) {
            return;
        }
        
        // Calculate transaction details
        let fee = 0;
        if (type === 'transfer') {
            fee = amount * 0.01;
        } else if (type === 'payment') {
            fee = Math.min(amount * 0.025, 5);
        } else if (type === 'withdrawal') {
            fee = 2.50;
        }
        
        const total = amount + fee;
        const isDebit = type === 'transfer' || type === 'payment' || type === 'withdrawal';
        const newBalance = isDebit ? currentCard.balance - total : currentCard.balance + amount;
        
        // Check sufficient funds
        if (isDebit && total > currentCard.balance) {
            showTransactionError('Insufficient funds for this transaction');
            return;
        }
        
        try {
            // Create transaction record
            const transactionData = {
                type: type,
                amount: isDebit ? -total : amount,
                description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} ${recipient ? `to ${recipient}` : ''}`,
                recipient: recipient,
                fee: fee,
                status: 'completed'
            };
            
            // Save transaction
            const transaction = cardStorage.addTransaction(currentCard.id, transactionData);
            
            if (!transaction) {
                showTransactionError('Failed to process transaction. Please try again.');
                return;
            }
            
            // Update card balance
            const updatedCard = cardStorage.updateCard(currentCard.id, { balance: newBalance });
            
            if (!updatedCard) {
                showTransactionError('Transaction processed but failed to update balance. Please contact support.');
                return;
            }
            
            // Update current card reference
            currentCard = updatedCard;
            currentTransaction = transaction;
            
            // Show success modal
            showSuccessModal(transaction, newBalance);
            
        } catch (error) {
            console.error('Transaction error:', error);
            showTransactionError('An error occurred while processing the transaction. Please try again.');
        }
    }

    function validateTransaction(type, recipient, amount) {
        let isValid = true;
        
        if (!type) {
            showFieldError(transactionTypeSelect, 'Please select a transaction type');
            isValid = false;
        }
        
        if ((type === 'transfer' || type === 'payment') && !recipient) {
            showFieldError(recipientInput, 'Recipient is required for this transaction type');
            isValid = false;
        }
        
        if (!amount || amount <= 0) {
            showFieldError(amountInput, 'Please enter a valid amount');
            isValid = false;
        } else if (amount > 10000) {
            showFieldError(amountInput, 'Maximum transaction amount is $10,000');
            isValid = false;
        }
        
        return isValid;
    }

    function showSuccessModal(transaction, newBalance) {
        // Populate modal data
        document.getElementById('modalTransactionId').textContent = transaction.id;
        document.getElementById('modalTransactionType').textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
        document.getElementById('modalTransactionAmount').textContent = cardGenerator.formatCurrency(Math.abs(transaction.amount));
        document.getElementById('modalTransactionDate').textContent = formatDate(transaction.timestamp);
        document.getElementById('modalNewBalance').textContent = cardGenerator.formatCurrency(newBalance);
        
        // Show modal
        successModal.classList.add('show');
        successModal.style.display = 'flex';
    }

    function closeSuccessModal() {
        successModal.classList.remove('show');
        setTimeout(() => {
            successModal.style.display = 'none';
        }, 300);
        
        // Reset form for new transaction
        resetTransactionForm();
    }

    function resetTransaction() {
        // Reset to authentication form
        currentCard = null;
        currentTransaction = null;
        
        // Show auth section
        authSection.style.display = 'block';
        transactionSection.style.display = 'none';
        
        // Clear forms
        authForm.reset();
        clearErrors();
        
        // Focus first input
        authCardNumberInput.focus();
    }

    function resetTransactionForm() {
        // Clear transaction form but keep card authenticated
        transactionForm.reset();
        transactionSummary.style.display = 'none';
        recipientGroup.style.display = 'none';
        clearTransactionErrors();
        
        // Update balance display
        document.getElementById('displayBalance').textContent = cardGenerator.formatCurrency(currentCard.balance);
        
        // Focus transaction type
        transactionTypeSelect.focus();
    }

    function downloadReceipt() {
        if (!currentTransaction || !currentCard) {
            showTransactionError('No transaction data available for download');
            return;
        }
        
        try {
            const receipt = `
SECUREBANK TRANSACTION RECEIPT
==============================

Transaction ID: ${currentTransaction.id}
Date: ${formatDate(currentTransaction.timestamp)}
Card: ${cardGenerator.maskCardNumber(currentCard.number)}
Cardholder: ${currentCard.cardholder}

TRANSACTION DETAILS
-------------------
Type: ${currentTransaction.type.charAt(0).toUpperCase() + currentTransaction.type.slice(1)}
Amount: ${cardGenerator.formatCurrency(Math.abs(currentTransaction.amount))}
${currentTransaction.recipient ? `Recipient: ${currentTransaction.recipient}` : ''}
${currentTransaction.description ? `Description: ${currentTransaction.description}` : ''}
${currentTransaction.fee ? `Fee: ${cardGenerator.formatCurrency(currentTransaction.fee)}` : ''}
Status: ${currentTransaction.status.toUpperCase()}

BALANCE INFORMATION
-------------------
Previous Balance: ${cardGenerator.formatCurrency(currentCard.balance - currentTransaction.amount)}
Transaction Amount: ${currentTransaction.amount < 0 ? '-' : '+'}${cardGenerator.formatCurrency(Math.abs(currentTransaction.amount))}
New Balance: ${cardGenerator.formatCurrency(currentCard.balance)}

==============================
Generated by SecureBank System
${new Date().toLocaleString()}

Thank you for banking with SecureBank!
            `.trim();
            
            // Create and download file
            const blob = new Blob([receipt], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SecureBank_Receipt_${currentTransaction.id}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Download error:', error);
            showTransactionError('Failed to download receipt. Please try again.');
        }
    }

    function showAuthError(message) {
        const errorElement = document.getElementById('authError');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }

    function showTransactionError(message) {
        const errorElement = document.getElementById('transactionError');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }

    function showFieldError(field, message) {
        field.style.borderColor = '#ef4444';
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        const removeError = () => {
            field.style.borderColor = '';
            errorElement.classList.remove('show');
            field.removeEventListener('input', removeError);
        };
        
        field.addEventListener('input', removeError);
    }

    function clearFieldError(field) {
        field.style.borderColor = '';
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    function clearErrors() {
        const authError = document.getElementById('authError');
        if (authError) {
            authError.classList.remove('show');
        }
        
        const fieldErrors = authForm.querySelectorAll('.field-error');
        fieldErrors.forEach(error => {
            error.classList.remove('show');
        });
        
        const fields = authForm.querySelectorAll('input, select');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    }

    function clearTransactionErrors() {
        const transactionError = document.getElementById('transactionError');
        if (transactionError) {
            transactionError.classList.remove('show');
        }
        
        const fieldErrors = transactionForm.querySelectorAll('.field-error');
        fieldErrors.forEach(error => {
            error.classList.remove('show');
        });
        
        const fields = transactionForm.querySelectorAll('input, select');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Make functions globally available
    window.resetTransaction = resetTransaction;
    window.closeSuccessModal = closeSuccessModal;
    window.downloadReceipt = downloadReceipt;
});