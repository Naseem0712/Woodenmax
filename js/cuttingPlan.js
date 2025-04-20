/**
 * Cutting Plan Module
 * This module handles optimization of material cutting to minimize wastage
 */

class CuttingPlan {
    /**
     * Create a new cutting plan optimizer
     * @param {number} stockLength - The standard stock length in mm
     */
    constructor(stockLength = 6000) {
        this.stockLength = stockLength;
        this.wastage = 0;
        this.totalWastage = 0;
        this.stockUsed = 0;
        this.cuts = [];
        this.stockPieces = [];
    }

    /**
     * Set the stock length
     * @param {number} length - The new stock length in mm
     */
    setStockLength(length) {
        if (length <= 0) {
            throw new Error('Stock length must be positive');
        }
        this.stockLength = length;
    }

    /**
     * Convert all lengths to mm for consistent calculation
     * @param {number} length - The length to convert
     * @param {string} unit - The unit of the length (mm, cm, m, inch, ft)
     * @returns {number} - The length in mm
     */
    convertToMm(length, unit) {
        return utils.convertLength(length, unit, 'mm');
    }

    /**
     * Calculate optimal cutting pattern using enhanced algorithm
     * @param {Array} pieces - Array of piece objects with size and quantity properties
     * @param {boolean} convertUnits - Whether to convert units to mm
     * @returns {Object} - Cutting plan results
     */
    calculateCuttingPlan(pieces, convertUnits = true) {
        // Reset previous results
        this.wastage = 0;
        this.totalWastage = 0;
        this.stockUsed = 0;
        this.cuts = [];
        this.stockPieces = [];

        if (!pieces || !pieces.length) {
            return {
                cuts: [],
                stockUsed: 0,
                totalWastage: 0,
                wastagePercentage: 0
            };
        }

        // Expand quantities and convert units if needed
        let allPieces = [];
        pieces.forEach(piece => {
            if (!piece.size || piece.size <= 0 || !piece.quantity || piece.quantity <= 0) {
                return;
            }

            const pieceSize = convertUnits ? 
                this.convertToMm(piece.size, piece.unit) : 
                piece.size;

            // Skip if piece is larger than stock
            if (pieceSize > this.stockLength) {
                console.warn(`Piece of length ${pieceSize}mm is larger than stock length ${this.stockLength}mm and will be skipped.`);
                return;
            }

            // Add each piece according to quantity
            for (let i = 0; i < piece.quantity; i++) {
                allPieces.push({
                    originalSize: piece.size,
                    originalUnit: piece.unit,
                    size: pieceSize,
                    id: `${piece.id || 'piece'}_${i + 1}`
                });
            }
        });

        // Sort pieces in descending order of size (First Fit Decreasing)
        allPieces.sort((a, b) => b.size - a.size);
        
        // Try different stock lengths if provided
        const stockLengths = Array.isArray(this.stockLength) ? 
            [...this.stockLength].sort((a, b) => a - b) : // Sort stock lengths in ascending order
            [this.stockLength];
        
        // For each possible stock length, calculate a solution
        const solutions = stockLengths.map(stockLength => {
            return this.calculateSolutionForStockLength(allPieces, stockLength);
        });
        
        // Find the solution with the lowest waste percentage
        let bestSolution = solutions.reduce((best, current) => {
            return (current.wastagePercentage < best.wastagePercentage) ? current : best;
        }, solutions[0]);
        
        // Update the cutting plan with the best solution
        this.stockPieces = bestSolution.stockPieces;
        this.stockUsed = bestSolution.stockUsed;
        this.totalWastage = bestSolution.totalWastage;
        this.wastagePercentage = bestSolution.wastagePercentage;
        
        // Format the cutting plan for display
        this.cuts = this.stockPieces.map((stock, index) => {
            return {
                stockNumber: index + 1,
                stockLength: stock.stockLength,
                pieces: stock.pieces.map(p => ({
                    size: p.originalSize,
                    unit: p.originalUnit,
                    sizeInMm: p.size
                })),
                wastage: stock.remaining,
                wastagePercentage: (stock.remaining / stock.stockLength) * 100
            };
        });

        return {
            cuts: this.cuts,
            stockUsed: this.stockUsed,
            totalWastage: this.totalWastage,
            wastagePercentage: this.wastagePercentage
        };
    }
    
    /**
     * Calculate cutting solution for a specific stock length
     * @param {Array} pieces - Array of pieces to be cut
     * @param {number} stockLength - Stock length to use
     * @returns {Object} - Solution object
     */
    calculateSolutionForStockLength(pieces, stockLength) {
        const stockPieces = [];
        let remainingPieces = [...pieces];
        
        // Apply enhanced cutting algorithm
        while (remainingPieces.length > 0) {
            // Create a new stock
            const stock = { 
                stockLength: stockLength,
                remaining: stockLength, 
                pieces: [] 
            };
            
            // Try to find the best combination of pieces for this stock
            let improved = true;
            
            // Continue trying to improve until no more improvements can be made
            while (improved) {
                improved = false;
                
                // Try to find a piece or combination of pieces that fits perfectly
                const perfectFitIndex = this.findPerfectFit(remainingPieces, stock.remaining);
                
                if (perfectFitIndex !== -1) {
                    // Add the perfect fit piece
                    stock.pieces.push(remainingPieces[perfectFitIndex]);
                    stock.remaining -= remainingPieces[perfectFitIndex].size;
                    remainingPieces.splice(perfectFitIndex, 1);
                    improved = true;
                    continue;
                }
                
                // If no perfect fit, try to find the largest piece that fits
                const bestFitIndex = this.findBestFit(remainingPieces, stock.remaining);
                
                if (bestFitIndex !== -1) {
                    // Add the best fit piece
                    stock.pieces.push(remainingPieces[bestFitIndex]);
                    stock.remaining -= remainingPieces[bestFitIndex].size;
                    remainingPieces.splice(bestFitIndex, 1);
                    improved = true;
                }
            }
            
            // Add the stock to our solution
            stockPieces.push(stock);
        }
        
        // Calculate wastage
        const stockUsed = stockPieces.length;
        const totalWastage = stockPieces.reduce((total, stock) => total + stock.remaining, 0);
        const wastagePercentage = (totalWastage / (stockUsed * stockLength)) * 100;
        
        return {
            stockPieces,
            stockUsed,
            totalWastage,
            wastagePercentage
        };
    }
    
    /**
     * Find a piece that fits perfectly into the remaining space
     * @param {Array} pieces - Array of pieces
     * @param {number} remainingSpace - Remaining space in the stock
     * @returns {number} - Index of piece that fits perfectly, or -1 if none found
     */
    findPerfectFit(pieces, remainingSpace) {
        // First try to find a single piece that fits perfectly
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].size === remainingSpace) {
                return i;
            }
        }
        
        // If no single piece fits perfectly, try combinations of 2 pieces
        // (Could be expanded to try more combinations if needed)
        
        return -1;
    }
    
    /**
     * Find the best fitting piece for the remaining space
     * @param {Array} pieces - Array of pieces
     * @param {number} remainingSpace - Remaining space in the stock
     * @returns {number} - Index of best fitting piece, or -1 if none fits
     */
    findBestFit(pieces, remainingSpace) {
        let bestFitIndex = -1;
        let bestFitSize = 0;
        
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].size <= remainingSpace && pieces[i].size > bestFitSize) {
                bestFitIndex = i;
                bestFitSize = pieces[i].size;
            }
        }
        
        return bestFitIndex;
    }
    
    /**
     * Set multiple stock lengths
     * @param {Array|number} lengths - The stock lengths in mm
     */
    setStockLengths(lengths) {
        if (Array.isArray(lengths)) {
            // Filter out invalid lengths
            const validLengths = lengths.filter(length => length > 0);
            
            if (validLengths.length === 0) {
                throw new Error('At least one valid stock length must be provided');
            }
            
            this.stockLength = validLengths;
        } else if (typeof lengths === 'number' && lengths > 0) {
            this.stockLength = lengths;
        } else {
            throw new Error('Stock length must be positive');
        }
    }

    /**
     * Generate a visual diagram of the cutting plan
     * @returns {Array} - Array of diagram data for each stock
     */
    generateDiagram() {
        return this.cuts.map(cut => {
            const stockDiagram = {
                stockNumber: cut.stockNumber,
                totalLength: this.stockLength,
                segments: []
            };

            let currentPosition = 0;
            
            // Add each piece as a segment
            cut.pieces.forEach(piece => {
                stockDiagram.segments.push({
                    type: 'piece',
                    start: currentPosition,
                    length: piece.sizeInMm,
                    size: `${piece.size} ${piece.unit}`,
                    percentage: (piece.sizeInMm / this.stockLength) * 100
                });
                
                currentPosition += piece.sizeInMm;
            });
            
            // Add wastage segment if any
            if (cut.wastage > 0) {
                stockDiagram.segments.push({
                    type: 'wastage',
                    start: currentPosition,
                    length: cut.wastage,
                    percentage: (cut.wastage / this.stockLength) * 100
                });
            }
            
            return stockDiagram;
        });
    }

    /**
     * Create HTML visualization of the cutting plan
     * @returns {string} - HTML string for the cutting plan
     */
    createVisualization() {
        const diagrams = this.generateDiagram();
        
        if (!diagrams.length) {
            return '<div class="no-data">No cutting plan available</div>';
        }
        
        let html = `
            <div class="cutting-plan">
                <h3>Cutting Plan</h3>
                <div class="cutting-summary">
                    <p>Total Stock Used: ${this.stockUsed} pieces of ${this.stockLength}mm</p>
                    <p>Total Wastage: ${this.totalWastage}mm (${this.wastagePercentage.toFixed(2)}%)</p>
                </div>
                <div class="cutting-diagrams">
        `;
        
        diagrams.forEach(diagram => {
            html += `
                <div class="stock-diagram">
                    <div class="stock-info">Stock #${diagram.stockNumber} - Wastage: ${((diagram.segments.find(s => s.type === 'wastage') || {}).length || 0).toFixed(0)}mm</div>
                    <div class="stock-visual">
            `;
            
            diagram.segments.forEach(segment => {
                const widthPercentage = segment.percentage.toFixed(2);
                const segmentClass = segment.type === 'wastage' ? 'wastage-segment' : 'piece-segment';
                
                html += `
                    <div class="${segmentClass}" style="width: ${widthPercentage}%">
                        ${segment.type === 'wastage' ? 
                            `<span class="segment-label">Wastage: ${segment.length.toFixed(0)}mm</span>` : 
                            `<span class="segment-label">${segment.size}</span>`
                        }
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    /**
     * Export cutting plan data to PDF
     * @param {Object} companyInfo - Company information
     * @param {Object} customerInfo - Customer information
     * @param {string} title - PDF title
     * @returns {Object} - PDF document
     */
    exportToPDF(companyInfo, customerInfo, title = 'WoodenMax Cutting Plan') {
        try {
            // Check if jsPDF is loaded
            if (typeof window.jspdf === 'undefined') {
                throw new Error('PDF library not loaded. Please check your internet connection.');
            }
            
            // Create a new jsPDF instance
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('jsPDF is not available. Please refresh the page and try again.');
            }
            
            const doc = new jsPDF();
            
            // Set document properties
            doc.setProperties({
                title: title,
                subject: 'Cutting Plan',
                author: 'WoodenMax',
                creator: 'WoodenMax Quotation Generator'
            });
            
            // Add title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text(title, 105, 20, { align: 'center' });
            
            // Try to add logo
            try {
                // Load logo image
                const logoPath = 'woodenmax-logo-3.png';
                doc.addImage(logoPath, 'PNG', 20, 15, 40, 20);
            } catch(logoError) {
                console.error('Could not add logo:', logoError);
                // If logo fails, add text instead
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('WoodenMax', 20, 20);
            }
            
            // Add company info in a more compact layout
            let yPos = 30;
            if (companyInfo) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(companyInfo.companyName || '', 20, yPos);
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                yPos += 5;
                
                if (companyInfo.companyAddress) {
                    // Wrap address text to fit page width
                    const addressLines = doc.splitTextToSize(companyInfo.companyAddress, 90);
                    doc.text(addressLines, 20, yPos);
                    yPos += addressLines.length * 5;
                }
            }
            
            // Add customer info
            if (customerInfo) {
                yPos = Math.max(yPos + 5, 30);
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Customer:', 120, 30);
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text(customerInfo.customerName || '', 120, 35);
                
                if (customerInfo.customerAddress) {
                    // Wrap address text to fit in the column
                    const addressLines = doc.splitTextToSize(customerInfo.customerAddress, 70);
                    doc.text(addressLines, 120, 40);
                }
            }
            
            // Add cutting plan summary with better spacing
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Cutting Plan Summary', 20, Math.max(yPos + 15, 55));
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            yPos = Math.max(yPos + 25, 65);
            doc.text(`Stock Length: ${this.stockLength}mm`, 20, yPos);
            doc.text(`Total Stock Used: ${this.stockUsed} pieces`, 20, yPos + 6);
            doc.text(`Total Wastage: ${this.totalWastage}mm (${this.wastagePercentage.toFixed(2)}%)`, 20, yPos + 12);
            
            // Draw cutting diagrams with improved visual presentation
            yPos += 25;
            const diagramStartY = yPos;
            
            // Add visual cutting diagrams
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Cutting Details', 20, diagramStartY);
            
            // Draw each stock and its cutting pattern
            let currentY = diagramStartY + 10;
            this.cuts.forEach((cut, index) => {
                // Check if we need a new page
                if (currentY > doc.internal.pageSize.height - 40) {
                    doc.addPage();
                    currentY = 20;
                }
                
                // Stock label
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(`Stock #${cut.stockNumber}:`, 20, currentY);
                currentY += 6;
                
                // Draw stock bar
                const barWidth = 170;
                const barHeight = 15;
                doc.setDrawColor(100, 100, 100);
                doc.setFillColor(220, 220, 220);
                doc.rect(20, currentY, barWidth, barHeight, 'F');
                
                // Draw segments with proper widths
                let xPos = 20;
                const totalLength = this.stockLength;
                
                // Draw pieces first
                cut.pieces.forEach(piece => {
                    const segmentWidth = (piece.sizeInMm / totalLength) * barWidth;
                    
                    doc.setFillColor(52, 152, 219);
                    doc.rect(xPos, currentY, segmentWidth, barHeight, 'F');
                    
                    // Add piece label if width permits
                    if (segmentWidth > 20) {
                        doc.setFontSize(8);
                        doc.setTextColor(255);
                        doc.text(`${piece.size}${piece.unit}`, xPos + segmentWidth/2, currentY + barHeight/2 + 3, {
                            align: 'center'
                        });
                    }
                    
                    xPos += segmentWidth;
                });
                
                // Draw wastage if any
                if (cut.wastage > 0) {
                    const wastageWidth = (cut.wastage / totalLength) * barWidth;
                    
                    doc.setFillColor(231, 76, 60);
                    doc.rect(xPos, currentY, wastageWidth, barHeight, 'F');
                    
                    if (wastageWidth > 20) {
                        doc.setFontSize(8);
                        doc.setTextColor(255);
                        doc.text(`Waste`, xPos + wastageWidth/2, currentY + barHeight/2 + 3, {
                            align: 'center'
                        });
                    }
                }
                
                currentY += barHeight + 5;
                
                // Reset text color
                doc.setTextColor(0);
                
                // Add details text below diagram
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                
                // Pieces info
                cut.pieces.forEach(piece => {
                    const pieceText = `• ${piece.size}${piece.unit} (${piece.sizeInMm.toFixed(0)}mm) - ${((piece.sizeInMm/totalLength)*100).toFixed(1)}%`;
                    const wrappedText = doc.splitTextToSize(pieceText, 160);
                    doc.text(wrappedText, 25, currentY);
                    currentY += wrappedText.length * 4;
                });
                
                // Wastage info
                if (cut.wastage > 0) {
                    const wastageText = `• Wastage: ${cut.wastage.toFixed(0)}mm - ${cut.wastagePercentage.toFixed(1)}%`;
                    doc.text(wastageText, 25, currentY);
                    currentY += 4;
                }
                
                currentY += 10; // Add spacing between stocks
            });
            
            // Add page numbers to all pages
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0);
                doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
                
                // Add footer with website
                doc.setDrawColor(0);
                doc.line(20, doc.internal.pageSize.height - 25, 190, doc.internal.pageSize.height - 25);
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('WoodenMax', 20, doc.internal.pageSize.height - 15);
                
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text('www.woodenmax.com', 20, doc.internal.pageSize.height - 10);
                
                // Try to add small logo in footer
                try {
                    const logoPath = 'woodenmax-logo-3.png';
                    doc.addImage(logoPath, 'PNG', 170, doc.internal.pageSize.height - 20, 20, 10);
                } catch(err) {
                    // Do nothing if logo fails in footer
                }
            }
            
            // Return the document object
            return doc;
        } catch (error) {
            console.error('Error generating PDF:', error);
            utils.showNotification('Failed to generate PDF', true);
            return null;
        }
    }
    
    /**
     * Save the cutting plan PDF
     * @param {Object} doc - The jsPDF document object
     * @param {string} filename - The filename to save as
     */
    savePDF(doc, filename = 'WoodenMax_cutting_plan.pdf') {
        if (!doc) return;
        
        try {
            // Try to save directly
            doc.save(filename);
            utils.showNotification('Cutting plan PDF exported successfully');
        } catch (saveError) {
            console.error('Error saving cutting plan PDF directly:', saveError);
            
            // Fallback for some browsers: try to use blob method
            try {
                const blob = doc.output('blob');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                utils.showNotification('Cutting plan PDF exported successfully');
            } catch (fallbackError) {
                console.error('Error with fallback PDF saving:', fallbackError);
                utils.showNotification('Failed to export cutting plan PDF. Try a different browser.', true);
            }
        }
    }
}

// Create a global instance of the cutting plan
window.cuttingPlan = new CuttingPlan(); 