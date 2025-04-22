/**
 * Utility functions for the Quotation Generator App
 */

// Unit conversion functions
const unitConversions = {
    // Length conversions to mm
    mm: {
        mm: 1,
        cm: 10,
        inch: 25.4,
        ft: 304.8,
        m: 1000
    },
    // Area conversions to sqft
    area: {
        sqft: 1,
        sqm: 10.764
    }
};

/**
 * Convert length from one unit to another
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The source unit (mm, cm, inch, ft, m)
 * @param {string} toUnit - The target unit (mm, cm, inch, ft, m)
 * @returns {number} - The converted value
 */
function convertLength(value, fromUnit, toUnit) {
    if (!value || isNaN(value)) return 0;
    
    // Convert to mm first (base unit)
    const valueInMm = value * unitConversions.mm[fromUnit];
    
    // Then convert from mm to target unit
    return valueInMm / unitConversions.mm[toUnit];
}

/**
 * Convert area from one unit to another
 * @param {number} value - The area value to convert
 * @param {string} fromUnit - The source unit (sqft, sqm)
 * @param {string} toUnit - The target unit (sqft, sqm)
 * @returns {number} - The converted value
 */
function convertArea(value, fromUnit, toUnit) {
    if (!value || isNaN(value)) return 0;
    
    // Convert to sqft first (base unit)
    const valueInSqft = fromUnit === 'sqm' ? value * unitConversions.area.sqm : value;
    
    // Then convert from sqft to target unit
    return toUnit === 'sqm' ? valueInSqft / unitConversions.area.sqm : valueInSqft;
}

/**
 * Format currency (Indian Rupees)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted amount
 */
function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format weight value
 * @param {number} weight - The weight value
 * @returns {string} - Formatted weight with 3 decimal places
 */
function formatWeight(weight) {
    if (!weight || isNaN(weight)) return '0.000';
    
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(weight);
}

/**
 * Format area with proper units
 * @param {number} area - The area value
 * @param {string} unit - The area unit (sqft, sqm)
 * @returns {string} - Formatted area
 */
function formatArea(area, unit) {
    if (!area || isNaN(area)) return '0.00';
    
    const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(area);
    
    return `${formatted} ${unit}`;
}

/**
 * Generate a unique ID
 * @returns {string} - A unique ID
 */
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Save data to localStorage
 * @param {string} key - The storage key
 * @param {any} data - The data to store
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        showNotification('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Failed to save data', true);
    }
}

/**
 * Load data from localStorage
 * @param {string} key - The storage key
 * @returns {any} - The retrieved data
 */
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Failed to load data', true);
        return null;
    }
}

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - The filename for the CSV
 */
function exportToCSV(data, filename) {
    if (!data || !data.length) {
        showNotification('No data to export', true);
        return;
    }
    
    // Get headers from the first row
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => {
            return headers.map(header => {
                // Handle special characters and commas in data
                const cell = row[header] !== undefined ? row[header] : '';
                const cellValue = typeof cell === 'string' ? cell.replace(/"/g, '""') : cell;
                return `"${cellValue}"`;
            }).join(',');
        })
    ].join('\n');
    
    // Create download link
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

/**
 * Show a notification
 * @param {string} message - The message to display
 * @param {boolean} isError - Whether this is an error notification
 */
function showNotification(message, isError = false) {
    const notification = document.getElementById('savingMessage');
    notification.querySelector('span').textContent = message;
    if (isError) {
        notification.style.backgroundColor = '#e74c3c';
    } else {
        notification.style.backgroundColor = '#2c3e50';
    }
    
    notification.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * Validate numeric input
 * @param {string} value - The input value
 * @returns {boolean} - Whether the input is valid
 */
function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) >= 0;
}

/**
 * Count words in a string
 * @param {string} text - The text to count words in
 * @returns {number} - The word count
 */
function countWords(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
}

/**
 * Show loading screen
 * @param {boolean} show - Whether to show or hide the loading screen
 */
function showLoading(show = true) {
    document.getElementById('loadingScreen').style.display = show ? 'flex' : 'none';
}

/**
 * Parse size input to handle different formats (with or without unit)
 * @param {string} sizeInput - The size input from user
 * @returns {object} - Object with value and unit
 */
function parseSizeInput(sizeInput) {
    if (!sizeInput) return { value: 0, unit: null };
    
    // Regular expression to match number and optional unit
    const regex = /^(\d+(\.\d+)?)\s*(mm|cm|m|inch|inches|ft|feet)?$/i;
    const match = sizeInput.trim().match(regex);
    
    if (match) {
        const value = parseFloat(match[1]);
        let unit = (match[3] || '').toLowerCase();
        
        // Normalize unit names
        if (unit === 'inches') unit = 'inch';
        if (unit === 'feet') unit = 'ft';
        
        return {
            value,
            unit: unit || null
        };
    }
    
    // If no valid match, assume it's just a number
    const numericValue = parseFloat(sizeInput);
    if (!isNaN(numericValue)) {
        return {
            value: numericValue,
            unit: null
        };
    }
    
    return { value: 0, unit: null };
}

/**
 * Round to specified decimal places
 * @param {number} value - The value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} - The rounded value
 */
function roundToDecimals(value, decimals = 2) {
    if (isNaN(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Download JSON data as a file
 * @param {Object} data - The data to download
 * @param {string} filename - The name of the file
 */
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Load a JSON file
 * @param {File} file - The file to load
 * @returns {Promise} - Promise resolving to the parsed JSON
 */
function loadJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Check if a value is empty (null, undefined, empty string)
 * @param {any} value - The value to check
 * @returns {boolean} - True if the value is empty
 */
function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

/**
 * Add scroll indicators to tables
 * This function adds visual cues to tables that are wider than their containers
 */
function initScrollableTableIndicators() {
    // Find all table containers
    const tableContainers = document.querySelectorAll('.table-container');
    
    // Process each container
    tableContainers.forEach(container => {
        const table = container.querySelector('table');
        if (!table) return;
        
        // Show scroll indicator if table is wider than container
        function updateIndicator() {
            if (table.offsetWidth > container.offsetWidth) {
                container.classList.add('scrollable');
                
                // Check if scrolled to end
                if (container.scrollLeft + container.offsetWidth >= table.offsetWidth - 5) {
                    container.classList.add('scroll-end');
                } else {
                    container.classList.remove('scroll-end');
                }
            } else {
                container.classList.remove('scrollable');
            }
        }
        
        // Update on scroll
        container.addEventListener('scroll', updateIndicator);
        
        // Update on resize
        window.addEventListener('resize', updateIndicator);
        
        // Initial check
        updateIndicator();
    });
}

/**
 * Initialize jsPDF document with error handling
 * Shows retry screen if initialization fails
 * @returns {Promise<Object>} jsPDF document object
 */
async function initializePDF() {
    // Check if jsPDF is ready and wait if necessary
    if (!window.jsPDFReady) {
        let waitTime = 0;
        const maxWaitTime = 5000; // 5 seconds max wait
        const checkInterval = 100; // Check every 100ms
        
        while (!window.jsPDFReady && waitTime < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waitTime += checkInterval;
            console.log(`Waiting for jsPDF to initialize... (${waitTime}ms)`);
        }
        
        if (!window.jsPDFReady) {
            console.error('PDF library is not ready');
            
            // Show the retry screen if available
            if (typeof window.showPdfRetryScreen === 'function') {
                window.showPdfRetryScreen();
            }
            
            throw new Error('PDF library is not ready. Please use the retry button or refresh the page.');
        }
    }
    
    // Try different approaches to initialize jsPDF
    let doc;
    try {
        // Try window.jsPDF first (our preferred global reference)
        if (typeof window.jsPDF === 'function') {
            doc = new window.jsPDF();
            console.log('jsPDF initialized using window.jsPDF');
        }
        // Try to import jsPDF from window.jspdf (newer versions)
        else if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            const { jsPDF } = window.jspdf;
            doc = new jsPDF();
            console.log('jsPDF initialized using window.jspdf.jsPDF');
        } 
        // Try global jsPDF constructor (older versions)
        else if (typeof jsPDF === 'function') {
            doc = new jsPDF();
            console.log('jsPDF initialized using global jsPDF constructor');
        }
        // No jsPDF found
        else {
            throw new Error('PDF library not found');
        }
        
        return doc;
    } catch (initError) {
        console.error('Failed to initialize PDF:', initError);
        
        // Show the retry screen if available
        if (typeof window.showPdfRetryScreen === 'function') {
            window.showPdfRetryScreen();
        }
        
        throw new Error('PDF library initialization failed: ' + initError.message);
    }
}

// Export utilities for use in other modules
window.utils = {
    convertLength,
    convertArea,
    formatCurrency,
    formatWeight,
    formatArea,
    generateId,
    saveToLocalStorage,
    loadFromLocalStorage,
    exportToCSV,
    showNotification,
    isValidNumber,
    countWords,
    showLoading,
    parseSizeInput,
    roundToDecimals,
    downloadJSON,
    loadJSON,
    isEmpty,
    initScrollableTableIndicators,
    initializePDF
}; 