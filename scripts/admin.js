// Admin Panel JavaScript for SecureBank

document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const cardsTable = document.getElementById('cardsTable');
    const cardsTableBody = document.getElementById('cardsTableBody');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const editModal = document.getElementById('editModal');
    const viewModal = document.getElementById('viewModal');

    let currentEditCard = null;
    let currentViewCard = null;
    let isLoggedIn = false;

    // Initialize admin panel
    initializeAdmin();

    function initializeAdmin() {
        // Check if already logged in (session check)
        checkLoginStatus();
        
        // Initialize login form
        loginForm.addEventListener('submit', handleLogin);
        
        // Initialize search and filters
        searchInput.addEventListener('input', debounce(filterCards, 300));
        statusFilter.addEventListener('change', filterCards);
        typeFilter.addEventListener('change', filterCards);
        
        // Initialize modals
        initializeModals();
    }

    function checkLoginStatus() {
        // In a real application, you would check session/token
        // For this demo, we'll check sessionStorage
        const adminSession = sessionStorage.getItem('admin_logged_in');
        if (adminSession === 'true') {
            showDashboard();
        } else {
            showLogin();
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        
        // Clear previous errors
        const errorElement = document.getElementById('loginError');
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        
        // Validate credentials
        const admin = cardStorage.getAdmin();
        if (!admin) {
            showLoginError('Admin configuration error. Please contact support.');
            return;
        }
        
        if (username === admin.username && password === admin.password) {
            // Successful login
            isLoggedIn = true;
            sessionStorage.setItem('admin_logged_in', 'true');
            
            // Update admin last login
            cardStorage.setAdmin({
                ...admin,
                lastLogin: new Date().toISOString(),
                loginAttempts: 0
            });
            
            showDashboard();
            loginForm.reset();
        } else {
            // Failed login
            const attempts = (admin.loginAttempts || 0) + 1;
            cardStorage.setAdmin({
                ...admin,
                loginAttempts: attempts
            });
            
            showLoginError('Invalid username or password. Please try again.');
            
            // Add delay after multiple failed attempts
            if (attempts >= 3) {
                setTimeout(() => {
                    loginForm.querySelector('button[type="submit"]').disabled = false;
                }, 3000);
                loginForm.querySelector('button[type="submit"]').disabled = true;
                showLoginError('Too many failed attempts. Please wait 3 seconds.');
            }
        }
    }

    function showLogin() {
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        isLoggedIn = false;
    }

    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        isLoggedIn = true;
        
        // Load dashboard data
        updateDashboardStats();
        loadCardsTable();
    }

    function updateDashboardStats() {
        const stats = cardStorage.getCardStats();
        
        // Update stat cards
        document.getElementById('totalCards').textContent = stats.total;
        document.getElementById('totalBalance').textContent = cardGenerator.formatCurrency(stats.totalBalance);
        document.getElementById('activeCards').textContent = stats.active;
        document.getElementById('todayCards').textContent = stats.todayCreated;
    }

    function loadCardsTable(cards = null) {
        // Get cards data
        const allCards = cards || cardStorage.getAllCards();
        
        // Clear existing table content
        cardsTableBody.innerHTML = '';
        
        if (allCards.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 3rem; color: #64748b;">
                    <div>
                        <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">No cards found</p>
                        <small>Cards will appear here once they are created</small>
                    </div>
                </td>
            `;
            cardsTableBody.appendChild(row);
            return;
        }
        
        // Sort cards by creation date (newest first)
        allCards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Populate table
        allCards.forEach(card => {
            const row = createCardRow(card);
            cardsTableBody.appendChild(row);
        });
    }

    function createCardRow(card) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><code>${card.id}</code></td>
            <td>${card.cardholder}</td>
            <td><code>${cardGenerator.maskCardNumber(card.number)}</code></td>
            <td>
                <span class="card-type ${card.type}">${cardGenerator.getCardTypeInfo(card.type)?.name || card.type}</span>
            </td>
            <td>${cardGenerator.formatCurrency(card.balance)}</td>
            <td>
                <span class="status-${card.status}">${card.status}</span>
            </td>
            <td>${formatDateShort(card.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewCard('${card.id}')" title="View Details">👁️</button>
                    <button class="action-btn edit" onclick="editCard('${card.id}')" title="Edit Card">✏️</button>
                    <button class="action-btn delete" onclick="deleteCard('${card.id}')" title="Delete Card">🗑️</button>
                </div>
            </td>
        `;
        return row;
    }

    function filterCards() {
        const query = searchInput.value.trim();
        const statusFilterValue = statusFilter.value;
        const typeFilterValue = typeFilter.value;
        
        const filters = {};
        if (statusFilterValue) filters.status = statusFilterValue;
        if (typeFilterValue) filters.type = typeFilterValue;
        
        const filteredCards = cardStorage.searchCards(query, filters);
        loadCardsTable(filteredCards);
    }

    function initializeModals() {
        // Edit modal
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
        
        // View modal
        viewModal.addEventListener('click', function(e) {
            if (e.target === viewModal) {
                closeViewModal();
            }
        });
        
        // Escape key handling
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (editModal.classList.contains('show')) {
                    closeEditModal();
                }
                if (viewModal.classList.contains('show')) {
                    closeViewModal();
                }
            }
        });
    }

    function viewCard(cardId) {
        const card = cardStorage.getCardById(cardId);
        if (!card) {
            showAlert('Card not found', 'error');
            return;
        }
        
        currentViewCard = card;
        
        // Populate view modal
        document.getElementById('viewCardId').textContent = card.id;
        document.getElementById('viewBalance').textContent = cardGenerator.formatCurrency(card.balance);
        document.getElementById('viewStatus').textContent = card.status;
        document.getElementById('viewStatus').className = `status-${card.status}`;
        document.getElementById('viewCreated').textContent = formatDate(card.createdAt);
        document.getElementById('viewModified').textContent = formatDate(card.updatedAt);
        
        // Update card display
        const cardElement = viewModal.querySelector('.card-front-full');
        cardGenerator.updateCardPreview(cardElement, card);
        document.getElementById('viewCvv').textContent = card.cvv;
        
        // Update card styling
        const cardTypeInfo = cardGenerator.getCardTypeInfo(card.type);
        if (cardTypeInfo) {
            cardElement.className = `card-front-full ${card.type}`;
        }
        
        // Show modal
        viewModal.classList.add('show');
        viewModal.style.display = 'flex';
    }

    function editCard(cardId) {
        const card = cardStorage.getCardById(cardId);
        if (!card) {
            showAlert('Card not found', 'error');
            return;
        }
        
        currentEditCard = card;
        
        // Populate edit form
        document.getElementById('editCardId').value = card.id;
        document.getElementById('editCardholderName').value = card.cardholder;
        document.getElementById('editBalance').value = card.balance;
        document.getElementById('editStatus').value = card.status;
        
        // Show modal
        editModal.classList.add('show');
        editModal.style.display = 'flex';
        
        // Focus first input
        document.getElementById('editCardholderName').focus();
    }

    function deleteCard(cardId) {
        const card = cardStorage.getCardById(cardId);
        if (!card) {
            showAlert('Card not found', 'error');
            return;
        }
        
        // Confirm deletion
        if (confirm(`Are you sure you want to delete the card for ${card.cardholder}?\n\nCard ID: ${card.id}\nThis action cannot be undone.`)) {
            if (cardStorage.deleteCard(cardId)) {
                showAlert('Card deleted successfully', 'success');
                updateDashboardStats();
                filterCards(); // Refresh table
            } else {
                showAlert('Failed to delete card', 'error');
            }
        }
    }

    function saveCardEdit() {
        if (!currentEditCard) {
            showAlert('No card selected for editing', 'error');
            return;
        }
        
        const form = document.getElementById('editForm');
        const formData = new FormData(form);
        
        const updateData = {
            cardholder: formData.get('editCardholderName') || currentEditCard.cardholder,
            balance: parseFloat(formData.get('editBalance')) || currentEditCard.balance,
            status: formData.get('editStatus') || currentEditCard.status
        };
        
        // Validate data
        if (!updateData.cardholder.trim()) {
            showAlert('Cardholder name is required', 'error');
            return;
        }
        
        if (updateData.balance < 0 || updateData.balance > 50000) {
            showAlert('Balance must be between $0 and $50,000', 'error');
            return;
        }
        
        // Update card
        const updatedCard = cardStorage.updateCard(currentEditCard.id, updateData);
        if (updatedCard) {
            showAlert('Card updated successfully', 'success');
            closeEditModal();
            updateDashboardStats();
            filterCards(); // Refresh table
        } else {
            showAlert('Failed to update card', 'error');
        }
    }

    function closeEditModal() {
        editModal.classList.remove('show');
        setTimeout(() => {
            editModal.style.display = 'none';
        }, 300);
        currentEditCard = null;
    }

    function closeViewModal() {
        viewModal.classList.remove('show');
        setTimeout(() => {
            viewModal.style.display = 'none';
        }, 300);
        currentViewCard = null;
    }

    function exportData() {
        try {
            const data = cardStorage.exportAllData();
            if (!data) {
                showAlert('Failed to export data', 'error');
                return;
            }
            
            // Create and download file
            const blob = new Blob([data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SecureBank_Export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showAlert('Data exported successfully', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            showAlert('Failed to export data', 'error');
        }
    }

    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('admin_logged_in');
            isLoggedIn = false;
            showLogin();
            showAlert('Logged out successfully', 'success');
        }
    }

    function showLoginError(message) {
        const errorElement = document.getElementById('loginError');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }

    function showAlert(message, type = 'info') {
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.textContent = message;
        alertElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
            background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#3b82f6'};
            color: white;
            font-weight: 500;
        `;
        
        document.body.appendChild(alertElement);
        
        setTimeout(() => {
            alertElement.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(alertElement)) {
                    document.body.removeChild(alertElement);
                }
            }, 300);
        }, 3000);
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

    function formatDateShort(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Make functions globally available
    window.viewCard = viewCard;
    window.editCard = editCard;
    window.deleteCard = deleteCard;
    window.saveCardEdit = saveCardEdit;
    window.closeEditModal = closeEditModal;
    window.closeViewModal = closeViewModal;
    window.exportData = exportData;
    window.logout = logout;
});
