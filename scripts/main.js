// Main JavaScript for SecureBank Card Creation

document.addEventListener('DOMContentLoaded', function() {
    const cardForm = document.getElementById('cardForm');
    const cardPreview = document.getElementById('cardPreview');
    const cardModal = document.getElementById('cardModal');
    const cardholderNameInput = document.getElementById('cardholderName');
    const cardTypeSelect = document.getElementById('cardType');

    let currentCard = null;

    // Initialize form handlers
    initializeForm();
    initializeModal();
    
    function initializeForm() {
        // Handle form submission
        cardForm.addEventListener('submit', handleFormSubmit);
        
        // Handle real-time preview updates
        cardholderNameInput.addEventListener('input', updatePreview);
        cardTypeSelect.addEventListener('change', updatePreview);
        
        // Format cardholder name input
        cardholderNameInput.addEventListener('input', function(e) {
            // Convert to uppercase and limit to letters and spaces
            let value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
            if (value !== e.target.value) {
                e.target.value = value;
            }
        });


    }

    function initializeModal() {
        // Close modal when clicking X or outside
        const closeBtn = cardModal.querySelector('.close');
        closeBtn.addEventListener('click', closeModal);
        
        cardModal.addEventListener('click', function(e) {
            if (e.target === cardModal) {
                closeModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && cardModal.classList.contains('show')) {
                closeModal();
            }
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            // Get form data
            const formData = new FormData(cardForm);
            const cardholderName = formData.get('cardholderName').trim();
            const cardType = formData.get('cardType');
            const phoneNumber = formData.get('phoneNumber').trim();
            const email = formData.get('email').trim();
            const address = formData.get('address').trim();
            const city = formData.get('city').trim();
            const state = formData.get('state').trim();
            const zipCode = formData.get('zipCode').trim();
            const country = formData.get('country');

            // Create billing address object
            const billingAddress = {
                street: address,
                city: city,
                state: state,
                zipCode: zipCode,
                country: country
            };

            // Generate card with billing information
            const cardData = cardGenerator.generateCard(cardType, cardholderName, 0, {
                phoneNumber: phoneNumber,
                email: email,
                billingAddress: billingAddress
            });
            
            // Save to storage
            currentCard = cardStorage.saveCard(cardData);
            
            if (currentCard) {
                // Show success modal
                showCardModal(currentCard);
                
                // Reset form
                cardForm.reset();
                updatePreview();
                
                // Add success animation
                showSuccessAnimation();
            } else {
                showError('Failed to create card. Please try again.');
            }
            
        } catch (error) {
            console.error('Error creating card:', error);
            showError('An error occurred while creating the card. Please try again.');
        }
    }

    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        clearErrors();
        
        // Validate cardholder name
        const cardholderName = cardholderNameInput.value.trim();
        if (!cardholderName) {
            showFieldError(cardholderNameInput, 'Cardholder name is required');
            isValid = false;
        } else if (cardholderName.length < 2) {
            showFieldError(cardholderNameInput, 'Name must be at least 2 characters');
            isValid = false;
        } else if (cardholderName.length > 25) {
            showFieldError(cardholderNameInput, 'Name cannot exceed 25 characters');
            isValid = false;
        }
        
        // Validate card type
        if (!cardTypeSelect.value) {
            showFieldError(cardTypeSelect, 'Please select a card type');
            isValid = false;
        }
        
        // Validate phone number
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        if (!phoneNumber) {
            showFieldError(document.getElementById('phoneNumber'), 'Phone number is required');
            isValid = false;
        }
        
        // Validate email
        const email = document.getElementById('email').value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            showFieldError(document.getElementById('email'), 'Email address is required');
            isValid = false;
        } else if (!emailPattern.test(email)) {
            showFieldError(document.getElementById('email'), 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate address fields
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const zipCode = document.getElementById('zipCode').value.trim();
        const country = document.getElementById('country').value;
        
        if (!address) {
            showFieldError(document.getElementById('address'), 'Street address is required');
            isValid = false;
        }
        if (!city) {
            showFieldError(document.getElementById('city'), 'City is required');
            isValid = false;
        }
        if (!state) {
            showFieldError(document.getElementById('state'), 'State/Province is required');
            isValid = false;
        }
        if (!zipCode) {
            showFieldError(document.getElementById('zipCode'), 'ZIP/Postal code is required');
            isValid = false;
        }
        if (!country) {
            showFieldError(document.getElementById('country'), 'Please select a country');
            isValid = false;
        }
        
        return isValid;
    }



    function updatePreview() {
        const cardType = cardTypeSelect.value;
        const cardholderName = cardholderNameInput.value.trim() || 'CARDHOLDER NAME';
        
        // Create preview data
        const previewData = {
            type: cardType,
            number: '•••• •••• •••• ••••',
            cardholder: cardholderName.toUpperCase(),
            expiry: 'MM/YY'
        };
        
        // Update card preview
        const cardElement = cardPreview.querySelector('.card-front');
        cardGenerator.updateCardPreview(cardElement, previewData);
        
        // Update card type specific styling
        if (cardType) {
            const cardTypeInfo = cardGenerator.getCardTypeInfo(cardType);
            if (cardTypeInfo) {
                cardElement.style.background = cardTypeInfo.color;
                const logoElement = cardElement.querySelector('.card-logo');
                if (logoElement) {
                    logoElement.textContent = cardTypeInfo.logo;
                }
            }
        } else {
            // Reset to default
            cardElement.style.background = 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)';
            const logoElement = cardElement.querySelector('.card-logo');
            if (logoElement) {
                logoElement.textContent = '';
            }
        }
    }

    function showCardModal(cardData) {
        // Populate modal with card data
        document.getElementById('modalCardId').textContent = cardData.id;
        document.getElementById('modalBalance').textContent = cardGenerator.formatCurrency(cardData.balance);
        document.getElementById('modalCreated').textContent = formatDate(cardData.createdAt);
        
        // Update card display in modal
        const modalCardElement = cardModal.querySelector('.card-front-full');
        const modalBackElement = cardModal.querySelector('.card-back');
        
        cardGenerator.updateCardPreview(modalCardElement, cardData);
        
        // Update CVV in back view
        document.getElementById('modalCvv').textContent = cardData.cvv;
        
        // Update card type styling
        const cardTypeInfo = cardGenerator.getCardTypeInfo(cardData.type);
        if (cardTypeInfo) {
            modalCardElement.className = `card-front-full ${cardData.type}`;
        }
        
        // Show modal
        cardModal.classList.add('show');
        cardModal.style.display = 'flex';
        
        // Focus management for accessibility
        const firstFocusable = cardModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    function closeModal() {
        cardModal.classList.remove('show');
        setTimeout(() => {
            cardModal.style.display = 'none';
        }, 300);
        
        // Return focus to form
        cardholderNameInput.focus();
    }

    function downloadCard() {
        if (!currentCard) {
            showError('No card data available for download');
            return;
        }
        
        try {
            // Create downloadable card information
            const cardInfo = {
                cardId: currentCard.id,
                cardNumber: currentCard.number,
                cardholder: currentCard.cardholder,
                expiryDate: currentCard.expiry,
                cvv: currentCard.cvv,
                cardType: currentCard.type,
                balance: cardGenerator.formatCurrency(currentCard.balance),
                status: currentCard.status,
                createdDate: formatDate(currentCard.createdAt),
                bankName: 'SecureBank'
            };
            
            // Create formatted text content
            const content = `
SECUREBANK DEBIT CARD DETAILS
==============================

Card ID: ${cardInfo.cardId}
Card Number: ${cardInfo.cardNumber}
Cardholder: ${cardInfo.cardholder}
Expiry Date: ${cardInfo.expiryDate}
CVV: ${cardInfo.cvv}
Card Type: ${cardInfo.cardType.toUpperCase()}
Current Balance: ${cardInfo.balance}
Status: ${cardInfo.status.toUpperCase()}
Created: ${cardInfo.createdDate}

==============================
Generated by SecureBank System
${new Date().toLocaleString()}

IMPORTANT: Keep this information secure and confidential.
Do not share your card details with unauthorized parties.
            `.trim();
            
            // Create and download file
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SecureBank_Card_${currentCard.id}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showSuccess('Card details downloaded successfully');
            
        } catch (error) {
            console.error('Error downloading card details:', error);
            showError('Failed to download card details. Please try again.');
        }
    }

    function showError(message) {
        // Create or update error element
        let errorElement = document.getElementById('formError');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'formError';
            errorElement.className = 'error-message';
            cardForm.appendChild(errorElement);
        }
        
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
        
        // Create error message element
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Remove error on input
        const removeError = () => {
            field.style.borderColor = '';
            errorElement.classList.remove('show');
            field.removeEventListener('input', removeError);
        };
        
        field.addEventListener('input', removeError);
    }

    function clearErrors() {
        // Clear form-level errors
        const formError = document.getElementById('formError');
        if (formError) {
            formError.classList.remove('show');
        }
        
        // Clear field-level errors
        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => {
            error.classList.remove('show');
        });
        
        // Reset field styling
        const fields = cardForm.querySelectorAll('input, select');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    }

    function showSuccess(message) {
        // Create temporary success message
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.textContent = message;
        successElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(successElement);
        
        setTimeout(() => {
            successElement.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(successElement);
            }, 300);
        }, 3000);
    }

    function showSuccessAnimation() {
        // Add success animation to form
        cardForm.style.transform = 'scale(0.98)';
        cardForm.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            cardForm.style.transform = 'scale(1)';
        }, 200);
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

    // Make functions globally available for modal buttons
    window.closeModal = closeModal;
    window.downloadCard = downloadCard;

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .field-error {
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(style);
});
