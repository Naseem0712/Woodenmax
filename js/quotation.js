/**
 * Quotation Manager
 * Handles all quotation-related operations including totals, taxes, and export
 */

class QuotationManager {
    constructor() {
        this.items = [];
        this.subtotal = 0;
        this.discount = 0;
        this.discountRate = 0;
        this.gst = 0;
        this.gstRate = 18; // Default GST rate
        this.total = 0;
        this.companyInfo = null;
        this.customerInfo = null;
        this.additionalNotes = '';
        this.stockLengths = [];
    }

    /**
     * Initialize the Quotation Manager
     */
    init() {
        // Get form elements
        this.companyInfoForm = document.getElementById('companyInfoForm');
        this.customerInfoForm = document.getElementById('customerInfoForm');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved company and customer info
        this.loadCompanyInfo();
        this.loadCustomerInfo();
        
        // Initialize stock lengths array
        this.stockLengths = [];
        
        // Set current year for footer
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    }

    /**
     * Set up event listeners for the quotation section
     */
    setupEventListeners() {
        // Company info modal
        const companyInfoBtn = document.getElementById('companyInfoBtn');
        const companyInfoModal = document.getElementById('companyInfoModal');
        const companyInfoForm = document.getElementById('companyInfoForm');
        
        companyInfoBtn.addEventListener('click', () => {
            companyInfoModal.style.display = 'block';
        });
        
        companyInfoModal.querySelector('.close').addEventListener('click', () => {
            companyInfoModal.style.display = 'none';
        });
        
        companyInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCompanyInfo();
            companyInfoModal.style.display = 'none';
        });
        
        // Customer info modal
        const customerInfoBtn = document.getElementById('customerInfoBtn');
        const customerInfoModal = document.getElementById('customerInfoModal');
        const customerInfoForm = document.getElementById('customerInfoForm');
        
        customerInfoBtn.addEventListener('click', () => {
            customerInfoModal.style.display = 'block';
        });
        
        customerInfoModal.querySelector('.close').addEventListener('click', () => {
            customerInfoModal.style.display = 'none';
        });
        
        customerInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomerInfo();
            customerInfoModal.style.display = 'none';
        });
        
        // Clear quotation button
        document.getElementById('clearQuotationBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the quotation?')) {
                this.clearQuotation();
            }
        });
        
        // GST and Discount rate inputs
        document.getElementById('gstRate').addEventListener('input', () => {
            this.updateCalculations();
        });
        
        document.getElementById('discountRate').addEventListener('input', () => {
            this.updateCalculations();
        });
        
        // Export PDF button
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
        });
        
        // Save Quotation button
        document.getElementById('saveQuotationBtn').addEventListener('click', () => {
            this.saveQuotation();
        });
        
        // Load Quotation button
        document.getElementById('loadQuotationBtn').addEventListener('click', () => {
            this.showLoadQuotationDialog();
        });
        
        // Additional notes word count
        const additionalNotes = document.getElementById('additionalNotes');
        const wordCount = document.getElementById('wordCount');
        
        additionalNotes.addEventListener('input', () => {
            const count = utils.countWords(additionalNotes.value);
            wordCount.textContent = count;
            
            if (count > 250) {
                wordCount.style.color = '#e74c3c';
            } else {
                wordCount.style.color = 'inherit';
            }
            
            this.additionalNotes = additionalNotes.value;
        });
        
        // Set current year in footer
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === companyInfoModal) {
                companyInfoModal.style.display = 'none';
            }
            if (event.target === customerInfoModal) {
                customerInfoModal.style.display = 'none';
            }
        });
        
        // Multiple stock lengths toggle
        document.getElementById('useMultipleStockLengths').addEventListener('change', (e) => {
            const container = document.getElementById('multipleStockLengthsContainer');
            container.style.display = e.target.checked ? 'block' : 'none';
            
            // Initialize with default length
            if (e.target.checked && this.stockLengths.length === 0) {
                const defaultLength = parseInt(document.getElementById('stockLength').value) || 6000;
                this.stockLengths.push(defaultLength);
                this.renderStockLengths();
            }
        });
        
        // Add stock length button
        document.getElementById('addStockLengthBtn').addEventListener('click', () => {
            this.addStockLength();
        });
        
        // Enter key for new stock length
        document.getElementById('newStockLength').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.addStockLength();
            }
        });
    }

    /**
     * Save company information
     */
    saveCompanyInfo() {
        this.companyInfo = {
            companyName: document.getElementById('companyName').value,
            companyGST: document.getElementById('companyGST').value,
            companyEmail: document.getElementById('companyEmail').value,
            companyWebsite: document.getElementById('companyWebsite').value,
            companyAddress: document.getElementById('companyAddress').value,
            companyLogo: document.getElementById('companyLogo').value
        };
        
        // Handle logo upload
        const logoUpload = document.getElementById('companyLogoUpload');
        if (logoUpload.files && logoUpload.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.companyInfo.companyLogoData = e.target.result;
                this.updateLogoPreview();
            };
            reader.readAsDataURL(logoUpload.files[0]);
        }
        
        // Save to localStorage
        utils.saveToLocalStorage('companyInfo', this.companyInfo);
        utils.showNotification('Company information saved');
    }

    /**
     * Update logo preview
     */
    updateLogoPreview() {
        const logoPreview = document.getElementById('logoPreview');
        
        if (this.companyInfo.companyLogoData) {
            logoPreview.innerHTML = `<img src="${this.companyInfo.companyLogoData}" alt="Company Logo">`;
        } else if (this.companyInfo.companyLogo) {
            logoPreview.innerHTML = `<img src="${this.companyInfo.companyLogo}" alt="Company Logo">`;
        } else {
            logoPreview.innerHTML = 'Logo preview';
        }
    }

    /**
     * Load company information from localStorage
     */
    loadCompanyInfo() {
        const savedInfo = utils.loadFromLocalStorage('companyInfo');
        
        if (savedInfo) {
            this.companyInfo = savedInfo;
            
            // Populate form
            document.getElementById('companyName').value = savedInfo.companyName || '';
            document.getElementById('companyGST').value = savedInfo.companyGST || '';
            document.getElementById('companyEmail').value = savedInfo.companyEmail || '';
            document.getElementById('companyWebsite').value = savedInfo.companyWebsite || '';
            document.getElementById('companyAddress').value = savedInfo.companyAddress || '';
            document.getElementById('companyLogo').value = savedInfo.companyLogo || '';
            
            this.updateLogoPreview();
        }
    }

    /**
     * Save customer information
     */
    saveCustomerInfo() {
        this.customerInfo = {
            customerName: document.getElementById('customerName').value,
            contactPerson: document.getElementById('contactPerson').value,
            customerAddress: document.getElementById('customerAddress').value,
            customerPhone: document.getElementById('customerPhone').value,
            customerEmail: document.getElementById('customerEmail').value,
            quotationTitle: document.getElementById('quotationTitle').value
        };
        
        // Save to localStorage
        utils.saveToLocalStorage('customerInfo', this.customerInfo);
        utils.showNotification('Customer information saved');
    }

    /**
     * Load customer information from localStorage
     */
    loadCustomerInfo() {
        const savedInfo = utils.loadFromLocalStorage('customerInfo');
        
        if (savedInfo) {
            this.customerInfo = savedInfo;
            
            // Populate form
            document.getElementById('customerName').value = savedInfo.customerName || '';
            document.getElementById('contactPerson').value = savedInfo.contactPerson || '';
            document.getElementById('customerAddress').value = savedInfo.customerAddress || '';
            document.getElementById('customerPhone').value = savedInfo.customerPhone || '';
            document.getElementById('customerEmail').value = savedInfo.customerEmail || '';
            document.getElementById('quotationTitle').value = savedInfo.quotationTitle || '';
        }
    }

    /**
     * Add an item to the quotation
     * @param {Object} item - The item to add
     */
    addItem(item) {
        // Generate an ID for the item if it doesn't have one
        if (!item.id) {
            item.id = utils.generateId();
        }
        
        this.items.push(item);
        this.renderItems();
        this.updateCalculations();
        
        // Emit an event for other components (like app's product indexing)
        const itemAddedEvent = new CustomEvent('quotationItemAdded', { 
            detail: { item: item },
            bubbles: true 
        });
        document.dispatchEvent(itemAddedEvent);
    }

    /**
     * Render quotation items table
     */
    renderItems() {
        const tbody = document.getElementById('quotationTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (this.items.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7">No items added yet</td>`;
            tbody.appendChild(row);
            return;
        }
        
        this.items.forEach(item => {
            const row = document.createElement('tr');
            
            // Format rate based on item type
            let rateDisplay;
            if (item.type === 'Window') {
                rateDisplay = 'Various';
            } else if (item.rate) {
                rateDisplay = `₹${utils.formatCurrency(item.rate)} per ${item.unit}`;
            } else {
                rateDisplay = '-';
            }
            
            // Use indexed description if available
            const displayDescription = item.indexedDescription || item.description || item.name || '';
            
            row.innerHTML = `
                <td>${item.type}</td>
                <td>${displayDescription}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${rateDisplay}</td>
                <td>₹${utils.formatCurrency(item.amount)}</td>
                <td>
                    <button class="delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add delete button event
            row.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteItem(item.id);
            });
            
            tbody.appendChild(row);
        });
    }

    /**
     * Update calculations (subtotal, discount, GST, total)
     */
    updateCalculations() {
        // Calculate subtotal
        this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
        
        // Get discount rate and calculate discount
        this.discountRate = parseFloat(document.getElementById('discountRate').value) || 0;
        this.discount = (this.subtotal * this.discountRate) / 100;
        
        // Get GST rate and calculate GST
        this.gstRate = parseFloat(document.getElementById('gstRate').value) || 0;
        this.gst = ((this.subtotal - this.discount) * this.gstRate) / 100;
        
        // Calculate total
        this.total = this.subtotal - this.discount + this.gst;
        
        // Update UI
        document.getElementById('subtotal').textContent = `₹${utils.formatCurrency(this.subtotal)}`;
        document.getElementById('discountAmount').textContent = `₹${utils.formatCurrency(this.discount)}`;
        document.getElementById('gstAmount').textContent = `₹${utils.formatCurrency(this.gst)}`;
        document.getElementById('grandTotal').textContent = `₹${utils.formatCurrency(this.total)}`;
    }

    /**
     * Delete an item from the quotation
     * @param {string} id - The item ID
     */
    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.renderItems();
        this.updateCalculations();
    }

    /**
     * Clear the quotation
     */
    clearQuotation() {
        this.items = [];
        this.renderItems();
        this.updateCalculations();
    }

    /**
     * Save the current quotation
     */
    saveQuotation() {
        if (this.items.length === 0) {
            utils.showNotification('No items to save', true);
            return;
        }
        
        // Get customer name for filename or use default
        const customerName = this.customerInfo?.customerName || 'quotation';
        const date = new Date().toISOString().split('T')[0];
        const filename = `${customerName.replace(/\s+/g, '_')}_${date}.json`;
        
        // Create quotation data
        const quotationData = {
            items: this.items,
            subtotal: this.subtotal,
            discountRate: this.discountRate,
            discount: this.discount,
            gstRate: this.gstRate,
            gst: this.gst,
            total: this.total,
            companyInfo: this.companyInfo,
            customerInfo: this.customerInfo,
            additionalNotes: this.additionalNotes,
            date: new Date().toISOString()
        };
        
        // Download as JSON file
        utils.downloadJSON(quotationData, filename);
        utils.showNotification('Quotation saved');
    }

    /**
     * Show dialog to load a quotation
     */
    showLoadQuotationDialog() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        // Add change event
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                utils.showLoading(true);
                
                utils.loadJSON(e.target.files[0])
                    .then(data => {
                        this.loadQuotation(data);
                        utils.showLoading(false);
                        utils.showNotification('Quotation loaded successfully');
                    })
                    .catch(error => {
                        console.error('Error loading quotation:', error);
                        utils.showLoading(false);
                        utils.showNotification('Failed to load quotation', true);
                    });
            }
        });
        
        // Trigger click to open file dialog
        fileInput.click();
    }

    /**
     * Load a quotation from data
     * @param {Object} data - The quotation data
     */
    loadQuotation(data) {
        if (!data || !data.items) {
            utils.showNotification('Invalid quotation data', true);
            return;
        }
        
        // Load items
        this.items = data.items;
        
        // Load calculations
        this.subtotal = data.subtotal;
        this.discountRate = data.discountRate;
        this.discount = data.discount;
        this.gstRate = data.gstRate;
        this.gst = data.gst;
        this.total = data.total;
        
        // Load company and customer info
        if (data.companyInfo) {
            this.companyInfo = data.companyInfo;
            document.getElementById('companyName').value = data.companyInfo.companyName || '';
            document.getElementById('companyGST').value = data.companyInfo.companyGST || '';
            document.getElementById('companyEmail').value = data.companyInfo.companyEmail || '';
            document.getElementById('companyWebsite').value = data.companyInfo.companyWebsite || '';
            document.getElementById('companyAddress').value = data.companyInfo.companyAddress || '';
            document.getElementById('companyLogo').value = data.companyInfo.companyLogo || '';
            this.updateLogoPreview();
        }
        
        if (data.customerInfo) {
            this.customerInfo = data.customerInfo;
            document.getElementById('customerName').value = data.customerInfo.customerName || '';
            document.getElementById('contactPerson').value = data.customerInfo.contactPerson || '';
            document.getElementById('customerAddress').value = data.customerInfo.customerAddress || '';
            document.getElementById('customerPhone').value = data.customerInfo.customerPhone || '';
            document.getElementById('customerEmail').value = data.customerInfo.customerEmail || '';
            document.getElementById('quotationTitle').value = data.customerInfo.quotationTitle || '';
        }
        
        // Load additional notes
        if (data.additionalNotes) {
            this.additionalNotes = data.additionalNotes;
            document.getElementById('additionalNotes').value = data.additionalNotes;
            document.getElementById('wordCount').textContent = utils.countWords(data.additionalNotes);
        }
        
        // Update UI
        document.getElementById('discountRate').value = this.discountRate;
        document.getElementById('gstRate').value = this.gstRate;
        
        this.renderItems();
        this.updateCalculations();
    }

    /**
     * Export the quotation to PDF
     */
    async exportToPDF() {
        if (this.items.length === 0) {
            utils.showNotification('No items to export', true);
            return;
        }
        
        console.log('Checking if jsPDF is loaded...');
        
        try {
            utils.showLoading(true);
            
            // Try different approaches to initialize jsPDF
            let doc;
            try {
                // Try to import jsPDF from window.jspdf (newer versions)
                if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
                    const { jsPDF } = window.jspdf;
                    doc = new jsPDF();
                    console.log('jsPDF initialized using window.jspdf.jsPDF');
                } 
                // Try global jsPDF constructor (older versions)
                else if (typeof jsPDF === 'function') {
                    doc = new jsPDF();
                    console.log('jsPDF initialized using global jsPDF constructor');
                }
                // Try window.jsPDF as a fallback
                else if (typeof window.jsPDF === 'function') {
                    doc = new window.jsPDF();
                    console.log('jsPDF initialized using window.jsPDF');
                }
                // No jsPDF found
                else {
                    throw new Error('PDF library not found');
                }
            } catch (initError) {
                console.error('Failed to initialize PDF:', initError);
                utils.showNotification('PDF library initialization failed. Please refresh the page and try again.', true);
                utils.showLoading(false);
                return;
            }
            
            // Set document properties
            const title = this.customerInfo?.quotationTitle || 'WoodenMax Quotation';
            doc.setProperties({
                title: title,
                subject: 'Quotation',
                author: 'WoodenMax',
                creator: 'WoodenMax Quotation Generator'
            });
            
            // Add title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0);
            doc.text(title, 105, 20, { align: 'center' });
            
            // Add date
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const today = new Date().toLocaleDateString('en-IN');
            doc.text(`Date: ${today}`, 195, 20, { align: 'right' });
            
            // Try to add logo if available
            try {
                if (this.companyInfo && this.companyInfo.companyLogoData) {
                    // Use saved logo data if available
                    doc.addImage(this.companyInfo.companyLogoData, 'JPEG', 20, 15, 40, 20);
                    console.log('Logo added from companyLogoData');
                } else if (this.companyInfo && this.companyInfo.companyLogo) {
                    // Try to load from URL if we have a logo URL
                    const img = new Image();
                    img.src = this.companyInfo.companyLogo;
                    
                    // Use a promise to handle image loading
                    const loadImagePromise = new Promise((resolve, reject) => {
                        img.onload = () => {
                            try {
                                doc.addImage(img, 'JPEG', 20, 15, 40, 20);
                                console.log('Logo added from companyLogo URL');
                                resolve();
                            } catch (e) {
                                console.error('Error adding logo from URL:', e);
                                reject(e);
                            }
                        };
                        img.onerror = (e) => {
                            console.error('Error loading logo from URL:', e);
                            reject(new Error('Failed to load logo from URL'));
                        };
                    });
                    
                    // Try to wait for image load but don't block PDF generation if it fails
                    try {
                        await loadImagePromise;
                    } catch (logoError) {
                        console.error('Could not load logo from URL:', logoError);
                        // No logo, use text instead
                        doc.setFontSize(16);
                        doc.setFont(undefined, 'bold');
                        doc.text('WoodenMax', 20, 20);
                    }
                } else {
                    // No logo available, use text instead
                    doc.setFontSize(16);
                    doc.setFont(undefined, 'bold');
                    doc.text('WoodenMax', 20, 20);
                }
            } catch(logoError) {
                console.error('Could not add logo:', logoError);
                // If logo fails, add text instead
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('WoodenMax', 20, 20);
            }
            
            // Add company information
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            let yPos = 45;
            if (this.companyInfo) {
                if (this.companyInfo.companyName) {
                    doc.text(this.companyInfo.companyName, 20, yPos);
                    yPos += 5;
                }
                if (this.companyInfo.companyGST) {
                    doc.text(`GST: ${this.companyInfo.companyGST}`, 20, yPos);
                    yPos += 5;
                }
                if (this.companyInfo.companyAddress) {
                    // Split address into multiple lines if needed
                    const addressLines = doc.splitTextToSize(this.companyInfo.companyAddress, 80);
                    addressLines.forEach(line => {
                        doc.text(line, 20, yPos);
                        yPos += 5;
                    });
                }
                if (this.companyInfo.companyPhone) {
                    doc.text(`Phone: ${this.companyInfo.companyPhone}`, 20, yPos);
                    yPos += 5;
                }
                if (this.companyInfo.companyEmail) {
                    doc.text(`Email: ${this.companyInfo.companyEmail}`, 20, yPos);
                    yPos += 5;
                }
                if (this.companyInfo.companyWebsite) {
                    doc.text(`Web: ${this.companyInfo.companyWebsite}`, 20, yPos);
                    yPos += 5;
                }
            }
            
            // Add customer information
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Customer Information', 105, 45);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            yPos = 50;
            if (this.customerInfo) {
                if (this.customerInfo.customerName) {
                    doc.text(`Name: ${this.customerInfo.customerName}`, 105, yPos);
                    yPos += 5;
                }
                if (this.customerInfo.customerAddress) {
                    doc.text(`Address: ${this.customerInfo.customerAddress}`, 105, yPos);
                    yPos += 5;
                }
                if (this.customerInfo.customerPhone) {
                    doc.text(`Phone: ${this.customerInfo.customerPhone}`, 105, yPos);
                    yPos += 5;
                }
                if (this.customerInfo.customerEmail) {
                    doc.text(`Email: ${this.customerInfo.customerEmail}`, 105, yPos);
                    yPos += 5;
                }
            }
            
            // Add items table
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Items', 105, 75, { align: 'center' });
            
            // Add table header
            const tableTop = 80;
            // Use properly sized columns to prevent overlap and fix amount overflow
            const columnWidths = [15, 55, 40, 15, 25, 25];
            let tableX = 15;
            
            // Draw header with more subtle background for better visibility
            doc.setFillColor(242, 242, 242);
            doc.rect(tableX, tableTop, 185, 7, 'F');
            
            // Add header text with better spacing
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0); // Ensure header text is solid black
            doc.text('No.', tableX + 5, tableTop + 5);
            doc.text('Description', tableX + columnWidths[0] + 5, tableTop + 5);
            doc.text('Dimensions', tableX + columnWidths[0] + columnWidths[1] + 5, tableTop + 5);
            doc.text('Qty', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, tableTop + 5);
            doc.text('Unit Price', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 5, tableTop + 5);
            doc.text('Amount', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 5, tableTop + 5);
            
            // Draw table rows
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            let row = 1;
            let currentY = tableTop + 10;
            let totalAmount = 0;
            
            // Process each item in the table
            this.items.forEach((item, index) => {
                // Check if we need a new page
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 40;
                    
                    // Redraw table header on new page
                    doc.setFillColor(242, 242, 242);
                    doc.rect(tableX, currentY, 185, 7, 'F');
                    
                    doc.setFontSize(9);
                    doc.setTextColor(0, 0, 0); // Ensure header text is solid black
                    doc.text('No.', tableX + 5, currentY + 5);
                    doc.text('Description', tableX + columnWidths[0] + 5, currentY + 5);
                    doc.text('Dimensions', tableX + columnWidths[0] + columnWidths[1] + 5, currentY + 5);
                    doc.text('Qty', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, currentY + 5);
                    doc.text('Unit Price', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 5, currentY + 5);
                    doc.text('Amount', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 5, currentY + 5);
                    
                    currentY += 10;
                }
                
                // Draw row background
                doc.setFillColor(row % 2 === 0 ? 255 : 255, 255, 255); // Changed to fully transparent (white)
                doc.rect(tableX, currentY - 2, 185, 10, 'F');
                
                // Draw row border
                doc.setDrawColor(220, 220, 220);
                doc.rect(tableX, currentY - 2, 185, 10);
                
                // Set text color to solid black for all content
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
                
                // Draw cell content - apply extra bold and larger font to ensure visibility
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0); // Solid black
                doc.text((index + 1).toString(), tableX + 5, currentY + 5);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                
                // Add description (use indexed description, name or type, then truncate if needed)
                const description = item.indexedDescription || item.description || item.name || item.type;
                const wrappedDescription = doc.splitTextToSize(description, columnWidths[1] - 10);
                
                // Force text color to black for description
                doc.setTextColor(0, 0, 0);
                doc.text(wrappedDescription, tableX + columnWidths[0] + 5, currentY + 5);
                
                // Handle dimensions display based on item type
                let dimensions = '';
                let quantity = item.quantity || 1;
                let unitPrice = 0;
                let amount = item.amount || 0;
                
                if (item.type === 'Window') {
                    // For windows, show comprehensive specifications with all available details
                    dimensions = this.formatWindowDetails(item);
                    // Get unit price for window from amount divided by quantity
                    unitPrice = item.amount / item.quantity;
                } else if (item.type === 'Grill' || item.type === 'Pergola') {
                    // Include complete material details for grills and pergolas
                    dimensions = '';
                    if (item.width && item.height) {
                        dimensions = `${item.width}mm × ${item.height}mm`;
                    } else if (item.dimensions) {
                        dimensions = item.dimensions;
                    }
                    
                    // Add comprehensive material info
                    if (item.details && item.details.material) {
                        const material = item.details.material;
                        let materialInfo = '';
                        
                        // Add material type
                        if (material.type) {
                            materialInfo += material.type;
                        }
                        
                        // Add material dimensions
                        if (material.dimensions) {
                            if (materialInfo) materialInfo += ', ';
                            materialInfo += material.dimensions;
                        } else if (material.width && material.depth && material.thickness) {
                            if (materialInfo) materialInfo += ', ';
                            materialInfo += `${material.width}×${material.depth}×${material.thickness}mm`;
                        }
                        
                        // Add material weight
                        if (material.weight) {
                            if (materialInfo) materialInfo += ', ';
                            materialInfo += `${material.weight} kg/m`;
                        }
                        
                        // Add material color if available
                        if (material.color) {
                            if (materialInfo) materialInfo += ', ';
                            materialInfo += `${material.color}`;
                        }
                        
                        // Add material finish if available
                        if (material.finish) {
                            if (materialInfo) materialInfo += ', ';
                            materialInfo += `${material.finish} finish`;
                        }
                        
                        if (materialInfo) {
                            if (dimensions) dimensions += '\n';
                            dimensions += `Material: ${materialInfo}`;
                        }
                    }
                    
                    // Add pattern details if available
                    if (item.details && item.details.pattern) {
                        if (dimensions) dimensions += '\n';
                        dimensions += `Pattern: ${item.details.pattern}`;
                    }
                    
                    // Get unit price for pergola or grill
                    unitPrice = item.rate || (item.amount / item.quantity);
                } else if (item.width && item.height) {
                    dimensions = `${item.width}mm × ${item.height}mm`;
                    unitPrice = item.rate || 0;
                } else if (item.dimensions) {
                    dimensions = item.dimensions;
                    unitPrice = item.rate || 0;
                }
                
                // Make sure dimensions fit within the column width by wrapping
                const wrappedDimensions = doc.splitTextToSize(dimensions, columnWidths[2] - 10);
                
                // Calculate row height based on which has more lines: description or dimensions
                const dimensionLines = wrappedDimensions.length;
                const descriptionLines = wrappedDescription.length;
                const maxLines = Math.max(dimensionLines, descriptionLines);
                const rowHeight = Math.max(10, maxLines * 5); // Minimum 10 height, plus 5 per additional line
                
                // Adjust background rectangle height if needed
                if (maxLines > 1) {
                    // Redraw taller background with transparent color
                    doc.setFillColor(255, 255, 255); // Transparent background
                    doc.rect(tableX, currentY - 2, 185, rowHeight, 'F');
                    doc.setDrawColor(220, 220, 220);
                    doc.rect(tableX, currentY - 2, 185, rowHeight);
                }
                
                // Force text color to black before drawing each cell
                doc.setTextColor(0, 0, 0);
                
                // Draw dimensions text with proper wrapping
                doc.text(wrappedDimensions, tableX + columnWidths[0] + columnWidths[1] + 5, currentY + 3);
                
                // Draw remaining cells
                doc.text(quantity.toString(), tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, currentY + 5);
                
                // Draw unit price with proper formatting
                const unitPriceText = `₹${utils.formatCurrency(unitPrice)}`;
                doc.text(unitPriceText, tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 5, currentY + 5);
                
                // Fix the amount overflow by aligning right
                const amountText = `₹${utils.formatCurrency(amount)}`;
                const amountX = tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] - 5;
                doc.text(amountText, amountX, currentY + 5, { align: 'right' });
                
                // Adjust current Y position based on taller rows if needed
                if (maxLines > 1) {
                    currentY += rowHeight;
                } else {
                    currentY += 10;
                }
                
                row++; // Increment row counter for alternating colors
                totalAmount += amount;
            });
            
            // Add Net Item line
            currentY += 5;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Net Item', tableX + columnWidths[0] + 5, currentY + 5);
            
            // Right-align the total amount to prevent overflow
            const totalAmountText = `₹${utils.formatCurrency(totalAmount)}`;
            const totalAmountX = tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] - 5;
            doc.text(totalAmountText, totalAmountX, currentY + 5, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            
            // Add amount summary (discount, GST, total)
            currentY += 15;
            
            // Draw summary table with better layout
            const summaryTableWidth = 100;
            const summaryTableX = tableX + 85; // Position in right half of page
            
            // Draw summary rows
            doc.setFontSize(9);
            doc.setDrawColor(200, 200, 200);
            
            // Add Subtotal row
            doc.setLineWidth(0.1);
            doc.line(summaryTableX, currentY, summaryTableX + summaryTableWidth, currentY);
            doc.text('Subtotal:', summaryTableX + 5, currentY + 5);
            doc.text(`₹${Math.round(this.subtotal)}`, summaryTableX + summaryTableWidth - 5, currentY + 5, { align: 'right' });
            currentY += 7;
            
            // Add Discount row
            doc.line(summaryTableX, currentY, summaryTableX + summaryTableWidth, currentY);
            doc.text(`Discount (${this.discountRate}%):`, summaryTableX + 5, currentY + 5);
            doc.text(`-₹${Math.round(this.discount)}`, summaryTableX + summaryTableWidth - 5, currentY + 5, { align: 'right' });
            currentY += 7;
            
            // Add GST row
            doc.line(summaryTableX, currentY, summaryTableX + summaryTableWidth, currentY);
            doc.text(`GST (${this.gstRate}%):`, summaryTableX + 5, currentY + 5);
            doc.text(`₹${Math.round(this.gst)}`, summaryTableX + summaryTableWidth - 5, currentY + 5, { align: 'right' });
            currentY += 7;
            
            // Add Total row with bold font and background
            doc.setFillColor(240, 240, 240);
            doc.rect(summaryTableX, currentY, summaryTableWidth, 8, 'F');
            doc.line(summaryTableX, currentY, summaryTableX + summaryTableWidth, currentY);
            doc.line(summaryTableX, currentY + 8, summaryTableX + summaryTableWidth, currentY + 8);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Total Amount:', summaryTableX + 5, currentY + 6);
            doc.text(`₹${Math.round(this.total)}`, summaryTableX + summaryTableWidth - 5, currentY + 6, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            
            // Increase current position after summary
            currentY += 15;
            
            // Add additional notes if they exist
            if (this.additionalNotes && this.additionalNotes.trim().length > 0) {
                currentY += 15;
                
                // Check if we need a new page for notes
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 40;
                }
                
                // Notes header
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Additional Notes', 20, currentY);
                currentY += 10;
                
                // Notes content
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                
                // Wrap notes to fit page width
                const wrappedNotes = doc.splitTextToSize(this.additionalNotes.trim(), 175);
                
                // Draw notes with proper line spacing
                doc.text(wrappedNotes, 20, currentY);
                
                // Adjust current Y position based on the number of lines
                currentY += wrappedNotes.length * 5 + 10;
            }
            
            // Always start cutting plan on a new page
            doc.addPage();
            currentY = 40;
            
            // Add cutting plan title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Cutting Plan', 15, currentY);
            doc.setFont('helvetica', 'normal');
            currentY += 10;
            
            // Add cutting plan section
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            let stockLengthInfo = '';
            let stockLengths = [];
            
            const useMultipleStockLengths = document.getElementById('useMultipleStockLengths').checked;
            if (useMultipleStockLengths && this.stockLengths.length > 0) {
                stockLengthInfo = `Multiple stock lengths: ${this.stockLengths.join('mm, ')}mm`;
                stockLengths = this.stockLengths;
            } else {
                const stockLength = document.getElementById('stockLength').value || '6000';
                stockLengthInfo = `Standard stock length: ${stockLength}mm`;
                stockLengths = [parseInt(stockLength, 10)];
            }
            
            doc.text(stockLengthInfo, 20, currentY);
            currentY += 10;
            
            // Extract all required lengths from items
            const allRequirements = [];
            this.items.forEach(item => {
                if (item.type === 'Grill' || item.type === 'Pergola') {
                    if (item.details && item.details.requirements) {
                        item.details.requirements.forEach(req => {
                            // Convert size to mm for consistent calculations
                            let sizeInMm = req.size;
                            if (req.unit === 'm') {
                                sizeInMm = req.size * 1000;
                            } else if (req.unit === 'ft') {
                                sizeInMm = req.size * 304.8;
                            } else if (req.unit === 'cm') {
                                sizeInMm = req.size * 10;
                            } else if (req.unit === 'inch') {
                                sizeInMm = req.size * 25.4;
                            }
                            
                            allRequirements.push({
                                size: req.size,
                                sizeInMm: Math.round(sizeInMm),
                                unit: req.unit,
                                quantity: req.quantity,
                                type: item.type,
                                description: req.description || item.description,
                                itemType: req.itemType
                            });
                        });
                    }
                }
            });
            
            // Calculate optimal cutting plan
            const cuttingPlan = this.calculateCuttingPlan(allRequirements, stockLengths);
            
            // Header for cutting plan
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Material Requirements & Usage', 20, currentY);
            currentY += 8;
            
            // Create a detailed table showing requirements and usage
            if (allRequirements.length > 0) {
                // Group materials by dimensions to create separate cutting plans
                const materialsByDimension = {};
                
                // Group requirements by material dimensions
                allRequirements.forEach(req => {
                    if (req.type === 'Grill' || req.type === 'Pergola') {
                        // Find the material used
                        const item = this.items.find(item => 
                            item.type === req.type && 
                            (item.description === req.description || item.name === req.description)
                        );
                        
                        let materialKey = "standard";
                        if (item && item.details && item.details.material) {
                            const material = item.details.material;
                            materialKey = `${material.width || ''}x${material.depth || ''}x${material.thickness || ''}`;
                            
                            // If we don't have dimensions, try to use type
                            if (materialKey === 'xx') {
                                materialKey = material.type || "standard";
                            }
                        }
                        
                        if (!materialsByDimension[materialKey]) {
                            materialsByDimension[materialKey] = [];
                        }
                        
                        materialsByDimension[materialKey].push(req);
                    }
                });
                
                // If we have different material groups, create separate cutting plans
                if (Object.keys(materialsByDimension).length > 0) {
                    // Add header for the overall cutting plan
                    doc.setFontSize(14);
                    doc.setFont(undefined, 'bold');
                    doc.text('Cutting Plan by Material Dimensions', 105, currentY, { align: 'center' });
                    currentY += 15;
                    
                    // Track overall summaries
                    let totalOverallStockPieces = 0;
                    let totalOverallLengthUsed = 0;
                    let totalOverallLengthAvailable = 0;
                    let totalOverallWaste = 0;
                    let totalOverallWeight = 0;
                    
                    // For each material dimension, create a cutting plan
                    Object.entries(materialsByDimension).forEach(([dimensionKey, dimensionReqs], dimensionIndex) => {
                        // Start each material type on a new page except the first one
                        if (dimensionIndex > 0) {
                            doc.addPage();
                            currentY = 20;
                        }
                        
                        // Calculate cutting plan for this dimension group
                        const dimensionCuttingPlan = this.calculateCuttingPlan(dimensionReqs, stockLengths);
                        
                        // Add header for this dimension
                        doc.setFillColor(242, 242, 242);
                        doc.rect(20, currentY, 170, 10, 'F');
                        doc.setFontSize(12);
                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(0, 0, 0);
                        doc.text(`Material Section: ${dimensionKey}`, 105, currentY + 7, { align: 'center' });
                        currentY += 15;
                        doc.setFont(undefined, 'normal');
                        
                        // Stock length information
                        doc.setFontSize(10);
                        if (useMultipleStockLengths && stockLengths.length > 0) {
                            doc.text(`Available Stock Lengths: ${stockLengths.map(l => `${l}mm`).join(', ')}`, 20, currentY);
                        } else {
                            doc.text(`Standard Stock Length: ${stockLengths[0]}mm`, 20, currentY);
                        }
                        currentY += 10;
                        
                        // Material Requirements Table
                        doc.setFontSize(11);
                        doc.setFont(undefined, 'bold');
                        doc.text('Material Requirements:', 20, currentY);
                        currentY += 8;
                        
                        // Table header for this dimension
                        doc.setFillColor(248, 248, 248);
                        doc.rect(20, currentY, 170, 7, 'F');
                        doc.setFontSize(9);
                        doc.setTextColor(0, 0, 0);
                        doc.text('Type', 22, currentY + 5);
                        doc.text('Description', 52, currentY + 5);
                        doc.text('Size', 102, currentY + 5);
                        doc.text('Quantity', 132, currentY + 5);
                        doc.text('Total Length', 162, currentY + 5);
                        currentY += 10;
                        doc.setFont(undefined, 'normal');
                        
                        // Group similar requirements for better display
                        const groupedDimensionReqs = dimensionReqs.reduce((groups, req) => {
                            const key = `${req.type}-${req.sizeInMm}-${req.itemType || ''}`;
                            if (!groups[key]) {
                                groups[key] = {
                                    type: req.type,
                                    itemType: req.itemType,
                                    description: req.description,
                                    size: req.size,
                                    unit: req.unit,
                                    sizeInMm: req.sizeInMm,
                                    quantity: 0
                                };
                            }
                            groups[key].quantity += req.quantity;
                            return groups;
                        }, {});
                        
                        // Add data rows for this dimension
                        let totalLengthForDimension = 0;
                        let totalPiecesForDimension = 0;
                        
                        Object.values(groupedDimensionReqs).forEach((req, index) => {
                            // Calculate total length
                            const totalLength = req.sizeInMm * req.quantity;
                            totalLengthForDimension += totalLength;
                            totalPiecesForDimension += req.quantity;
                            
                            // Alternate row background for better readability
                            if (index % 2 === 0) {
                                doc.setFillColor(248, 248, 248);
                                doc.rect(20, currentY - 2, 170, 8, 'F');
                            }
                            
                            // Display data
                            doc.text(req.type, 22, currentY);
                            doc.text(req.itemType || req.description || '-', 52, currentY);
                            doc.text(`${req.size} ${req.unit}`, 102, currentY);
                            doc.text(req.quantity.toString(), 132, currentY);
                            doc.text(`${(totalLength/1000).toFixed(2)} m`, 162, currentY);
                            
                            currentY += 8;
                            
                            // Check if we need a new page
                            if (currentY > 270) {
                                doc.addPage();
                                currentY = 20;
                                
                                // Repeat header on new page
                                doc.setFontSize(11);
                                doc.setFont(undefined, 'bold');
                                doc.text(`Material Requirements for ${dimensionKey} (Continued)`, 105, currentY, { align: 'center' });
                                currentY += 10;
                                
                                // Repeat table header
                                doc.setFillColor(248, 248, 248);
                                doc.rect(20, currentY, 170, 7, 'F');
                                doc.setFontSize(9);
                                doc.setTextColor(0, 0, 0);
                                doc.text('Type', 22, currentY + 5);
                                doc.text('Description', 52, currentY + 5);
                                doc.text('Size', 102, currentY + 5);
                                doc.text('Quantity', 132, currentY + 5);
                                doc.text('Total Length', 162, currentY + 5);
                                currentY += 10;
                                doc.setFont(undefined, 'normal');
                            }
                        });
                        
                        // Summary for this dimension
                        currentY += 5;
                        
                        // Calculate stock usage for this dimension
                        const totalStockPieces = dimensionCuttingPlan.stockPieces.length;
                        const totalLengthUsed = dimensionCuttingPlan.stockPieces.reduce((sum, piece) => sum + piece.used, 0);
                        const totalLengthAvailable = dimensionCuttingPlan.stockPieces.reduce((sum, piece) => sum + piece.length, 0);
                        const totalWaste = totalLengthAvailable - totalLengthUsed;
                        const wastePercentage = ((totalWaste / totalLengthAvailable) * 100).toFixed(1);
                        
                        // Get material weight if available
                        let materialWeight = 0;
                        let materialInfo = '';
                        
                        // Try to find material weight from items
                        this.items.forEach(item => {
                            if ((item.type === 'Grill' || item.type === 'Pergola') && 
                                item.details && item.details.material) {
                                const material = item.details.material;
                                const materialKeyFromItem = `${material.width || ''}x${material.depth || ''}x${material.thickness || ''}`;
                                
                                if (materialKeyFromItem === dimensionKey && material.weight) {
                                    materialWeight = material.weight;
                                    materialInfo = this.getMaterialDetails(material);
                                }
                            }
                        });
                        
                        // Calculate total weight for this dimension
                        const totalWeightForDimension = (totalLengthUsed / 1000) * materialWeight;
                        const wasteWeightForDimension = (totalWaste / 1000) * materialWeight;
                        
                        // Update overall totals
                        totalOverallStockPieces += totalStockPieces;
                        totalOverallLengthUsed += totalLengthUsed;
                        totalOverallLengthAvailable += totalLengthAvailable;
                        totalOverallWaste += totalWaste;
                        totalOverallWeight += totalWeightForDimension;
                        
                        // Draw summary box with shadow effect
                        doc.setFillColor(250, 250, 250);
                        doc.rect(20, currentY, 170, 50, 'F');
                        doc.setDrawColor(200, 200, 200);
                        doc.rect(20, currentY, 170, 50);
                        
                        // Add summary heading
                        doc.setFontSize(10);
                        doc.setFont(undefined, 'bold');
                        doc.text('Material Summary:', 25, currentY + 8);
                        doc.setFont(undefined, 'normal');
                        
                        // Add summary details
                        doc.setFontSize(9);
                        currentY += 8;
                        
                        doc.text(`• Material: ${dimensionKey} ${materialInfo ? '(' + materialInfo + ')' : ''}`, 25, currentY + 8);
                        doc.text(`• Total Requirements: ${totalPiecesForDimension} pieces, ${(totalLengthForDimension/1000).toFixed(2)} meters`, 25, currentY + 16);
                        doc.text(`• Stock Required: ${totalStockPieces} pieces (${(totalLengthAvailable/1000).toFixed(2)} m)`, 25, currentY + 24);
                        doc.text(`• Material Used: ${(totalLengthUsed/1000).toFixed(2)} meters`, 25, currentY + 32);
                        doc.text(`• Waste: ${(totalWaste/1000).toFixed(2)} meters (${wastePercentage}% of stock)`, 25, currentY + 40);
                        
                        // Add weight information if available
                        if (materialWeight > 0) {
                            currentY += 8;
                            doc.text(`• Total Weight: ${totalWeightForDimension.toFixed(2)} kg (${materialWeight} kg/m)`, 25, currentY + 40);
                            doc.text(`• Waste Weight: ${wasteWeightForDimension.toFixed(2)} kg`, 25, currentY + 48);
                        }
                        
                        currentY += 60;
                        
                        // Add cutting diagrams for this dimension
                        doc.setFontSize(11);
                        doc.setFont(undefined, 'bold');
                        doc.text(`Cutting Diagram for ${dimensionKey}:`, 20, currentY);
                        doc.setFont(undefined, 'normal');
                        currentY += 10;
                        
                        // Draw cutting diagram for all stock pieces
                        for (let i = 0; i < dimensionCuttingPlan.stockPieces.length; i++) {
                            const stock = dimensionCuttingPlan.stockPieces[i];
                            
                            // Check if we need a new page
                            if (currentY > 240) {
                                doc.addPage();
                                currentY = 20;
                                doc.setFontSize(11);
                                doc.setFont(undefined, 'bold');
                                doc.text(`Cutting Diagram for ${dimensionKey} (Continued):`, 20, currentY);
                                doc.setFont(undefined, 'normal');
                                currentY += 10;
                            }
                            
                            // Stock label
                            doc.setFontSize(9);
                            doc.text(`Stock #${i + 1}: ${stock.length} mm (${(stock.length/1000).toFixed(2)} m)`, 25, currentY);
                            currentY += 5;
                            
                            // Draw stock bar
                            const barWidth = 150;
                            const barHeight = 15;
                            const barX = 30;
                            doc.setDrawColor(100, 100, 100);
                            doc.setFillColor(240, 240, 240);
                            doc.rect(barX, currentY, barWidth, barHeight, 'F');
                            
                            // Calculate scale factor
                            const scaleFactor = barWidth / stock.length;
                            
                            // Running position for segment placement
                            let xOffset = 0;
                            
                            // Draw pieces
                            stock.cuts.forEach((piece, pieceIndex) => {
                                const segmentWidth = piece.size * scaleFactor;
                                
                                // Draw segment with different colors for easier distinction
                                const colors = [
                                    [52, 152, 219], // Blue
                                    [46, 204, 113], // Green
                                    [155, 89, 182], // Purple
                                    [52, 73, 94],   // Dark Blue
                                    [22, 160, 133]  // Teal
                                ];
                                const colorIndex = pieceIndex % colors.length;
                                
                                doc.setFillColor(colors[colorIndex][0], colors[colorIndex][1], colors[colorIndex][2]);
                                doc.rect(barX + xOffset, currentY, segmentWidth, barHeight, 'F');
                                
                                // Calculate and display cutting mark (vertical line)
                                const cutX = barX + xOffset + segmentWidth;
                                doc.setDrawColor(255, 0, 0); // Red for cut marks
                                doc.setLineWidth(0.5);
                                doc.line(cutX, currentY - 2, cutX, currentY + barHeight + 2);
                                
                                // Add measurement text if segment is wide enough
                                if (segmentWidth > 20) {
                                    doc.setFontSize(8);
                                    doc.setTextColor(255); // White text for better visibility
                                    doc.text(`${piece.size}mm`, barX + xOffset + segmentWidth/2, currentY + barHeight/2 + 3, {
                                        align: 'center'
                                    });
                                }
                                
                                xOffset += segmentWidth;
                            });
                            
                            // Draw waste segment if any
                            if (stock.waste > 0) {
                                const wasteWidth = stock.waste * scaleFactor;
                                doc.setFillColor(231, 76, 60); // Red for waste
                                doc.rect(barX + xOffset, currentY, wasteWidth, barHeight, 'F');
                                
                                // Add waste text if wide enough
                                if (wasteWidth > 15) {
                                    doc.setFontSize(8);
                                    doc.setTextColor(255); // White text
                                    doc.text(`Waste\n${stock.waste}mm`, barX + xOffset + wasteWidth/2, currentY + barHeight/2, {
                                        align: 'center'
                                    });
                                }
                            }
                            
                            // Reset text color to black
                            doc.setTextColor(0, 0, 0);
                            
                            // Add piece details below the diagram
                            currentY += barHeight + 5;
                            doc.setFontSize(8);
                            
                            // Display cut information in a more compact format
                            let detailsText = '';
                            stock.cuts.forEach((piece, pieceIndex) => {
                                if (pieceIndex % 3 === 0 && pieceIndex > 0) {
                                    detailsText += '\n';
                                }
                                detailsText += `• Cut #${pieceIndex + 1}: ${piece.size}mm  `;
                            });
                            
                            if (stock.waste > 0) {
                                detailsText += `• Waste: ${stock.waste}mm (${((stock.waste / stock.length) * 100).toFixed(1)}%)`;
                            }
                            
                            const wrappedDetails = doc.splitTextToSize(detailsText, 160);
                            doc.text(wrappedDetails, 30, currentY);
                            
                            currentY += wrappedDetails.length * 4 + 8;
                        }
                        
                    });
                    
                    // Add complete summary page at the end
                    doc.addPage();
                    currentY = 20;
                    
                    // Overall summary heading
                    doc.setFontSize(14);
                    doc.setFont(undefined, 'bold');
                    doc.text('Complete Cutting Plan Summary', 105, currentY, { align: 'center' });
                    currentY += 15;
                    
                    // Overall statistics
                    const overallWastePercentage = ((totalOverallWaste / totalOverallLengthAvailable) * 100).toFixed(1);
                    
                    // Draw summary table
                    doc.setFillColor(248, 248, 248);
                    doc.rect(20, currentY, 170, 10, 'F');
                    doc.setFontSize(11);
                    doc.text('Overall Material Requirements', 105, currentY + 7, { align: 'center' });
                    currentY += 15;
                    
                    // Create table for material sections
                    doc.setFillColor(248, 248, 248);
                    doc.rect(20, currentY, 170, 7, 'F');
                    doc.setFontSize(9);
                    doc.text('Material', 22, currentY + 5);
                    doc.text('Required Pieces', 70, currentY + 5);
                    doc.text('Stock Required', 110, currentY + 5);
                    doc.text('Weight (kg)', 160, currentY + 5);
                    currentY += 10;
                    
                    // Add data for each material section
                    let rowCount = 0;
                    
                    Object.entries(materialsByDimension).forEach(([dimensionKey, dimensionReqs]) => {
                        const dimCuttingPlan = this.calculateCuttingPlan(dimensionReqs, stockLengths);
                        const totalPieces = dimensionReqs.reduce((sum, req) => sum + req.quantity, 0);
                        const totalStockPieces = dimCuttingPlan.stockPieces.length;
                        
                        // Find material weight
                        let materialWeight = 0;
                        this.items.forEach(item => {
                            if ((item.type === 'Grill' || item.type === 'Pergola') && 
                                item.details && item.details.material) {
                                const material = item.details.material;
                                const materialKeyFromItem = `${material.width || ''}x${material.depth || ''}x${material.thickness || ''}`;
                                
                                if (materialKeyFromItem === dimensionKey && material.weight) {
                                    materialWeight = material.weight;
                                }
                            }
                        });
                        
                        const totalLengthUsed = dimCuttingPlan.stockPieces.reduce((sum, piece) => sum + piece.used, 0);
                        const totalWeightForDimension = (totalLengthUsed / 1000) * materialWeight;
                        
                        // Alternate row coloring with transparent background
                        if (rowCount % 2 === 0) {
                            doc.setFillColor(252, 252, 252);
                            doc.rect(20, currentY - 2, 170, 8, 'F');
                        }
                        
                        doc.text(dimensionKey, 22, currentY);
                        doc.text(totalPieces.toString(), 70, currentY);
                        doc.text(`${totalStockPieces} (${(dimCuttingPlan.stockPieces.reduce((sum, piece) => sum + piece.length, 0)/1000).toFixed(2)} m)`, 110, currentY);
                        doc.text(materialWeight > 0 ? totalWeightForDimension.toFixed(2) : '-', 160, currentY);
                        
                        currentY += 8;
                        rowCount++;
                    });
                    
                    // Add total row
                    doc.setFillColor(245, 245, 245);
                    doc.rect(20, currentY, 170, 10, 'F');
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(20, currentY, 170, 10);
                    doc.setFont(undefined, 'bold');
                    doc.text('TOTAL', 22, currentY + 7);
                    doc.text(`${totalOverallStockPieces} stocks`, 110, currentY + 7);
                    doc.text(`${totalOverallWeight.toFixed(2)} kg`, 160, currentY + 7);
                    doc.setFont(undefined, 'normal');
                    currentY += 15;
                    
                    // Add waste summary
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text('Material Waste Summary:', 20, currentY);
                    doc.setFont(undefined, 'normal');
                    currentY += 10;
                    
                    // Detail rows
                    doc.setFontSize(9);
                    doc.text(`• Total Material Used: ${(totalOverallLengthUsed/1000).toFixed(2)} meters`, 25, currentY);
                    currentY += 7;
                    doc.text(`• Total Material Waste: ${(totalOverallWaste/1000).toFixed(2)} meters (${overallWastePercentage}% of stock)`, 25, currentY);
                    currentY += 7;
                    doc.text(`• Total Weight: ${totalOverallWeight.toFixed(2)} kg`, 25, currentY);
                    currentY += 15;
                    
                    // Add utilization chart
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text('Material Utilization:', 20, currentY);
                    doc.setFont(undefined, 'normal');
                    currentY += 10;
                    
                    // Draw utilization bar
                    const utilizationBarWidth = 150;
                    const utilizationBarHeight = 20;
                    const utilizationBarX = 30;
                    
                    // Calculate utilization percentage
                    const utilizationPercentage = (totalOverallLengthUsed / totalOverallLengthAvailable) * 100;
                    const usedWidth = (utilizationPercentage / 100) * utilizationBarWidth;
                    const wasteWidth = utilizationBarWidth - usedWidth;
                    
                    // Draw background
                    doc.setDrawColor(100, 100, 100);
                    doc.setFillColor(240, 240, 240);
                    doc.rect(utilizationBarX, currentY, utilizationBarWidth, utilizationBarHeight, 'F');
                    
                    // Draw used portion
                    doc.setFillColor(46, 204, 113); // Green for used
                    doc.rect(utilizationBarX, currentY, usedWidth, utilizationBarHeight, 'F');
                    
                    // Draw waste portion
                    doc.setFillColor(231, 76, 60); // Red for waste
                    doc.rect(utilizationBarX + usedWidth, currentY, wasteWidth, utilizationBarHeight, 'F');
                    
                    // Add labels
                    doc.setFontSize(9);
                    doc.setTextColor(255, 255, 255);
                    doc.text(`Used: ${utilizationPercentage.toFixed(1)}%`, utilizationBarX + usedWidth/2, currentY + utilizationBarHeight/2 + 3, { align: 'center' });
                    
                    if (wasteWidth > 30) {
                        doc.text(`Waste: ${(100 - utilizationPercentage).toFixed(1)}%`, utilizationBarX + usedWidth + wasteWidth/2, currentY + utilizationBarHeight/2 + 3, { align: 'center' });
                    }
                    
                    // Reset text color
                    doc.setTextColor(0, 0, 0);
                }
                // If we only have one material type, continue with existing code
                else {
                    // ... existing code ...
                }
            } else {
                doc.text('No cutting requirements found', 20, currentY);
            }
            
            // Add footer to all pages with semitransparent background
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Add page number
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0);
                doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
                
                // Add semi-transparent footer background
                doc.saveGraphicsState();
                doc.setFillColor(240, 240, 240);
                doc.setGState(new doc.GState({opacity: 0.5}));
                doc.rect(0, doc.internal.pageSize.height - 25, doc.internal.pageSize.width, 25, 'F');
                doc.restoreGraphicsState();
                
                // Add footer with website - after restoring opacity
                doc.setDrawColor(100, 100, 100);
                doc.setLineWidth(0.5);
                doc.line(20, doc.internal.pageSize.height - 20, 190, doc.internal.pageSize.height - 20);
                
                doc.setTextColor(50, 50, 50);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('WoodenMax', 20, doc.internal.pageSize.height - 12);
                
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text('www.woodenmax.com', 20, doc.internal.pageSize.height - 7);
                
                // Try to add small logo in footer
                try {
                    if (this.companyInfo && this.companyInfo.companyLogoData) {
                        doc.addImage(this.companyInfo.companyLogoData, 'JPEG', 170, doc.internal.pageSize.height - 18, 20, 10);
                    }
                } catch(err) {
                    // Do nothing if logo fails in footer
                }
            }
            
            // Now the PDF is ready, try to save it
            this.savePDF(doc);
        } catch (error) {
            console.error('Error generating PDF:', error);
            utils.showNotification('Error generating PDF. Please try again.', true);
        } finally {
            utils.showLoading(false);
        }
    }

    /**
     * Save the PDF
     * @param {jsPDF} doc - The jsPDF instance
     */
    savePDF(doc) {
        if (!doc) {
            console.error('Invalid PDF document object');
            utils.showNotification('PDF generation failed: Invalid document', true);
            return;
        }

        try {
            const filename = this.customerInfo?.quotationTitle?.replace(/[^\w\-\.]/g, '_') || 'WoodenMax_Quotation';
            
            // Try direct save first - may fail in some browsers
            try {
                doc.save(`${filename}.pdf`);
                utils.showNotification('PDF exported successfully');
                return; // Exit if successful
            } catch (directSaveError) {
                console.error('Direct PDF save failed:', directSaveError);
                // Continue to alternative methods
            }
                
            // Try blob URL approach
            try {
                const pdfData = doc.output('blob');
                const blobUrl = URL.createObjectURL(pdfData);
                
                // Create a link and trigger download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${filename}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                
                // Clean up
                setTimeout(() => {
                    try {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                    } catch (e) {
                        console.warn('Error cleaning up after PDF download:', e);
                    }
                }, 100);
                
                utils.showNotification('PDF saved using alternative method');
                return; // Exit if successful
            } catch (blobError) {
                console.error('Blob URL PDF save failed:', blobError);
                // Continue to next alternative
            }
            
            // Last resort - open in new window/tab
            try {
                const pdfUrl = doc.output('dataurlstring');
                const newWindow = window.open(pdfUrl, '_blank');
                
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    throw new Error('Popup blocked or failed to open');
                }
                
                utils.showNotification('PDF opened in new tab. Please save it manually.');
            } catch (lastError) {
                console.error('Final PDF save attempt failed:', lastError);
                utils.showNotification('Failed to generate PDF. Please try a different browser or check popup settings.', true);
            }
        } catch (saveError) {
            console.error('All PDF save methods failed:', saveError);
            utils.showNotification('PDF generation failed. Technical error: ' + (saveError.message || 'Unknown error'), true);
        }
    }

    /**
     * Add a new stock length to the list
     */
    addStockLength() {
        const lengthInput = document.getElementById('newStockLength');
        const unitSelect = document.getElementById('newStockLengthUnit');
        
        const length = parseFloat(lengthInput.value);
        const unit = unitSelect.value;
        
        if (!length || isNaN(length) || length <= 0) {
            utils.showNotification('Please enter a valid length', true);
            return;
        }
        
        // Convert to mm if necessary
        let lengthInMm = length;
        if (unit === 'm') {
            lengthInMm = length * 1000;
        } else if (unit === 'ft') {
            lengthInMm = length * 304.8;
        }
        
        // Round to nearest whole number
        lengthInMm = Math.round(lengthInMm);
        
        // Check if already exists
        if (this.stockLengths.includes(lengthInMm)) {
            utils.showNotification('This length is already in the list', true);
            return;
        }
        
        // Add to list
        this.stockLengths.push(lengthInMm);
        
        // Clear input
        lengthInput.value = '';
        
        // Render updated list
        this.renderStockLengths();
    }
    
    /**
     * Render the list of stock lengths
     */
    renderStockLengths() {
        const container = document.querySelector('.stock-lengths-list');
        container.innerHTML = '';
        
        if (this.stockLengths.length === 0) {
            const div = document.createElement('div');
            div.textContent = 'No stock lengths added yet.';
            container.appendChild(div);
            return;
        }
        
        // Sort lengths
        this.stockLengths.sort((a, b) => a - b);
        
        // Create list
        this.stockLengths.forEach(length => {
            const div = document.createElement('div');
            div.className = 'stock-length-item';
            
            const lengthSpan = document.createElement('span');
            lengthSpan.textContent = `${length} mm`;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'delete-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', () => {
                this.removeStockLength(length);
            });
            
            div.appendChild(lengthSpan);
            div.appendChild(removeBtn);
            container.appendChild(div);
        });
    }
    
    /**
     * Remove a stock length from the list
     * @param {number} length - The length to remove
     */
    removeStockLength(length) {
        this.stockLengths = this.stockLengths.filter(item => item !== length);
        this.renderStockLengths();
    }

    /**
     * Calculate optimal cutting plan
     * @param {Array} requirements - Array of material requirements with sizeInMm property
     * @param {Array} stockLengths - Array of available stock lengths in mm
     * @returns {Object} - The cutting plan information
     */
    calculateCuttingPlan(requirements, stockLengths) {
        // Sort requirements by size (descending)
        const sortedReqs = [...requirements].sort((a, b) => b.sizeInMm - a.sizeInMm);
        
        // Initialize tracking variables
        const stockPieces = [];
        const waste = {};
        const stockUsage = {};
        
        // Create expanded array of pieces based on quantity
        const allPieces = [];
        sortedReqs.forEach(req => {
            for (let i = 0; i < req.quantity; i++) {
                allPieces.push({
                    size: req.sizeInMm,
                    type: req.type,
                    description: req.description
                });
            }
            
            // Initialize tracking for this size
            stockUsage[req.sizeInMm] = 0;
            waste[req.sizeInMm] = 0;
        });
        
        // If no stock lengths provided, use default
        if (!stockLengths || stockLengths.length === 0) {
            stockLengths = [6000]; // Default 6m
        }
        
        // First-fit decreasing bin packing algorithm
        while (allPieces.length > 0) {
            // Pick the longest available stock length
            const stockLength = Math.max(...stockLengths);
            
            // Create a new stock piece
            const stockPiece = {
                length: stockLength,
                remaining: stockLength,
                used: 0,
                cuts: []
            };
            
            let pieceAdded = true;
            
            // Try to fit pieces until no more can fit in this stock
            while (pieceAdded) {
                pieceAdded = false;
                
                // Find the largest piece that fits
                for (let i = 0; i < allPieces.length; i++) {
                    const piece = allPieces[i];
                    
                    // Check if piece fits in current stock with cutting tolerance
                    // Add 5mm per cut as a tolerance for blade width
                    if (piece.size + 5 <= stockPiece.remaining) {
                        // Add piece to this stock
                        stockPiece.cuts.push(piece);
                        stockPiece.used += piece.size;
                        stockPiece.remaining -= (piece.size + 5); // Account for cut width
                        
                        // Update tracking for this size
                        stockUsage[piece.size]++;
                        
                        // Remove piece from the queue
                        allPieces.splice(i, 1);
                        
                        // Continue with the next piece
                        pieceAdded = true;
                        break;
                    }
                }
            }
            
            // Calculate waste for this stock piece
            stockPiece.waste = stockPiece.remaining;
            
            // Update waste tracking
            stockPiece.cuts.forEach(piece => {
                waste[piece.size] += stockPiece.waste / stockPiece.cuts.length;
            });
            
            // Add to stock pieces list
            stockPieces.push(stockPiece);
        }
        
        return {
            stockPieces,
            waste,
            stockUsage
        };
    }

    /**
     * Formats window details for display
     * @param {Object} item - The window item
     * @returns {String} Formatted window specifications
     */
    formatWindowDetails(item) {
        let details = '';
        
        if (item.details && item.details.windows && item.details.windows.length > 0) {
            const window = item.details.windows[0];
            details = `${window.width}mm × ${window.height}mm`;
            
            // Add separate sections for better organization with line breaks
            let mainSpecs = [];
            let hardwareSpecs = [];
            let glazingSpecs = [];
            let finishSpecs = [];
            let additionalSpecs = [];
            
            // Main specifications
            if (window.material) {
                mainSpecs.push(`${window.material}`);
            }
            
            if (window.frameType) {
                mainSpecs.push(`${window.frameType} frame`);
            }
            
            if (window.openingStyle) {
                mainSpecs.push(`${window.openingStyle}`);
            }
            
            if (window.profileDepth) {
                mainSpecs.push(`${window.profileDepth}mm profile`);
            }
            
            // Hardware details
            if (window.hardware) {
                if (typeof window.hardware === 'string') {
                    hardwareSpecs.push(`Hardware: ${window.hardware}`);
                } else if (typeof window.hardware === 'object') {
                    // If hardware is an object with detailed information
                    let hwDetails = [];
                    if (window.hardware.handles) hwDetails.push(`handles: ${window.hardware.handles}`);
                    if (window.hardware.hinges) hwDetails.push(`hinges: ${window.hardware.hinges}`);
                    if (window.hardware.locks) hwDetails.push(`locks: ${window.hardware.locks}`);
                    if (window.hardware.accessories) hwDetails.push(`accessories: ${window.hardware.accessories}`);
                    
                    if (hwDetails.length > 0) {
                        hardwareSpecs.push(`Hardware: ${hwDetails.join(', ')}`);
                    }
                }
            }
            
            // Shutters or mesh details
            if (window.shutters) {
                const shutterDetails = typeof window.shutters === 'string' ? window.shutters : 'Yes';
                hardwareSpecs.push(`Shutters: ${shutterDetails}`);
            }
            
            if (window.mesh || window.mosquitoMesh) {
                const meshType = window.mesh || window.mosquitoMesh;
                const meshDetails = typeof meshType === 'string' ? meshType : 'Yes';
                hardwareSpecs.push(`Mosquito Mesh: ${meshDetails}`);
            }
            
            // Glazing specifications
            if (window.glassType) {
                glazingSpecs.push(`${window.glassType} glass`);
            }
            
            if (window.glassThickness) {
                glazingSpecs.push(`${window.glassThickness}mm thick`);
            }
            
            if (window.glazingType || window.glazing) {
                const glazing = window.glazingType || window.glazing;
                glazingSpecs.push(`${glazing}`);
            }
            
            // Finish specifications
            if (window.color) {
                finishSpecs.push(`Color: ${window.color}`);
            }
            
            if (window.finish) {
                finishSpecs.push(`Finish: ${window.finish}`);
            }
            
            // Additional specifications
            if (window.waterproofing) {
                additionalSpecs.push(`Waterproofing: ${window.waterproofing}`);
            }
            
            if (window.soundProofing || window.soundproofing) {
                const soundproofing = window.soundProofing || window.soundproofing;
                additionalSpecs.push(`Soundproofing: ${soundproofing}`);
            }
            
            if (window.accessories) {
                additionalSpecs.push(`Accessories: ${window.accessories}`);
            }
            
            // Add all specifications to details with proper line breaks
            if (mainSpecs.length > 0) {
                details += `\n${mainSpecs.join(', ')}`;
            }
            
            if (glazingSpecs.length > 0) {
                details += `\nGlass: ${glazingSpecs.join(', ')}`;
            }
            
            if (hardwareSpecs.length > 0) {
                details += `\n${hardwareSpecs.join(', ')}`;
            }
            
            if (finishSpecs.length > 0) {
                details += `\n${finishSpecs.join(', ')}`;
            }
            
            if (additionalSpecs.length > 0) {
                details += `\n${additionalSpecs.join(', ')}`;
            }
            
            // If there are multiple windows, show the count on a new line
            if (item.details.windows.length > 1) {
                details += `\n(${item.details.windows.length} pieces)`;
            }
        } else if (item.width && item.height) {
            details = `${item.width}mm × ${item.height}mm`;
            
            // Add additional details if available
            if (item.material) {
                details += `\nMaterial: ${item.material}`;
            }
            
            // Add any other available details
            const additionalDetails = [];
            if (item.color) additionalDetails.push(`Color: ${item.color}`);
            if (item.finish) additionalDetails.push(`Finish: ${item.finish}`);
            if (item.hardware) additionalDetails.push(`Hardware: ${item.hardware}`);
            if (item.glass) additionalDetails.push(`Glass: ${item.glass}`);
            
            if (additionalDetails.length > 0) {
                details += `\n${additionalDetails.join(', ')}`;
            }
        }
        
        return details;
    }

    /**
     * Get formatted material details string
     * @param {Object} material - The material object
     * @returns {String} - Formatted material details
     */
    getMaterialDetails(material) {
        if (!material) return '';
        
        const details = [];
        
        if (material.type) details.push(material.type);
        if (material.dimensions) details.push(material.dimensions);
        if (material.color) details.push(material.color);
        if (material.finish) details.push(material.finish);
        
        return details.join(', ');
    }
}

// Create global instance of the quotation manager
window.quotationManager = new QuotationManager(); 
