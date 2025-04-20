/**
 * Material Database Module
 * Handles loading, searching, and managing material data
 */

class MaterialDatabase {
    constructor() {
        this.materials = [];
        this.loaded = false;
        this.modal = null;
        this.searchInput = null;
        this.searchBtn = null;
        this.table = null;
        this.selectedMaterial = null;
        this.targetType = null; // 'grill' or 'pergola'
    }

    /**
     * Initialize the material database
     */
    init() {
        // Load material data from CSV file
        this.loadMaterialsFromCSV()
            .then(() => {
                console.log('Materials loaded:', this.materials.length);
                this.loaded = true;
            })
            .catch(error => {
                console.error('Error loading materials:', error);
                utils.showNotification('Failed to load material database', true);
            });

        // Set up modal elements
        this.modal = document.getElementById('materialDatabaseModal');
        this.searchInput = document.getElementById('materialSearchInput');
        this.searchBtn = document.getElementById('materialSearchBtn');
        this.table = document.getElementById('materialDatabaseTable');

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the material database modal
     */
    setupEventListeners() {
        // Close modal
        const closeBtn = this.modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        // Close modal on click outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hideModal();
            }
        });

        // Search button click
        this.searchBtn.addEventListener('click', () => {
            this.searchMaterials();
        });

        // Search input Enter key
        this.searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                this.searchMaterials();
            }
        });

        // Setup find material buttons
        document.getElementById('findMaterialBtn').addEventListener('click', () => {
            this.targetType = 'grill';
            this.showModal();
        });

        document.getElementById('findPergolaMaterialBtn').addEventListener('click', () => {
            this.targetType = 'pergola';
            this.showModal();
        });
    }

    /**
     * Load materials from CSV file
     * @returns {Promise} Promise that resolves when materials are loaded
     */
    loadMaterialsFromCSV() {
        return new Promise((resolve, reject) => {
            console.log('Attempting to load materials from CSV...');
            
            // Reset materials array to prevent duplicates
            this.materials = [];
            
            // Use embedded data with additional materials to ensure a complete dataset
            this.loadEmbeddedSampleData();
            console.log(`Loaded ${this.materials.length} materials from embedded data`);
            
            // Try to enhance with CSV data if possible
            const loadCSVData = () => {
                // First try: standard fetch with relative path
                fetch('filtered_rhs_data.csv')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(csvText => {
                        console.log('Successfully loaded CSV data');
                        try {
                            // Use a Map for deduplication with a proper key
                            const materialsMap = new Map();
                            
                            // First add all existing materials to the map
                            this.materials.forEach(material => {
                                const key = `${material.width}-${material.depth}-${material.thickness}`;
                                materialsMap.set(key, material);
                            });
                            
                            // Process CSV materials, overwriting duplicates (CSV takes precedence)
                            const csvMaterials = this.parseCSV(csvText);
                            csvMaterials.forEach(material => {
                                if (!material) return; // Skip invalid entries
                                
                                const key = `${material.width}-${material.depth}-${material.thickness}`;
                                
                                // Format material properties
                                material.dimensions = `${material.width}×${material.depth}×${material.thickness}`;
                                material.description = `RHS ${material.width}×${material.depth}×${material.thickness}mm, ${material.weight} kg/m`;
                                
                                // Add to map (overwrites if key exists)
                                materialsMap.set(key, material);
                            });
                            
                            // Convert map back to array
                            this.materials = Array.from(materialsMap.values());
                            
                            // Sort materials by dimensions for better organization
                            this.materials.sort((a, b) => {
                                // Primary sort by width
                                if (a.width !== b.width) return a.width - b.width;
                                // Secondary sort by depth
                                if (a.depth !== b.depth) return a.depth - b.depth;
                                // Tertiary sort by thickness
                                return a.thickness - b.thickness;
                            });
                            
                            console.log(`Final material database has ${this.materials.length} unique items`);
                        } catch (parseError) {
                            console.error('Error parsing CSV data:', parseError);
                        }
                        resolve(this.materials);
                    })
                    .catch(fetchError => {
                        console.log('Error loading CSV with relative path:', fetchError);
                        resolve(this.materials); // Resolve with the embedded data
                    });
            };
            
            // Try to enhance embedded data with CSV data
            loadCSVData();
        });
    }

    /**
     * Load embedded sample material data
     * Used as a fallback when CSV loading fails
     */
    loadEmbeddedSampleData() {
        console.log('Loading comprehensive embedded material data...');
        
        // Comprehensive sample data for Rectangular Hollow Sections (RHS)
        // Including a wide range of common sizes
        const sampleData = [
            // Small RHS profiles
            { width: 20, depth: 20, thickness: 1.6, weight: 0.86 },
            { width: 20, depth: 20, thickness: 2.0, weight: 1.11 },
            { width: 25, depth: 25, thickness: 1.6, weight: 1.15 },
            { width: 25, depth: 25, thickness: 2.0, weight: 1.42 },
            { width: 25, depth: 25, thickness: 2.5, weight: 1.74 },
            { width: 30, depth: 20, thickness: 1.6, weight: 1.15 },
            { width: 30, depth: 20, thickness: 2.0, weight: 1.42 },
            { width: 30, depth: 30, thickness: 1.6, weight: 1.44 },
            { width: 30, depth: 30, thickness: 2.0, weight: 1.72 },
            { width: 30, depth: 30, thickness: 2.5, weight: 2.15 },
            
            // Medium RHS profiles
            { width: 38, depth: 38, thickness: 2.0, weight: 2.27 },
            { width: 38, depth: 38, thickness: 2.5, weight: 2.77 },
            { width: 40, depth: 20, thickness: 1.6, weight: 1.44 },
            { width: 40, depth: 20, thickness: 2.0, weight: 1.73 },
            { width: 40, depth: 20, thickness: 2.5, weight: 2.11 },
            { width: 40, depth: 25, thickness: 1.6, weight: 1.53 },
            { width: 40, depth: 25, thickness: 2.0, weight: 1.89 },
            { width: 40, depth: 25, thickness: 2.5, weight: 2.31 },
            { width: 40, depth: 40, thickness: 1.6, weight: 1.92 },
            { width: 40, depth: 40, thickness: 2.0, weight: 2.41 },
            { width: 40, depth: 40, thickness: 2.5, weight: 2.95 },
            { width: 40, depth: 40, thickness: 3.0, weight: 3.46 },
            { width: 50, depth: 25, thickness: 1.6, weight: 1.82 },
            { width: 50, depth: 25, thickness: 2.0, weight: 2.21 },
            { width: 50, depth: 25, thickness: 2.5, weight: 2.71 },
            { width: 50, depth: 30, thickness: 1.6, weight: 1.92 },
            { width: 50, depth: 30, thickness: 2.0, weight: 2.37 },
            { width: 50, depth: 30, thickness: 2.5, weight: 2.90 },
            { width: 50, depth: 50, thickness: 1.6, weight: 2.40 },
            { width: 50, depth: 50, thickness: 2.0, weight: 2.95 },
            { width: 50, depth: 50, thickness: 2.5, weight: 3.63 },
            { width: 50, depth: 50, thickness: 3.0, weight: 4.28 },
            
            // Large RHS profiles
            { width: 60, depth: 30, thickness: 2.0, weight: 2.65 },
            { width: 60, depth: 30, thickness: 2.5, weight: 3.29 },
            { width: 60, depth: 30, thickness: 3.0, weight: 3.90 },
            { width: 60, depth: 40, thickness: 2.0, weight: 2.95 },
            { width: 60, depth: 40, thickness: 2.5, weight: 3.63 },
            { width: 60, depth: 40, thickness: 3.0, weight: 4.28 },
            { width: 60, depth: 60, thickness: 2.0, weight: 3.54 },
            { width: 60, depth: 60, thickness: 2.5, weight: 4.36 },
            { width: 60, depth: 60, thickness: 3.0, weight: 5.16 },
            { width: 60, depth: 60, thickness: 3.2, weight: 5.46 },
            { width: 75, depth: 50, thickness: 2.5, weight: 4.65 },
            { width: 75, depth: 50, thickness: 3.0, weight: 5.46 },
            { width: 75, depth: 75, thickness: 2.5, weight: 5.50 },
            { width: 75, depth: 75, thickness: 3.0, weight: 6.50 },
            { width: 80, depth: 40, thickness: 2.5, weight: 4.36 },
            { width: 80, depth: 40, thickness: 3.0, weight: 5.16 },
            { width: 80, depth: 40, thickness: 4.0, weight: 6.65 },
            
            // Extra large RHS profiles
            { width: 100, depth: 50, thickness: 2.5, weight: 5.50 },
            { width: 100, depth: 50, thickness: 3.0, weight: 6.50 },
            { width: 100, depth: 50, thickness: 4.0, weight: 8.41 },
            { width: 100, depth: 60, thickness: 3.0, weight: 7.12 },
            { width: 100, depth: 60, thickness: 4.0, weight: 9.28 },
            { width: 100, depth: 100, thickness: 3.0, weight: 8.85 },
            { width: 100, depth: 100, thickness: 4.0, weight: 11.6 },
            { width: 100, depth: 100, thickness: 5.0, weight: 14.2 },
            { width: 120, depth: 60, thickness: 3.0, weight: 8.12 },
            { width: 120, depth: 60, thickness: 4.0, weight: 10.6 },
            { width: 120, depth: 80, thickness: 3.0, weight: 8.85 },
            { width: 120, depth: 80, thickness: 4.0, weight: 11.6 },
            { width: 120, depth: 120, thickness: 4.0, weight: 14.0 },
            { width: 120, depth: 120, thickness: 5.0, weight: 17.2 },
            { width: 150, depth: 50, thickness: 3.0, weight: 8.85 },
            { width: 150, depth: 50, thickness: 4.0, weight: 11.6 },
            { width: 150, depth: 100, thickness: 4.0, weight: 14.8 },
            { width: 150, depth: 100, thickness: 5.0, weight: 18.2 },
            { width: 150, depth: 150, thickness: 4.0, weight: 18.0 },
            { width: 150, depth: 150, thickness: 5.0, weight: 22.1 },
            { width: 200, depth: 100, thickness: 4.0, weight: 18.0 },
            { width: 200, depth: 100, thickness: 5.0, weight: 22.1 },
            { width: 200, depth: 100, thickness: 6.0, weight: 26.1 },
            { width: 200, depth: 200, thickness: 5.0, weight: 29.9 },
            { width: 200, depth: 200, thickness: 6.0, weight: 35.5 },
            { width: 250, depth: 150, thickness: 5.0, weight: 29.9 },
            { width: 250, depth: 150, thickness: 6.0, weight: 35.5 },
            { width: 300, depth: 200, thickness: 6.0, weight: 44.8 },
            { width: 400, depth: 200, thickness: 8.0, weight: 70.6 },
            { width: 500, depth: 300, thickness: 10.0, weight: 118 }
        ];
        
        // Process sample data
        this.materials = sampleData.map(item => ({
            width: item.width,
            depth: item.depth,
            thickness: item.thickness,
            weight: item.weight,
            dimensions: `${item.width}×${item.depth}×${item.thickness}`,
            description: `RHS ${item.width}×${item.depth}×${item.thickness}mm, ${item.weight} kg/m`
        }));
    }

    /**
     * Parse CSV text into an array of material objects
     * @param {string} csvText - The CSV text to parse
     * @returns {Array} - Array of material objects
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');

        return lines.slice(1).map(line => {
            if (!line.trim()) return null; // Skip empty lines

            const values = line.split(',');
            if (values.length !== headers.length) return null; // Skip invalid lines

            const material = {
                width: parseFloat(values[0]),
                depth: parseFloat(values[1]),
                thickness: parseFloat(values[2]),
                weight: parseFloat(values[3])
            };

            // Skip entries with invalid values
            if (isNaN(material.width) || isNaN(material.depth) || 
                isNaN(material.thickness) || isNaN(material.weight)) {
                return null;
            }

            return material;
        }).filter(item => item !== null); // Remove null entries
    }

    /**
     * Show the material database modal
     */
    showModal() {
        if (!this.loaded) {
            utils.showNotification('Material database is still loading...', true);
            return;
        }

        // Clear previous selection
        this.selectedMaterial = null;
        
        // Populate table with all materials
        this.populateTable(this.materials);
        
        // Show modal
        this.modal.style.display = 'block';
        this.searchInput.focus();
    }

    /**
     * Hide the material database modal
     */
    hideModal() {
        this.modal.style.display = 'none';
    }

    /**
     * Search materials based on input
     */
    searchMaterials() {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            // If search term is empty, show all materials
            this.populateTable(this.materials);
            return;
        }
        
        // Split search terms by spaces or x symbol
        const terms = searchTerm.split(/[\s×x]+/).map(term => parseFloat(term)).filter(term => !isNaN(term));
        
        if (terms.length === 0) {
            // If no valid numeric terms, show all materials
            this.populateTable(this.materials);
            return;
        }
        
        // Find materials that match any of the search terms (fuzzy search)
        const results = this.materials.filter(material => {
            // Convert material dimensions to array for easier comparison
            const dimensions = [material.width, material.depth, material.thickness];
            
            // Check if any term matches any dimension (with some tolerance)
            return terms.some(term => 
                dimensions.some(dimension => 
                    Math.abs(dimension - term) < 0.1 // Allow small tolerance for floating point comparison
                )
            );
        });
        
        this.populateTable(results);
    }

    /**
     * Populate the table with materials
     * @param {Array} materials - Array of material objects to display
     */
    populateTable(materials) {
        const tbody = this.table.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (materials.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5">No materials found</td>`;
            tbody.appendChild(row);
            return;
        }
        
        materials.forEach(material => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.width}</td>
                <td>${material.depth}</td>
                <td>${material.thickness}</td>
                <td>${material.weight}</td>
                <td><button class="btn select-material-btn">Select</button></td>
            `;
            
            // Add click event to select button
            row.querySelector('.select-material-btn').addEventListener('click', () => {
                this.selectMaterial(material);
            });
            
            tbody.appendChild(row);
        });
    }

    /**
     * Select a material from the database
     * @param {Object} material - The material to select
     */
    selectMaterial(material) {
        this.selectedMaterial = material;
        
        // Populate the form based on target type
        if (this.targetType === 'grill') {
            document.getElementById('grillMaterialWidth').value = material.width;
            document.getElementById('grillMaterialDepth').value = material.depth;
            document.getElementById('grillMaterialThickness').value = material.thickness;
            document.getElementById('grillMaterialWeight').value = material.weight;
        } else if (this.targetType === 'pergola') {
            document.getElementById('pergolaMaterialWidth').value = material.width;
            document.getElementById('pergolaMaterialDepth').value = material.depth;
            document.getElementById('pergolaMaterialThickness').value = material.thickness;
            document.getElementById('pergolaMaterialWeight').value = material.weight;
        }
        
        this.hideModal();
        utils.showNotification('Material selected');
    }

    /**
     * Find a material by dimensions
     * @param {number} width - Material width
     * @param {number} depth - Material depth
     * @param {number} thickness - Material thickness
     * @returns {Object|null} - The matching material or null if not found
     */
    findMaterialByDimensions(width, depth, thickness) {
        if (!this.loaded || !this.materials.length) return null;
        
        // Find exact match
        const exactMatch = this.materials.find(m => 
            m.width === width && 
            m.depth === depth && 
            m.thickness === thickness
        );
        
        if (exactMatch) return exactMatch;
        
        // Find closest match if no exact match found
        return this.materials.reduce((closest, current) => {
            const currentDiff = Math.abs(current.width - width) + 
                              Math.abs(current.depth - depth) + 
                              Math.abs(current.thickness - thickness);
            
            const closestDiff = closest ? 
                Math.abs(closest.width - width) + 
                Math.abs(closest.depth - depth) + 
                Math.abs(closest.thickness - thickness) : 
                Infinity;
            
            return currentDiff < closestDiff ? current : closest;
        }, null);
    }

    /**
     * Export the material database to CSV
     * @param {string} filename - The filename to save as
     */
    exportToCSV(filename = 'material_database.csv') {
        if (!this.loaded || !this.materials.length) {
            utils.showNotification('No materials to export', true);
            return;
        }
        
        const headers = ['Width', 'Depth', 'Thickness', 'Weight (kg/m)'];
        const csvContent = [
            headers.join(','),
            ...this.materials.map(material => 
                `${material.width},${material.depth},${material.thickness},${material.weight}`
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Create global instance of the material database
window.materialDB = new MaterialDatabase(); 