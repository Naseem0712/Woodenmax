# Quotation Generator for Grills, Pergolas, and Windows

A comprehensive web application for generating quotations for grills, pergolas, and profile windows with automatic calculations, minimum wastage cutting plans, and PDF export capabilities.

## Features

- **Multi-product Quotation System**: Handle quotes for grills, pergolas, and profile windows
- **Material Database**: Pre-loaded with standard metal profiles and their weights
- **Automatic Weight Calculation**: Automatically calculates weight based on material properties and dimensions
- **Multiple Unit Support**: Work with mm, cm, m, feet, inches for measurements
- **Cutting Plan Generation**: Generate optimized cutting plans to minimize material wastage
- **PDF Export**: Generate professional quotations in PDF format
- **GST & Discount Support**: Apply GST and discounts to your quotations
- **Customer & Company Details**: Store and use customer and company information
- **Offline Support**: Works offline with local storage for saved data
- **Responsive Design**: Mobile-friendly interface

## Usage

### Grill Quotations

1. Select "Grill" from the product selection
2. Fill in the material details (width, depth, thickness, weight, and rate)
3. Add requirements (size and quantity)
4. Review the calculated weight and amount
5. Add to quotation

### Pergola Quotations

1. Select "Pergola" from the product selection
2. Fill in the material details (width, depth, wall thickness, weight, and rate)
3. Add requirements (type, size, and quantity)
4. Review the calculated weight and amount
5. Add to quotation

### Window Quotations

1. Select "Window" from the product selection
2. Enter window type, dimensions, and rate
3. Configure door configuration and hardware
4. Add the window to the list
5. Add to quotation

### Managing Quotations

1. Add multiple items from different product types
2. Apply GST and discount as needed
3. Add your company and customer details
4. Add any additional notes
5. Export the quotation as PDF
6. Save/load quotations for future reference

## Cutting Plan

The application includes an advanced cutting plan generator that:

- Takes your material requirements as input
- Calculates the most efficient way to cut stock lengths
- Minimizes material wastage
- Visualizes the cutting plan in the PDF export

## Installation

No installation needed. This is a web application that works directly in your browser.

### Running Locally

1. Download or clone the repository
2. Open `index.html` in your web browser
3. Start creating quotations!

## Data Storage

All data is stored locally in your browser's localStorage, including:

- Material details
- Company information
- Customer information
- Quotation items and calculations

You can export quotations as JSON files for backup or sharing.

## Offline Use

This application is designed to work offline. Once loaded, it will continue to function without an internet connection. You can:

- Create new quotations
- Save quotations locally
- Export PDFs
- Load previously saved quotations

## Compatibility

- Works on modern browsers: Chrome, Firefox, Edge, Safari
- Responsive design for desktop, tablet, and mobile devices

## Technical Details

- Pure HTML, CSS, and JavaScript
- No external dependencies except for PDF generation
- Uses jsPDF for PDF generation
- Implements a First Fit Decreasing algorithm for cutting plan optimization

## License

This project is open-source and available for personal and commercial use. 