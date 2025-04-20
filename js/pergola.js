/**
 * Pergola Module
 * Handles all pergola-related calculations and interactions
 */

class PergolaManager {
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
     * Initialize the Pergola Manager
     * @param {Object} quotationManager - Reference to the QuotationManager
     */
    init(quotationManager) {
        this.quotationManager = quotationManager;
        
        // Get form elements
        this.materialForm = document.getElementById('pergolaMaterialForm');
        this.requirementForm = document.getElementById('pergolaRequirementForm');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved material if exists
        this.loadSavedMaterial();
    }

    /**
     * Set up event listeners for the pergola forms
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
        document.getElementById('loadPergolaMaterialBtn').addEventListener('click', () => {
            this.loadSavedMaterial();
        });
        
        // Add to quotation button
        document.getElementById('addPergolaToQuote').addEventListener('click', () => {
            this.addToQuotation();
        });
    }

    /**
     * Save material details from the form
     */
    saveMaterial() {
        // Get values from form
        const width = parseFloat(document.getElementById('pergolaMaterialWidth').value);
        const depth = parseFloat(document.getElementById('pergolaMaterialDepth').value);
        const thickness = parseFloat(document.getElementById('pergolaMaterialThickness').value);
        const weight = parseFloat(document.getElementById('pergolaMaterialWeight').value);
        const weightUnit = document.getElementById('pergolaWeightUnit').value;
        const rate = parseFloat(document.getElementById('pergolaMaterialRate').value);
        const description = document.getElementById('pergolaMaterialDescription').value;
        
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
        utils.saveToLocalStorage('pergolaMaterial', this.currentMaterial);
        utils.showNotification('Material saved successfully');
        
        // Update calculations for existing requirements
        this.updateRequirements();
    }

    /**
     * Load saved material from localStorage
     */
    loadSavedMaterial() {
        const savedMaterial = utils.loadFromLocalStorage('pergolaMaterial');
        
        if (!savedMaterial) {
            utils.showNotification('No saved material found', true);
            return;
        }
        
        // Set saved material as current
        this.currentMaterial = savedMaterial;
        
        // Populate form
        document.getElementById('pergolaMaterialWidth').value = savedMaterial.width;
        document.getElementById('pergolaMaterialDepth').value = savedMaterial.depth;
        document.getElementById('pergolaMaterialThickness').value = savedMaterial.thickness;
        document.getElementById('pergolaMaterialWeight').value = savedMaterial.weight;
        document.getElementById('pergolaWeightUnit').value = savedMaterial.weightUnit;
        document.getElementById('pergolaMaterialRate').value = savedMaterial.rate;
        document.getElementById('pergolaMaterialDescription').value = savedMaterial.description || '';
        
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
        const itemType = document.getElementById('pergolaItemType').value;
        const size = document.getElementById('pergolaSize').value;
        const unit = document.getElementById('pergolaUnit').value;
        const quantity = parseInt(document.getElementById('pergolaQuantity').value);
        const description = document.getElementById('pergolaDescription').value;
        
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
            itemType,
            size: sizeValue,
            unit: sizeUnit,
            quantity,
            weight,
            amount,
            description
        };
        
        this.requirements.push(requirement);
        
        // Update UI
        this.renderRequirements();
        this.updateTotals();
        
        // Clear form
        document.getElementById('pergolaSize').value = '';
        document.getElementById('pergolaQuantity').value = '';
        document.getElementById('pergolaDescription').value = '';
        document.getElementById('pergolaSize').focus();
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
        const tbody = document.getElementById('pergolaRequirementsTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (this.requirements.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8">No requirements added yet</td>`;
            tbody.appendChild(row);
            return;
        }
        
        this.requirements.forEach(req => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${req.itemType}</td>
                <td>${req.description || '-'}</td>
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
        
        document.getElementById('pergolaTotalWeight').textContent = utils.formatWeight(this.totalWeight);
        document.getElementById('pergolaTotalAmount').textContent = utils.formatCurrency(this.totalAmount);
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
            `${this.currentMaterial.width}x${this.currentMaterial.depth}x${this.currentMaterial.thickness}mm Pipe`;
        
        // Add to quotation
        this.quotationManager.addItem({
            type: 'Pergola',
            description: `Pergola - ${materialDesc}`,
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
        document.getElementById('pergolaMaterialWidth').value = this.currentMaterial.width;
        document.getElementById('pergolaMaterialDepth').value = this.currentMaterial.depth;
        document.getElementById('pergolaMaterialThickness').value = this.currentMaterial.thickness;
        document.getElementById('pergolaMaterialWeight').value = this.currentMaterial.weight;
        document.getElementById('pergolaWeightUnit').value = this.currentMaterial.weightUnit;
        document.getElementById('pergolaMaterialRate').value = this.currentMaterial.rate;
        document.getElementById('pergolaMaterialDescription').value = this.currentMaterial.description || '';
        
        this.renderRequirements();
        this.updateTotals();
    }
}

// Create global instance of the pergola manager
window.pergolaManager = new PergolaManager(); 