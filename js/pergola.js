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
        this.hardware = [];
        this.hardwareTotalAmount = 0;
        this.glass = [];
        this.glassTotalAmount = 0;
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
        this.hardwareForm = document.getElementById('pergolaHardwareForm');
        this.glassForm = document.getElementById('pergolaGlassForm');
        
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
        
        // Hardware form submit
        this.hardwareForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHardware();
        });
        
        // Glass form submit
        this.glassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGlass();
        });
        
        // Tab buttons
        document.getElementById('pergolaHardwareTab').addEventListener('click', () => {
            this.switchTab('hardware');
        });
        
        document.getElementById('pergolaGlassTab').addEventListener('click', () => {
            this.switchTab('glass');
        });
        
        // Hardware calculation preview
        document.getElementById('pergolaHardwareUnit').addEventListener('input', this.updateHardwareCalculation.bind(this));
        document.getElementById('pergolaHardwareRate').addEventListener('input', this.updateHardwareCalculation.bind(this));
        
        // Glass calculation preview
        document.getElementById('pergolaGlassWidth').addEventListener('input', this.updateGlassCalculation.bind(this));
        document.getElementById('pergolaGlassDepth').addEventListener('input', this.updateGlassCalculation.bind(this));
        document.getElementById('pergolaGlassDimensionUnit').addEventListener('change', this.updateGlassCalculation.bind(this));
        document.getElementById('pergolaGlassAreaUnit').addEventListener('change', this.updateGlassCalculation.bind(this));
        document.getElementById('pergolaGlassRate').addEventListener('input', this.updateGlassCalculation.bind(this));
        
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
     * Switch between hardware and glass tabs
     * @param {string} tab - The tab to switch to: 'hardware' or 'glass'
     */
    switchTab(tab) {
        const hardwareTab = document.getElementById('pergolaHardwareTab');
        const glassTab = document.getElementById('pergolaGlassTab');
        const hardwareContent = document.getElementById('pergolaHardwareTabContent');
        const glassContent = document.getElementById('pergolaGlassTabContent');
        
        if (tab === 'hardware') {
            hardwareTab.classList.add('active');
            glassTab.classList.remove('active');
            hardwareContent.style.display = 'block';
            glassContent.style.display = 'none';
        } else if (tab === 'glass') {
            hardwareTab.classList.remove('active');
            glassTab.classList.add('active');
            hardwareContent.style.display = 'none';
            glassContent.style.display = 'block';
        }
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
     * Add hardware from the form
     */
    addHardware() {
        // Get values from form
        const name = document.getElementById('pergolaHardwareName').value;
        const units = parseInt(document.getElementById('pergolaHardwareUnit').value);
        const rate = parseFloat(document.getElementById('pergolaHardwareRate').value);
        
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
        document.getElementById('pergolaHardwareName').value = '';
        document.getElementById('pergolaHardwareUnit').value = '1';
        document.getElementById('pergolaHardwareRate').value = '';
        document.getElementById('pergolaHardwareName').focus();
    }
    
    /**
     * Update hardware calculation preview
     */
    updateHardwareCalculation() {
        const units = parseInt(document.getElementById('pergolaHardwareUnit').value) || 0;
        const rate = parseFloat(document.getElementById('pergolaHardwareRate').value) || 0;
        const amount = units * rate;
        
        document.getElementById('pergolaHardwareCalculation').textContent = `Amount: ₹${utils.formatCurrency(amount)}`;
    }
    
    /**
     * Add glass from the form
     */
    addGlass() {
        // Get values from form
        const name = document.getElementById('pergolaGlassName').value;
        const thickness = parseFloat(document.getElementById('pergolaGlassThickness').value);
        const width = parseFloat(document.getElementById('pergolaGlassWidth').value);
        const depth = parseFloat(document.getElementById('pergolaGlassDepth').value);
        const dimensionUnit = document.getElementById('pergolaGlassDimensionUnit').value;
        const areaUnit = document.getElementById('pergolaGlassAreaUnit').value;
        const rate = parseFloat(document.getElementById('pergolaGlassRate').value);
        
        // Validate inputs
        if (!name || !thickness || !width || !depth || !rate) {
            utils.showNotification('Please fill all glass fields', true);
            return;
        }
        
        // Calculate area based on dimensions and unit
        const { area, formattedArea } = this.calculateGlassArea(width, depth, dimensionUnit, areaUnit);
        
        // Calculate amount: area × rate
        const amount = area * rate;
        
        // Add to glass array
        const glassItem = {
            id: utils.generateId(),
            name,
            thickness,
            width,
            depth,
            dimensionUnit,
            area,
            formattedArea,
            areaUnit,
            rate,
            amount
        };
        
        this.glass.push(glassItem);
        
        // Update UI
        this.renderGlass();
        this.updateGlassTotals();
        
        // Clear form
        document.getElementById('pergolaGlassName').value = '';
        document.getElementById('pergolaGlassThickness').value = '';
        document.getElementById('pergolaGlassWidth').value = '';
        document.getElementById('pergolaGlassDepth').value = '';
        document.getElementById('pergolaGlassName').focus();
    }
    
    /**
     * Calculate glass area based on dimensions and unit
     * @param {number} width - The width
     * @param {number} depth - The depth
     * @param {string} dimensionUnit - The dimension unit (mm, cm, inch, ft, m)
     * @param {string} areaUnit - The area unit (sqft, sqm)
     * @returns {Object} - Object with area and formatted area
     */
    calculateGlassArea(width, depth, dimensionUnit, areaUnit) {
        // Convert dimensions to meters
        const widthInM = utils.convertLength(width, dimensionUnit, 'm');
        const depthInM = utils.convertLength(depth, dimensionUnit, 'm');
        
        // Calculate area in square meters
        const areaInSqM = widthInM * depthInM;
        
        // Convert to target area unit if needed
        let finalArea;
        if (areaUnit === 'sqft') {
            // 1 sqm = 10.764 sqft
            finalArea = areaInSqM * 10.764;
        } else {
            finalArea = areaInSqM;
        }
        
        // Format area for display
        const formattedArea = `${utils.roundToDecimals(finalArea, 2)} ${areaUnit === 'sqft' ? 'sq.ft' : 'sq.m'}`;
        
        return {
            area: utils.roundToDecimals(finalArea, 4),
            formattedArea
        };
    }
    
    /**
     * Update glass calculation preview
     */
    updateGlassCalculation() {
        const width = parseFloat(document.getElementById('pergolaGlassWidth').value) || 0;
        const depth = parseFloat(document.getElementById('pergolaGlassDepth').value) || 0;
        const dimensionUnit = document.getElementById('pergolaGlassDimensionUnit').value;
        const areaUnit = document.getElementById('pergolaGlassAreaUnit').value;
        const rate = parseFloat(document.getElementById('pergolaGlassRate').value) || 0;
        
        if (width > 0 && depth > 0) {
            const { area, formattedArea } = this.calculateGlassArea(width, depth, dimensionUnit, areaUnit);
            const amount = area * rate;
            
            document.getElementById('pergolaGlassCalculation').textContent = 
                `Area: ${formattedArea} | Amount: ₹${utils.formatCurrency(amount)}`;
        } else {
            document.getElementById('pergolaGlassCalculation').textContent = 'Area: 0 | Amount: ₹0';
        }
    }
    
    /**
     * Render hardware table
     */
    renderHardware() {
        const tbody = document.getElementById('pergolaHardwareTable').querySelector('tbody');
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
     * Render glass table
     */
    renderGlass() {
        const tbody = document.getElementById('pergolaGlassTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (this.glass.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7">No glass added yet</td>`;
            tbody.appendChild(row);
            return;
        }
        
        this.glass.forEach(g => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${g.name}</td>
                <td>${g.thickness} mm</td>
                <td>${g.width}×${g.depth} ${g.dimensionUnit}</td>
                <td>${g.formattedArea}</td>
                <td>₹${utils.formatCurrency(g.rate)}/${g.areaUnit === 'sqft' ? 'sq.ft' : 'sq.m'}</td>
                <td>₹${utils.formatCurrency(g.amount)}</td>
                <td>
                    <button class="delete-btn" data-id="${g.id}" data-type="glass">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add delete button event
            row.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteGlass(g.id);
            });
            
            tbody.appendChild(row);
        });
    }
    
    /**
     * Update hardware totals
     */
    updateHardwareTotals() {
        this.hardwareTotalAmount = this.hardware.reduce((sum, hw) => sum + hw.amount, 0);
        document.getElementById('pergolaHardwareTotalAmount').textContent = utils.formatCurrency(this.hardwareTotalAmount);
    }
    
    /**
     * Update glass totals
     */
    updateGlassTotals() {
        this.glassTotalAmount = this.glass.reduce((sum, g) => sum + g.amount, 0);
        document.getElementById('pergolaGlassTotalAmount').textContent = utils.formatCurrency(this.glassTotalAmount);
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
     * Delete glass item
     * @param {string} id - The glass ID
     */
    deleteGlass(id) {
        this.glass = this.glass.filter(g => g.id !== id);
        this.renderGlass();
        this.updateGlassTotals();
    }

    /**
     * Add to quotation
     */
    addToQuotation() {
        // Check if any items exist
        if (this.requirements.length === 0 && this.hardware.length === 0 && this.glass.length === 0) {
            utils.showNotification('No items to add to quotation', true);
            return;
        }
        
        // Create a quotation item for material requirements
        if (this.requirements.length > 0) {
            // Create title based on material description or default
            const materialTitle = this.currentMaterial.description 
                ? `Pergola (${this.currentMaterial.description})` 
                : `Pergola (${this.currentMaterial.width}×${this.currentMaterial.depth}×${this.currentMaterial.thickness}mm)`;
            
            // Format dimensions for display
            const dimensions = `${this.currentMaterial.width}×${this.currentMaterial.depth}×${this.currentMaterial.thickness}mm`;
            
            // Create indexed requirement list for cutting plan
            const requirements = this.requirements.map(req => ({
                size: req.size,
                unit: req.unit,
                quantity: req.quantity,
                itemType: req.itemType,
                description: materialTitle
            }));
            
            // Add material to quotation
            this.quotationManager.addItem({
                type: 'Pergola',
                name: materialTitle,
                description: `Material: ${dimensions}, ${this.currentMaterial.weight} ${this.currentMaterial.weightUnit}`,
                indexedDescription: `Pergola Material - ${dimensions}`,
                quantity: 1,
                unit: 'set',
                amount: this.totalAmount,
                details: {
                    material: {
                        type: this.currentMaterial.description || 'Pergola Material',
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
                name: `Pergola Hardware - ${hw.name}`,
                description: `${hw.name} (${hw.units} units)`,
                indexedDescription: `Hardware - ${hw.name}`,
                quantity: hw.units,
                unit: 'pcs',
                rate: hw.rate,
                amount: hw.amount
            });
        });
        
        // Add glass items individually
        this.glass.forEach(g => {
            this.quotationManager.addItem({
                type: 'Glass',
                name: `Pergola Glass - ${g.name}`,
                description: `${g.name}, ${g.thickness}mm thickness, ${g.width}×${g.depth} ${g.dimensionUnit}, Area: ${g.formattedArea}`,
                indexedDescription: `Glass - ${g.name} ${g.thickness}mm`,
                quantity: 1,
                unit: g.areaUnit === 'sqft' ? 'sq.ft' : 'sq.m',
                rate: g.rate,
                amount: g.amount,
                details: {
                    glassType: g.name,
                    thickness: g.thickness,
                    width: g.width,
                    depth: g.depth,
                    dimensionUnit: g.dimensionUnit,
                    area: g.area,
                    areaUnit: g.areaUnit
                }
            });
        });
        
        utils.showNotification('Added to quotation');
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
            totalAmount: this.totalAmount,
            hardware: this.hardware,
            hardwareTotalAmount: this.hardwareTotalAmount,
            glass: this.glass,
            glassTotalAmount: this.glassTotalAmount
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
        this.hardware = state.hardware || [];
        this.hardwareTotalAmount = state.hardwareTotalAmount || 0;
        this.glass = state.glass || [];
        this.glassTotalAmount = state.glassTotalAmount || 0;
        
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
        this.renderHardware();
        this.updateHardwareTotals();
        this.renderGlass();
        this.updateGlassTotals();
    }
}

// Create global instance of the pergola manager
window.pergolaManager = new PergolaManager();