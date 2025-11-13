/**
 * XLF Parser - Extracts content from XLIFF files
 */

class XLFParser {
    constructor() {
        this.content = [];
    }

    /**
     * Parse uploaded XLF file
     * @param {File} file - The uploaded XLF file
     * @returns {Promise<Object>} Parsed content
     */
    async parse(file) {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Check for parse errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid XLF file format');
        }

        // Extract content
        this.extractContent(xmlDoc);

        return {
            content: this.content
        };
    }

    /**
     * Extract text content from XLF file
     * @param {Document} xmlDoc - Parsed XML document
     */
    extractContent(xmlDoc) {
        const files = xmlDoc.querySelectorAll('file');

        files.forEach(file => {
            const fileOriginal = file.getAttribute('original');
            const transUnits = file.querySelectorAll('trans-unit');

            transUnits.forEach(unit => {
                const id = unit.getAttribute('id');
                const source = unit.querySelector('source');

                if (source) {
                    const textContent = this.stripHTML(source.textContent);

                    if (textContent.trim()) {
                        this.content.push({
                            file: fileOriginal,
                            id: id,
                            text: textContent.trim()
                        });
                    }
                }
            });
        });
    }

    /**
     * Strip HTML tags and clean text
     * @param {string} html - HTML string
     * @returns {string} Plain text
     */
    stripHTML(html) {
        // Create a temporary element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Get text content and clean up whitespace
        let text = temp.textContent || temp.innerText || '';

        // Normalize whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    }

    /**
     * Get all content as a single text block
     * @returns {string} All content concatenated
     */
    getAllContentAsText() {
        return this.content
            .map(item => item.text)
            .join('\n\n');
    }

    /**
     * Get content organized by file
     * @returns {Object} Content grouped by file
     */
    getContentByFile() {
        const organized = {};

        this.content.forEach(item => {
            if (!organized[item.file]) {
                organized[item.file] = [];
            }
            organized[item.file].push(item.text);
        });

        return organized;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XLFParser;
}
