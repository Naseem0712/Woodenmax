/**
 * Grill Module
 * Handles all grill-related calculations and interactions
 */

class GrillManager {
    constructor() {
        this.materialForm = null;
        this.requirementForm = null;
        this.requirements = [];
        this.totalWeight = 0;
        this.totalAmount = 0;
        this.hardware = [];
        this.hardwareTotalAmount = 0;
        this.currentMaterial = {
            width: 0,
            depth: 0,
            thickness: 0,
            weight: 0,
            weightUnit: 'kg/m',
            rate: 0,
            description: ''
        };
        this.quotationManager = null; // Will be set by app.js
    }

    /**
     * Initialize the Grill Manager
     * @param {Object} quotationManager - Reference to the QuotationManager
     */
    init(quotationManager) {
        this.quotationManager = quotationManager;
        
        // Get form elements
        this.materialForm = document.getElementById('grillMaterialForm');
        this.requirementForm = document.getElementById('grillRequirementForm');
        this.hardwareForm = document.getElementById('grillHardwareForm');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved material if exists
        this.loadSavedMaterial();
    }

    /**
     * Set up event listeners for the grill forms
     */
    setupEventListeners() {
        // Material form submit
        this.materialForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMaterial();
        });
        
        // Requirement form submit
        this.requirementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRequirement();
        });
        
        // Hardware form submit
        this.hardwareForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHardware();
        });
        
        // Hardware calculation preview
        document.getElementById('grillHardwareUnit').addEventListener('input', this.updateHardwareCalculation.bind(this));
        document.getElementById('grillHardwareRate').addEventListener('input', this.updateHardwareCalculation.bind(this));
        
        // Load saved material button
        document.getElementById('loadGrillMaterialBtn').addEventListener('click', () => {
            this.loadSavedMaterial();
        });
        
        // Add to quotation button
        document.getElementById('addGrillToQuote').addEventListener('click', () => {
            this.addToQuotation();
        });
    }

    /**
     * Save material details from the form
     */
    saveMaterial() {
        // Get values from form
        const width = parseFloat(document.getElementById('grillMaterialWidth').value);
        const depth = parseFloat(document.getElementById('grillMaterialDepth').value);
        const thickness = parseFloat(document.getElementById('grillMaterialThickness').value);
        const weight = parseFloat(document.getElementById('grillMaterialWeight').value);
        const weightUnit = document.getElementById('grillWeightUnit').value;
        const rate = parseFloat(document.getElementById('grillMaterialRate').value);
        const description = document.getElementById('grillMaterialDescription').value;
        
        // Validate inputs
        if (!width || !depth || !thickness || !weight || !rate) {
            utils.showNotification('Please fill all required fields', true);
            return;
        }
        
        // Set current material
        this.currentMaterial = {
            width,
            depth,
            thickness,
            weight,
            weightUnit,
            rate,
            description
        };
        
        // Save to localStorage
        utils.saveToLocalStorage('grillMaterial', this.currentMaterial);
        utils.showNotification('Material saved successfully');
        
        // Update calculations for existing requirements
        this.updateRequirements();
    }

    /**
     * Load saved material from localStorage
     */
    loadSavedMaterial() {
        const savedMaterial = utils.loadFromLocalStorage('grillMaterial');
        
        if (!savedMaterial) {
            utils.showNotification('No saved material found', true);
            return;
        }
        
        // Set saved material as current
        this.currentMaterial = savedMaterial;
        
        // Populate form
        document.getElementById('grillMaterialWidth').value = savedMaterial.width;
        document.getElementById('grillMaterialDepth').value = savedMaterial.depth;
        document.getElementById('grillMaterialThickness').value = savedMaterial.thickness;
        document.getElementById('grillMaterialWeight').value = savedMaterial.weight;
        document.getElementById('grillWeightUnit').value = savedMaterial.weightUnit;
        document.getElementById('grillMaterialRate').value = savedMaterial.rate;
        document.getElementById('grillMaterialDescription').value = savedMaterial.description || '';
        
        utils.showNotification('Material loaded successfully');
        
        // Update calculations for existing requirements
        this.updateRequirements();
    }

    /**
     * Add a new requirement from the form
     */
    addRequirement() {
        // Check if material is set
        if (!this.currentMaterial.weight || !this.currentMaterial.rate) {
            utils.showNotification('Please set material details first', true);
            return;
        }
        
        // Get values from form
        const size = document.getElementById('grillSize').value;
        const unit = document.getElementById('grillUnit').value;
        const quantity = parseInt(document.getElementById('grillQuantity').value);
        
        // Validate inputs
        if (!size || !quantity) {
            utils.showNotification('Please enter size and quantity', true);
            return;
        }
        
        // Parse size (handle different formats)
        const parsedSize = utils.parseSizeInput(size);
        const sizeValue = parsedSize.unit ? parsedSize.value : parseFloat(size);
        const sizeUnit = parsedSize.unit || unit;
        
        if (!sizeValue || sizeValue <= 0 || !quantity || quantity <= 0) {
            utils.showNotification('Please enter valid size and quantity', true);
            return;
        }
        
        // Calculate weight and amount based on material and size
        const { weight, amount } = this.calculateRequirement(sizeValue, sizeUnit, quantity);
        
        // Add to requirements array
        const requirement = {
            id: utils.generateId(),
            size: sizeValue,
            unit: sizeUnit,
            quantity,
            weight,
            amount
        };
        
        this.requirements.push(requirement);
        
        // Update UI
        this.renderRequirements();
        this.updateTotals();
        
        // Clear form
        document.getElementById('grillSize').value = '';
        document.getElementById('grillQuantity').value = '';
        document.getElementById('grillSize').focus();
    }

    /**
     * Calculate weight and amount for a requirement
     * @param {number} size - The size value
     * @param {string} unit - The unit (mm, cm, inch, ft, m)
     * @param {number} quantity - The quantity
     * @returns {Object} - Object with weight and amount
     */
    calculateRequirement(size, unit, quantity) {
        // Convert to the unit used in weight (m or ft)
        let convertedSize;
        if (this.currentMaterial.weightUnit === 'kg/m') {
            convertedSize = utils.convertLength(size, unit, 'm');
        } else if (this.currentMaterial.weightUnit === 'kg/ft') {
            convertedSize = utils.convertLength(size, unit, 'ft');
        } else {
            // For per piece, size doesn't matter
            convertedSize = 1;
        }
        
        // Calculate weight
        const weight = this.currentMaterial.weight * convertedSize * quantity;
        
        // Calculate amount
        const amount = weight * this.currentMaterial.rate;
        
        return {
            weight: utils.roundToDecimals(weight, 3),
            amount: utils.roundToDecimals(amount, 2)
        };
    }

    /**
     * Render requirements table
     */
    renderRequirements() {
        const tbody = document.getElementById('grillRequirementsTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (this.requirements.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6">No requirements added yet</td>`;
            tbody.appendChild(row);
            return;
        }
        
        this.requirements.forEach(req => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.size} ${req.unit}</td>
                <td>${req.unit}</td>
                <td>${req.quantity}</td>
                <td>${utils.formatWeight(req.weight)} kg</td>
                <td>₹${utils.formatCurrency(req.amount)}</td>
                <td>
                    <button class="delete-btn" data-id="${req.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add delete button event
            row.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteRequirement(req.id);
            });
            
            tbody.appendChild(row);
        });
    }

    /**
     * Update total weight and amount
     */
    updateTotals() {
        this.totalWeight = this.requirements.reduce((sum, req) => sum + req.weight, 0);
        this.totalAmount = this.requirements.reduce((sum, req) => sum + req.amount, 0);
        
        document.getElementById('grillTotalWeight').textContent = utils.formatWeight(this.totalWeight);
        document.getElementById('grillTotalAmount').textContent = utils.formatCurrency(this.totalAmount);
    }

    /**
     * Delete a requirement by ID
     * @param {string} id - The requirement ID
     */
    deleteRequirement(id) {
        this.requirements = this.requirements.filter(req => req.id !== id);
        this.renderRequirements();
        this.updateTotals();
    }

    /**
     * Update all requirements' calculations (after material change)
     */
    updateRequirements() {
        if (!this.requirements.length) return;
        
        this.requirements = this.requirements.map(req => {
            const { weight, amount } = this.calculateRequirement(req.size, req.unit, req.quantity);
            return {
                ...req,
                weight,
                amount
            };
        });
        
        this.renderRequirements();
        this.updateTotals();
    }

    /**
     * Add hardware from the form
     */
    addHardware() {
        // Get values from form
        const name = document.getElementById('grillHardwareName').value;
        const units = parseInt(document.getElementById('grillHardwareUnit').value);
        const rate = parseFloat(document.getElementById('grillHardwareRate').value);
        
        // Validate inputs
        if (!name || !units || !rate) {
            utils.showNotification('Please fill all hardware fields', true);
            return;
        }
        
        // Calculate amount
        const amount = units * rate;
        
        // Add to hardware array
        const hardwareItem = {
            id: utils.generateId(),
            name,
            units,
            rate,
            amount
        };
        
        this.hardware.push(hardwareItem);
        
        // Update UI
        this.renderHardware();
        this.updateHardwareTotals();
        
        // Clear form
        document.getElementById('grillHardwareName').value = '';
        document.getElementById('grillHardwareUnit').value = '1';
        document.getElementById('grillHardwareRate').value = '';
        document.getElementById('grillHardwareName').focus();
    }
    
    /**
     * Update hardware calculation preview
     */
    updateHardwareCalculation() {
        const units = parseInt(document.getElementById('grillHardwareUnit').value) || 0;
        const rate = parseFloat(document.getElementById('grillHardwareRate').value) || 0;
        const amount = units * rate;
        
        document.getElementById('grillHardwareCalculation').textContent = `Amount: ₹${utils.formatCurrency(amount)}`;
    }
    
    /**
     * Render hardware table
     */
    renderHardware() {
        const tbody = document.getElementById('grillHardwareTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (this.hardware.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5">No hardware added yet</td>`;
            tbody.appendChild(row);
            return;
        }
        
        this.hardware.forEach(hw => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${hw.name}</td>
                <td>${hw.units}</td>
                <td>₹${utils.formatCurrency(hw.rate)}</td>
                <td>₹${utils.formatCurrency(hw.amount)}</td>
                <td>
                    <button class="delete-btn" data-id="${hw.id}" data-type="hardware">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add delete button event
            row.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteHardware(hw.id);
            });
            
            tbody.appendChild(row);
        });
    }
    
    /**
     * Update hardware totals
     */
    updateHardwareTotals() {
        this.hardwareTotalAmount = this.hardware.reduce((sum, hw) => sum + hw.amount, 0);
        document.getElementById('grillHardwareTotalAmount').textContent = utils.formatCurrency(this.hardwareTotalAmount);
    }
    
    /**
     * Delete hardware item
     * @param {string} id - The hardware ID
     */
    deleteHardware(id) {
        this.hardware = this.hardware.filter(hw => hw.id !== id);
        this.renderHardware();
        this.updateHardwareTotals();
    }

    /**
     * Add to quotation
     */
    addToQuotation() {
        // Check if requirements exist
        if (this.requirements.length === 0 && this.hardware.length === 0) {
            utils.showNotification('No items to add to quotation', true);
            return;
        }
        
        // Create a quotation item for material requirements
        if (this.requirements.length > 0) {
            // Create title based on material description or default
            const materialTitle = this.currentMaterial.description 
                ? `Grill (${this.currentMaterial.description})` 
                : `Grill (${this.currentMaterial.width}×${this.currentMaterial.depth}×${this.currentMaterial.thickness}mm)`;
            
            // Format dimensions for display
            const dimensions = `${this.currentMaterial.width}×${this.currentMaterial.depth}×${this.currentMaterial.thickness}mm`;
            
            // Create indexed requirement list for cutting plan
            const requirements = this.requirements.map(req => ({
                size: req.size,
                unit: req.unit,
                quantity: req.quantity,
                itemType: 'Grill',
                description: materialTitle
            }));
            
            // Add material to quotation
            this.quotationManager.addItem({
                type: 'Grill',
                name: materialTitle,
                description: `Material: ${dimensions}, ${this.currentMaterial.weight} ${this.currentMaterial.weightUnit}`,
                indexedDescription: `Grill Material - ${dimensions}`,
                quantity: 1,
                unit: 'set',
                amount: this.totalAmount,
                details: {
                    material: {
                        type: this.currentMaterial.description || 'Grill Material',
                        width: this.currentMaterial.width,
                        depth: this.currentMaterial.depth,
                        thickness: this.currentMaterial.thickness,
                        weight: this.currentMaterial.weight,
                        weightUnit: this.currentMaterial.weightUnit,
                        dimensions: dimensions
                    },
                    requirements: requirements
                }
            });
        }
        
        // Add hardware items individually
        this.hardware.forEach(hw => {
            this.quotationManager.addItem({
                type: 'Hardware',
                name: `Grill Hardware - ${hw.name}`,
                description: `${hw.name} (${hw.units} units)`,
                indexedDescription: `Hardware - ${hw.name}`,
                quantity: hw.units,
                unit: 'pcs',
                rate: hw.rate,
                amount: hw.amount
            });
        });
        
        utils.showNotification('Added to quotation successfully');
    }

    /**
     * Clear all requirements
     */
    clearRequirements() {
        this.requirements = [];
        this.renderRequirements();
        this.updateTotals();
    }

    /**
     * Save current state to JSON
     * @returns {Object} - The state object
     */
    saveState() {
        return {
            requirements: this.requirements,
            totalWeight: this.totalWeight,
            totalAmount: this.totalAmount,
            hardware: this.hardware,
            hardwareTotalAmount: this.hardwareTotalAmount,
            currentMaterial: this.currentMaterial
        };
    }

    /**
     * Load state from saved data
     * @param {Object} state - The state object
     */
    loadState(state) {
        if (!state) return;
        
        this.requirements = state.requirements || [];
        this.totalWeight = state.totalWeight || 0;
        this.totalAmount = state.totalAmount || 0;
        this.hardware = state.hardware || [];
        this.hardwareTotalAmount = state.hardwareTotalAmount || 0;
        this.currentMaterial = state.currentMaterial || {
            width: 0,
            depth: 0,
            thickness: 0,
            weight: 0,
            weightUnit: 'kg/m',
            rate: 0,
            description: ''
        };
        
        // Update UI
        this.renderRequirements();
        this.renderHardware();
        this.updateTotals();
        this.updateHardwareTotals();
        
        // Populate material form
        document.getElementById('grillMaterialWidth').value = this.currentMaterial.width;
        document.getElementById('grillMaterialDepth').value = this.currentMaterial.depth;
        document.getElementById('grillMaterialThickness').value = this.currentMaterial.thickness;
        document.getElementById('grillMaterialWeight').value = this.currentMaterial.weight;
        document.getElementById('grillWeightUnit').value = this.currentMaterial.weightUnit;
        document.getElementById('grillMaterialRate').value = this.currentMaterial.rate;
        document.getElementById('grillMaterialDescription').value = this.currentMaterial.description || '';
    }
}

// Create global instance of the grill manager
window.grillManager = new GrillManager(); 