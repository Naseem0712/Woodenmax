/**
 * Main Application
 * Initializes all modules and manages application flow for WoodenMax
 */

class App {
    constructor() {
        this.grillManager = window.grillManager;
        this.pergolaManager = window.pergolaManager;
        this.windowManager = window.windowManager;
        this.quotationManager = window.quotationManager;
        this.materialDB = window.materialDB;
        
        this.currentProduct = null;
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing WoodenMax Quotation Generator');
        
        // Show loading screen
        utils.showLoading(true);
        
        // Initialize material database first
        this.materialDB.init();
        
        // Initialize quotation manager
        this.quotationManager.init();
        
        // Initialize product managers with reference to quotation manager
        this.grillManager.init(this.quotationManager);
        this.pergolaManager.init(this.quotationManager);
        this.windowManager.init(this.quotationManager);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Hide loading screen
        utils.showLoading(false);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Product buttons
        const productButtons = document.querySelectorAll('.product-btn');
        productButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchProduct(button.dataset.product);
            });
        });
        
        // Handle key events
        document.addEventListener('keydown', (e) => {
            // Ctrl+S to save quotation
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.quotationManager.saveQuotation();
            }
            
            // Escape key to close any modal
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });
        
        // Handle offline/online status
        window.addEventListener('online', () => {
            utils.showNotification('You are now online');
        });
        
        window.addEventListener('offline', () => {
            utils.showNotification('You are offline. The app will continue to work, but some features may be limited.', true);
        });
    }

    /**
     * Switch active product
     * @param {string} product - The product to switch to ('grill', 'pergola', 'window')
     */
    switchProduct(product) {
        // Hide all product forms
        document.querySelectorAll('.product-form').forEach(form => {
            form.style.display = 'none';
        });
        
        // Remove active class from all product buttons
        document.querySelectorAll('.product-btn').forEach(button => {
            button.classList.remove('active');
        });
        
        // Set current product
        this.currentProduct = product;
        
        // Show the selected product form
        const productForm = document.getElementById(`${product}Form`);
        if (productForm) {
            productForm.style.display = 'block';
            
            // Add active class to the button
            const button = document.querySelector(`.product-btn[data-product="${product}"]`);
            if (button) {
                button.classList.add('active');
            }
        }
    }

    /**
     * Save application state
     */
    saveState() {
        const state = {
            grill: this.grillManager.saveState(),
            pergola: this.pergolaManager.saveState(),
            window: this.windowManager.saveState(),
            quotation: {
                items: this.quotationManager.items,
                subtotal: this.quotationManager.subtotal,
                discountRate: this.quotationManager.discountRate,
                discount: this.quotationManager.discount,
                gstRate: this.quotationManager.gstRate,
                gst: this.quotationManager.gst,
                total: this.quotationManager.total,
                additionalNotes: this.quotationManager.additionalNotes
            },
            currentProduct: this.currentProduct
        };
        
        utils.saveToLocalStorage('appState', state);
    }

    /**
     * Load application state
     */
    loadState() {
        const state = utils.loadFromLocalStorage('appState');
        
        if (!state) return;
        
        // Load product states
        this.grillManager.loadState(state.grill);
        this.pergolaManager.loadState(state.pergola);
        this.windowManager.loadState(state.window);
        
        // Load quotation state
        if (state.quotation) {
            this.quotationManager.items = state.quotation.items;
            this.quotationManager.subtotal = state.quotation.subtotal;
            this.quotationManager.discountRate = state.quotation.discountRate;
            this.quotationManager.discount = state.quotation.discount;
            this.quotationManager.gstRate = state.quotation.gstRate;
            this.quotationManager.gst = state.quotation.gst;
            this.quotationManager.total = state.quotation.total;
            this.quotationManager.additionalNotes = state.quotation.additionalNotes;
            
            // Update UI
            document.getElementById('discountRate').value = this.quotationManager.discountRate;
            document.getElementById('gstRate').value = this.quotationManager.gstRate;
            document.getElementById('additionalNotes').value = this.quotationManager.additionalNotes;
            
            this.quotationManager.renderItems();
            this.quotationManager.updateCalculations();
        }
        
        // Switch to last active product
        if (state.currentProduct) {
            this.switchProduct(state.currentProduct);
        }
    }
}

// Create and initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    
    // Try to load saved state
    try {
        app.loadState();
    } catch (error) {
        console.error('Error loading saved state:', error);
    }
    
    // Auto-save state every 30 seconds
    setInterval(() => {
        app.saveState();
    }, 30000);
    
    // Expose app globally for debugging
    window.app = app;
}); 