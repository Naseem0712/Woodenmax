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
     * Add current requirements to quotation
     */
    addToQuotation() {
        if (!this.requirements.length) {
            utils.showNotification('No requirements to add', true);
            return;
        }
        
        // Get material description
        const materialDesc = this.currentMaterial.description || 
            `${this.currentMaterial.width}x${this.currentMaterial.depth}x${this.currentMaterial.thickness}mm`;
        
        // Add to quotation
        this.quotationManager.addItem({
            type: 'Grill',
            description: `MS Grill - ${materialDesc}`,
            quantity: `${this.requirements.length} items`,
            totalWeight: this.totalWeight,
            unit: 'kg',
            rate: this.currentMaterial.rate,
            amount: this.totalAmount,
            details: {
                material: this.currentMaterial,
                requirements: [...this.requirements]
            }
        });
        
        utils.showNotification('Added to quotation');
        
        // For cutting plan
        if (document.getElementById('generateCuttingPlan').checked) {
            // Prepare pieces for cutting plan
            const pieces = this.requirements.map(req => ({
                size: req.size,
                unit: req.unit,
                quantity: req.quantity,
                id: req.id
            }));
            
            // Get stock length from options
            const stockLength = parseFloat(document.getElementById('stockLength').value);
            const stockUnit = document.getElementById('stockLengthUnit').value;
            
            // Set stock length in mm
            cuttingPlan.setStockLength(utils.convertLength(stockLength, stockUnit, 'mm'));
            
            // Calculate cutting plan
            cuttingPlan.calculateCuttingPlan(pieces);
        }
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
            currentMaterial: this.currentMaterial,
            requirements: this.requirements,
            totalWeight: this.totalWeight,
            totalAmount: this.totalAmount
        };
    }

    /**
     * Load state from saved JSON
     * @param {Object} state - The state object
     */
    loadState(state) {
        if (!state) return;
        
        this.currentMaterial = state.currentMaterial;
        this.requirements = state.requirements;
        this.totalWeight = state.totalWeight;
        this.totalAmount = state.totalAmount;
        
        // Update UI
        document.getElementById('grillMaterialWidth').value = this.currentMaterial.width;
        document.getElementById('grillMaterialDepth').value = this.currentMaterial.depth;
        document.getElementById('grillMaterialThickness').value = this.currentMaterial.thickness;
        document.getElementById('grillMaterialWeight').value = this.currentMaterial.weight;
        document.getElementById('grillWeightUnit').value = this.currentMaterial.weightUnit;
        document.getElementById('grillMaterialRate').value = this.currentMaterial.rate;
        document.getElementById('grillMaterialDescription').value = this.currentMaterial.description || '';
        
        this.renderRequirements();
        this.updateTotals();
    }
}

// Create global instance of the grill manager
window.grillManager = new GrillManager(); 