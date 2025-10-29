// Language Service Module
class LanguageService {
    constructor() {
        this.currentLang = 'pt';
        this.supportedLanguages = ['pt', 'en', 'es', 'fr', 'it', 'pl'];
        this.translations = {};
        this.observers = [];
    }

    /**
     * Initialize language service
     * @param {string} defaultLang - Default language code
     * @returns {Promise} Promise that resolves when translations are loaded
     */
    async initialize(defaultLang = 'pt') {
        try {
            // Load all language files
            await Promise.all(
                this.supportedLanguages.map(lang => this.loadTranslations(lang))
            );

            // Set initial language
            const savedLang = localStorage.getItem('preferredLanguage');
            const browserLang = navigator.language.split('-')[0];
            const initialLang = savedLang || 
                              (this.isLanguageSupported(browserLang) ? browserLang : defaultLang);

            await this.setLanguage(initialLang);
            console.log('Language service initialized:', this.currentLang);

        } catch (error) {
            console.error('Failed to initialize language service:', error);
            throw error;
        }
    }

    /**
     * Load translations for a specific language
     * @param {string} lang - Language code
     * @returns {Promise} Promise that resolves when translations are loaded
     */
    async loadTranslations(lang) {
        try {
            const response = await fetch(`/lang/${lang}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.translations[lang] = await response.json();
            console.log(`Loaded translations for ${lang}`);
        } catch (error) {
            console.error(`Failed to load translations for ${lang}:`, error);
            throw error;
        }
    }

    /**
     * Set current language
     * @param {string} lang - Language code
     * @returns {Promise} Promise that resolves when language is set
     */
    async setLanguage(lang) {
        if (!this.isLanguageSupported(lang)) {
            throw new Error(`Language ${lang} is not supported`);
        }

        try {
            // Load translations if not already loaded
            if (!this.translations[lang]) {
                await this.loadTranslations(lang);
            }

            this.currentLang = lang;
            document.documentElement.lang = lang;
            localStorage.setItem('preferredLanguage', lang);

            // Update all translations in the DOM
            this.updateDOMTranslations();

            // Notify observers
            this.notifyObservers();

            console.log('Language changed to:', lang);
            return true;

        } catch (error) {
            console.error('Failed to set language:', error);
            throw error;
        }
    }

    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @param {Object} params - Parameters for interpolation
     * @returns {string} Translated text
     */
    translate(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLang];

        for (const k of keys) {
            translation = translation?.[k];
            if (!translation) {
                console.warn(`Translation missing for key: ${key}`);
                return key;
            }
        }

        // Replace parameters in translation
        return translation.replace(/\{\{(\w+)\}\}/g, (_, param) => {
            return params[param] || `{{${param}}}`;
        });
    }

    /**
     * Update all translations in the DOM
     */
    updateDOMTranslations() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.translate(key);
        });

        // Update elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.translate(key);
        });

        // Update elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.translate(key);
        });
    }

    /**
     * Check if language is supported
     * @param {string} lang - Language code
     * @returns {boolean} Whether language is supported
     */
    isLanguageSupported(lang) {
        return this.supportedLanguages.includes(lang);
    }

    /**
     * Add observer for language changes
     * @param {Function} callback - Callback function
     */
    addObserver(callback) {
        if (typeof callback === 'function') {
            this.observers.push(callback);
        }
    }

    /**
     * Remove observer
     * @param {Function} callback - Callback function to remove
     */
    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    /**
     * Notify all observers of language change
     */
    notifyObservers() {
        this.observers.forEach(callback => {
            try {
                callback(this.currentLang);
            } catch (error) {
                console.error('Error in language observer:', error);
            }
        });
    }
}

export const languageService = new LanguageService();