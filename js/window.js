/**
 * Window Module
 * Handles all profile window-related calculations and interactions
 */

class WindowManager {
    constructor() {
        this.windowForm = null;
        this.windows = [];
        this.totalArea = 0;
        this.totalAmount = 0;
        this.quotationManager = null; // Will be set by app.js
    }

    /**
     * Initialize the Window Manager
     * @param {Object} quotationManager - Reference to the QuotationManager
     */
    init(quotationManager) {
        this.quotationManager = quotationManager;
        
        // Add improved styles for calculation breakdown
        const style = document.createElement('style');
        style.textContent = `
            .calc-breakdown {
                font-size: 0.85em;
                color: #666;
                white-space: pre-line;
                margin-top: 4px;
                padding: 6px;
                background: rgba(245, 245, 245, 0.7);
                border-radius: 4px;
                line-height: 1.4;
            }
            
            .rate-label {
                font-weight: bold;
                white-space: nowrap;
            }
            
            #windowRequirementsTable th:nth-child(1) { width: 10%; }
            #windowRequirementsTable th:nth-child(2) { width: 12%; }
            #windowRequirementsTable th:nth-child(3) { width: 6%; }
            #windowRequirementsTable th:nth-child(4) { width: 10%; }
            #windowRequirementsTable th:nth-child(5) { width: 15%; }
            #windowRequirementsTable th:nth-child(6) { width: 13%; }
            #windowRequirementsTable th:nth-child(7) { width: 20%; }
            #windowRequirementsTable th:nth-child(8) { width: 10%; }
            #windowRequirementsTable th:nth-child(9) { width: 4%; }
        `;
        document.head.appendChild(style);
        
        // Get form elements
        this.windowForm = document.getElementById('windowDetailsForm');
        
        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the window section
     */
    setupEventListeners() {
        // Add window form submit - use the form's submit event instead of a separate button
        if (this.windowForm) {
            this.windowForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addWindow();
            });
        }
        
        // Add button listener if it exists
        const addWindowBtn = document.getElementById('addWindowBtn');
        if (addWindowBtn) {
            addWindowBtn.addEventListener('click', () => {
                this.addWindow();
            });
        }
        
        // Reset form button
        const resetWindowFormBtn = document.getElementById('resetWindowFormBtn');
        if (resetWindowFormBtn) {
            resetWindowFormBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }
        
        // Clear all windows button
        const clearWindowsBtn = document.getElementById('clearWindowsBtn');
        if (clearWindowsBtn) {
            clearWindowsBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all windows?')) {
                    this.clearWindows();
                }
            });
        }
        
        // Add to quotation button
        const addWindowToQuote = document.getElementById('addWindowToQuote');
        if (addWindowToQuote) {
            addWindowToQuote.addEventListener('click', () => {
                this.addToQuotation();
            });
        }

        // Update window table headers
        const windowTableHeaders = document.querySelector('#windowRequirementsTable thead tr');
        if (windowTableHeaders) {
            windowTableHeaders.innerHTML = `
                <th>Type</th>
                <th>Dimensions</th>
                <th>Qty</th>
                <th>Area</th>
                <th>Configuration</th>
                <th>Hardware</th>
                <th>Rate & Calculation</th>
                <th>Amount</th>
                <th>Action</th>
            `;
        }
    }

    /**
     * Add a new window from the form
     */
    addWindow() {
        // Get values from form
        const windowType = document.getElementById('windowType').value;
        const width = parseFloat(document.getElementById('windowWidth').value);
        const height = parseFloat(document.getElementById('windowHeight').value);
        const unit = document.getElementById('windowUnit').value;
        const quantity = parseInt(document.getElementById('windowQuantity').value);
        const areaUnit = document.getElementById('windowAreaUnit').value;
        const ratePerUnit = parseFloat(document.getElementById('windowRatePerUnit').value);
        
        // Door configuration
        const glassDoorsCount = parseInt(document.getElementById('glassDoorsCount').value) || 0;
        const meshDoorsCount = parseInt(document.getElementById('meshDoorsCount').value) || 0;
        const openableDoorsCount = parseInt(document.getElementById('openableDoorsCount').value) || 0;
        const withMesh = document.getElementById('withMesh').checked;
        const topFixed = document.getElementById('topFixed').checked;
        const bottomFixed = document.getElementById('bottomFixed').checked;
        
        // Hardware
        const hardwareType = document.getElementById('hardwareType').value;
        const hardwareCost = parseFloat(document.getElementById('hardwareCost').value) || 0;
        
        // Glass options
        const glassType = document.getElementById('windowGlassType').value || '';
        const glassThickness = parseFloat(document.getElementById('windowGlassThickness').value) || 0;
        
        // Description
        const description = document.getElementById('windowDescription').value;
        
        // Validate inputs
        if (!width || !height || !quantity || !ratePerUnit) {
            utils.showNotification('Please fill all required fields', true);
            return;
        }
        
        // Calculate area based on dimensions and unit
        const { area, areaInSqft } = this.calculateArea(width, height, unit, areaUnit);
        
        // Calculate area amount (per window): area × ratePerUnit
        const areaAmount = area * ratePerUnit;
        
        // Calculate hardware cost (per window)
        const hardwareCostPerWindow = hardwareCost;
        
        // Calculate total for single window: area amount + hardware cost
        const windowUnitAmount = areaAmount + hardwareCostPerWindow;
        
        // Calculate final amount with quantity: (area amount + hardware cost) × quantity
        const amount = windowUnitAmount * quantity;
        
        // Create window configuration description
        const configDescription = this.createConfigDescription(
            glassDoorsCount, meshDoorsCount, openableDoorsCount, 
            withMesh, topFixed, bottomFixed
        );
        
        // Add to windows array
        const windowItem = {
            id: utils.generateId(),
            windowType,
            width,
            height,
            unit,
            quantity,
            area,
            areaUnit,
            ratePerUnit,
            hardwareType,
            hardwareCost: hardwareCostPerWindow,
            areaAmount: areaAmount,
            windowUnitAmount: windowUnitAmount,
            amount,
            description,
            glassType,
            glassThickness,
            configuration: {
                glassDoorsCount,
                meshDoorsCount,
                openableDoorsCount,
                withMesh,
                topFixed,
                bottomFixed
            },
            configDescription
        };
        
        this.windows.push(windowItem);
        
        // Update UI
        this.renderWindows();
        this.updateTotals();
        
        // Clear form
        this.resetForm();
    }

    /**
     * Calculate area based on dimensions and unit
     * @param {number} width - The width
     * @param {string} height - The height
     * @param {string} dimensionUnit - The dimension unit (mm, cm, inch, ft, m)
     * @param {string} areaUnit - The area unit (sqft, sqm)
     * @returns {Object} - Object with area and area in sqft
     */
    calculateArea(width, height, dimensionUnit, areaUnit) {
        // Convert to meters first
        const widthInM = utils.convertLength(width, dimensionUnit, 'm');
        const heightInM = utils.convertLength(height, dimensionUnit, 'm');
        
        // Calculate area in square meters
        const areaInSqm = widthInM * heightInM;
        
        // Convert to target area unit
        const areaInSqft = utils.convertArea(areaInSqm, 'sqm', 'sqft');
        const area = areaUnit === 'sqft' ? areaInSqft : areaInSqm;
        
        return {
            area: utils.roundToDecimals(area, 2),
            areaInSqft: utils.roundToDecimals(areaInSqft, 2)
        };
    }

    /**
     * Create a description of the window configuration
     * @param {number} glassDoorsCount - Number of glass doors
     * @param {number} meshDoorsCount - Number of mesh doors
     * @param {number} openableDoorsCount - Number of openable doors
     * @param {boolean} withMesh - Whether the window has mesh
     * @param {boolean} topFixed - Whether the window has top fixed
     * @param {boolean} bottomFixed - Whether the window has bottom fixed
     * @returns {string} - Configuration description
     */
    createConfigDescription(
        glassDoorsCount, meshDoorsCount, openableDoorsCount, 
        withMesh, topFixed, bottomFixed
    ) {
        const parts = [];
        
        if (glassDoorsCount > 0) {
            parts.push(`${glassDoorsCount} Glass Door${glassDoorsCount > 1 ? 's' : ''}`);
        }
        
        if (meshDoorsCount > 0) {
            parts.push(`${meshDoorsCount} Mesh Door${meshDoorsCount > 1 ? 's' : ''}`);
        }
        
        if (openableDoorsCount > 0) {
            parts.push(`${openableDoorsCount} Openable Door${openableDoorsCount > 1 ? 's' : ''}`);
        }
        
        if (withMesh) {
            parts.push('With Mesh');
        }
        
        if (topFixed) {
            parts.push('Top Fixed');
        }
        
        if (bottomFixed) {
            parts.push('Bottom Fixed');
        }
        
        return parts.join(', ');
    }

    /**
     * Render windows table
     */
    renderWindows() {
        const tbody = document.getElementById('windowRequirementsTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (this.windows.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="9">No windows added yet</td>`;
            tbody.appendChild(row);
            return;
        }
        
        this.windows.forEach(window => {
            const row = document.createElement('tr');
            
            // Create hardware details text
            const hardwareDetails = window.hardwareCost > 0 
                ? `${window.hardwareType}: ₹${utils.formatCurrency(window.hardwareCost)}` 
                : 'None';
                
            // Create glass details text
            let glassDetails = '';
            if (window.glassType) {
                glassDetails = `${window.glassType}`;
                if (window.glassThickness) {
                    glassDetails += `, ${window.glassThickness}mm`;
                }
            }
            
            row.innerHTML = `
                <td>${window.windowType}</td>
                <td>${window.width}×${window.height} ${window.unit}</td>
                <td>${window.quantity}</td>
                <td>${window.area} ${window.areaUnit}</td>
                <td>${this.createConfigDescription(
                    window.configuration.glassDoorsCount,
                    window.configuration.meshDoorsCount,
                    window.configuration.openableDoorsCount,
                    window.configuration.withMesh,
                    window.configuration.topFixed,
                    window.configuration.bottomFixed
                )}</td>
                <td title="${hardwareDetails}">
                    ${window.hardwareType}${window.glassType ? '<br><small>' + glassDetails + '</small>' : ''}
                </td>
                <td>
                    <span class="rate-label">₹${utils.formatCurrency(window.ratePerUnit)}/${window.areaUnit}</span>
                    <div class="calc-breakdown">
                        Area: ${window.area} ${window.areaUnit} × ₹${utils.formatCurrency(window.ratePerUnit)} = ₹${utils.formatCurrency(window.areaAmount)}
                        ${window.hardwareCost > 0 ? `\nHardware: ₹${utils.formatCurrency(window.hardwareCost)}` : ''}
                        \nPer window: ₹${utils.formatCurrency(window.windowUnitAmount)}
                        \nTotal (${window.quantity} pcs): ₹${utils.formatCurrency(window.amount)}
                    </div>
                </td>
                <td>₹${utils.formatCurrency(window.amount)}</td>
                <td>
                    <button class="delete-btn" data-id="${window.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add delete button event
            row.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteWindow(window.id);
            });
            
            tbody.appendChild(row);
        });
    }

    /**
     * Update total area and amount
     */
    updateTotals() {
        this.totalArea = this.windows.reduce((sum, window) => {
            // Convert all areas to the same unit (sqft) for addition
            const areaInSqft = window.areaUnit === 'sqft' ? 
                window.area : 
                utils.convertArea(window.area, 'sqm', 'sqft');
            return sum + (areaInSqft * window.quantity);
        }, 0);
        
        this.totalAmount = this.windows.reduce((sum, window) => sum + window.amount, 0);
        
        // Display in UI
        document.getElementById('windowTotalArea').textContent = 
            `${utils.roundToDecimals(this.totalArea, 2)} sq.ft`;
        document.getElementById('windowTotalAmount').textContent = 
            utils.formatCurrency(this.totalAmount);
    }

    /**
     * Delete a window by ID
     * @param {string} id - The window ID
     */
    deleteWindow(id) {
        this.windows = this.windows.filter(window => window.id !== id);
        this.renderWindows();
        this.updateTotals();
    }

    /**
     * Reset the window form
     */
    resetForm() {
        // Reset numeric inputs
        document.getElementById('windowWidth').value = '';
        document.getElementById('windowHeight').value = '';
        document.getElementById('windowQuantity').value = '1';
        document.getElementById('windowRatePerUnit').value = '';
        document.getElementById('glassDoorsCount').value = '0';
        document.getElementById('meshDoorsCount').value = '0';
        document.getElementById('openableDoorsCount').value = '0';
        document.getElementById('hardwareCost').value = '0';
        document.getElementById('windowDescription').value = '';
        
        // Reset checkboxes
        document.getElementById('withMesh').checked = false;
        document.getElementById('topFixed').checked = false;
        document.getElementById('bottomFixed').checked = false;
        
        // Focus on first field
        document.getElementById('windowWidth').focus();
    }

    /**
     * Add current windows to quotation
     */
    addToQuotation() {
        if (this.windows.length === 0) {
            utils.showNotification('No windows to add', true);
            return;
        }
        
        // Group windows by type
        const groupedWindows = this.groupWindowsByType();
        
        // Add each window group to quotation
        Object.entries(groupedWindows).forEach(([windowType, windows]) => {
            const totalArea = this.calculateGroupArea(windows);
            const totalAmount = windows.reduce((sum, w) => sum + w.amount, 0);
            const totalQuantity = windows.reduce((sum, w) => sum + w.quantity, 0);
            
            // Get sample window for details
            const sampleWindow = windows[0];
            
            // Create window specifications
            const windowDetails = windows.map(w => ({
                width: w.width,
                height: w.height,
                unit: w.unit,
                quantity: w.quantity,
                hardwareType: w.hardwareType,
                hardwareCost: w.hardwareCost,
                glassType: w.glassType,
                glassThickness: w.glassThickness,
                configuration: w.configuration,
                description: w.description
            }));
            
            // Add to quotation
            this.quotationManager.addItem({
                type: 'Window',
                name: `${windowType} Window${totalQuantity > 1 ? 's' : ''}`,
                description: `${totalQuantity} pcs, ${totalArea} ${sampleWindow.areaUnit}`,
                indexedDescription: `${windowType} Windows - ${totalQuantity} pcs`,
                quantity: totalQuantity,
                unit: 'pcs',
                amount: totalAmount,
                details: {
                    windows: windowDetails
                }
            });
        });
        
        utils.showNotification('Windows added to quotation');
    }

    /**
     * Group windows by type
     * @returns {Object} - Windows grouped by type
     */
    groupWindowsByType() {
        return this.windows.reduce((groups, window) => {
            if (!groups[window.windowType]) {
                groups[window.windowType] = [];
            }
            groups[window.windowType].push(window);
            return groups;
        }, {});
    }

    /**
     * Calculate total area for a group of windows
     * @param {Array} windows - Array of window objects
     * @returns {number} - Total area in sqft
     */
    calculateGroupArea(windows) {
        return windows.reduce((sum, window) => {
            const areaInSqft = window.areaUnit === 'sqft' ? 
                window.area : 
                utils.convertArea(window.area, 'sqm', 'sqft');
            return sum + (areaInSqft * window.quantity);
        }, 0);
    }

    /**
     * Clear all windows
     */
    clearWindows() {
        this.windows = [];
        this.renderWindows();
        this.updateTotals();
    }

    /**
     * Save current state to JSON
     * @returns {Object} - The state object
     */
    saveState() {
        return {
            windows: this.windows,
            totalArea: this.totalArea,
            totalAmount: this.totalAmount
        };
    }

    /**
     * Load state from saved JSON
     * @param {Object} state - The state object
     */
    loadState(state) {
        if (!state) return;
        
        this.windows = state.windows;
        this.totalArea = state.totalArea;
        this.totalAmount = state.totalAmount;
        
        this.renderWindows();
        this.updateTotals();
    }
}

// Create global instance of the window manager
window.windowManager = new WindowManager(); 