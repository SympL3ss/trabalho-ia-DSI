// PDF Generation Service
class PDFService {
    constructor() {
        this.defaultOptions = {
            margin: 10,
            filename: 'document.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: true, // Enable logging for debugging
                removeContainer: true, // Cleanup after generation
                foreignObjectRendering: true // Better rendering support
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        };
    }

    /**
     * Generate PDF from HTML element
     * @param {HTMLElement} element - The element to convert
     * @param {Object} customOptions - Custom PDF options
     * @returns {Promise} Promise that resolves when PDF is generated
     */
    async generatePDF(element, customOptions = {}) {
        console.log('Starting PDF generation...');
        
        if (!element) {
            throw new Error('No element provided for PDF generation');
        }

        try {
            // Clone element to avoid modifying the original
            const clonedElement = element.cloneNode(true);
            
            // Ensure all images are loaded
            await this.waitForImages(clonedElement);
            console.log('All images loaded successfully');

            // Merge default and custom options
            const options = {
                ...this.defaultOptions,
                ...customOptions
            };

            console.log('Generating PDF with options:', options);

            // Generate PDF
            const pdf = await html2pdf()
                .from(clonedElement)
                .set(options)
                .outputPdf();

            console.log('PDF generated successfully');
            return pdf;

        } catch (error) {
            console.error('PDF generation failed:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    /**
     * Save PDF from HTML element
     * @param {HTMLElement} element - The element to convert
     * @param {string} filename - The filename for the PDF
     * @param {Object} customOptions - Custom PDF options
     */
    async savePDF(element, filename, customOptions = {}) {
        try {
            const options = {
                ...this.defaultOptions,
                filename: filename,
                ...customOptions
            };

            // Pre-generation checks
            await this.preGenerationChecks(element);

            // Generate and save PDF
            await html2pdf()
                .from(element)
                .set(options)
                .save();

            console.log('PDF saved successfully');

        } catch (error) {
            console.error('PDF save failed:', error);
            throw new Error(`PDF save failed: ${error.message}`);
        }
    }

    /**
     * Wait for all images in element to load
     * @param {HTMLElement} element - Element containing images
     * @returns {Promise} Promise that resolves when all images are loaded
     */
    async waitForImages(element) {
        const images = element.getElementsByTagName('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
            });
        });

        return Promise.all(imagePromises);
    }

    /**
     * Perform pre-generation checks
     * @param {HTMLElement} element - Element to check
     */
    async preGenerationChecks(element) {
        // Check if element has content
        if (!element.innerHTML.trim()) {
            throw new Error('Element is empty');
        }

        // Check element visibility
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            throw new Error('Element is not visible');
        }

        // Check for common issues
        if (element.offsetWidth === 0 || element.offsetHeight === 0) {
            throw new Error('Element has no dimensions');
        }

        // Wait for images to load
        await this.waitForImages(element);
    }
}

export const pdfService = new PDFService();