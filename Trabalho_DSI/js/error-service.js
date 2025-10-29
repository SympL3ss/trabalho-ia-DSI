// Initialize the error service immediately so other scripts can use it during DOMContentLoaded
(function(){
    var ErrorService = {
        errorHandlers: new Map(),
        isInitialized: false,

        initialize: function() {
            if (this.isInitialized) return;

            // Global error handler
            window.onerror = (message, source, lineno, colno, error) => {
                this.handleError('global', error || new Error(message));
                return false;
            };

            // Unhandled promise rejection handler
            window.onunhandledrejection = (event) => {
                this.handleError('promise', event.reason);
                event.preventDefault();
            };

            this.isInitialized = true;
            console.log('Error service initialized');
        },

        registerHandler: function(errorType, handler) {
            if (typeof handler !== 'function') {
                throw new Error('Handler must be a function');
            }
            this.errorHandlers.set(errorType, handler);
        },

        handleError: function(type, error) {
            console.error(`[${type}] Error:`, error);

            // Get specific handler or use default
            const handler = this.errorHandlers.get(type) || this.defaultHandler;

            try {
                handler.call(this, error);
            } catch (handlerError) {
                console.error('Error in error handler:', handlerError);
                this.defaultHandler.call(this, error);
            }

            // Log error details
            this.logError(type, error);
        },

        defaultHandler: function(error) {
            const message = error.message || 'An unknown error occurred';
            
            // Create error toast notification
            const toast = document.createElement('div');
            toast.className = 'error-toast';
            toast.innerHTML = `
                <div class="error-toast-content">
                    <strong>Erro</strong>
                    <p>${message}</p>
                    <button class="error-toast-close">&times;</button>
                </div>
            `;

            // Add close button handler
            const closeButton = toast.querySelector('.error-toast-close');
            closeButton.onclick = () => toast.remove();

            // Auto-remove after 5 seconds
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        },

        logError: function(type, error) {
            const errorLog = {
                timestamp: new Date().toISOString(),
                type: type,
                message: error.message,
                stack: error.stack,
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            console.group('Error Details');
            console.table(errorLog);
            console.groupEnd();
        },

        createErrorBoundary: function(fallbackMessage) {
            fallbackMessage = fallbackMessage || 'Algo deu errado';
            return {
                template: `
                    <div class="error-boundary" style="display: none">
                        <div class="error-boundary-content">
                            <h3>Oops!</h3>
                            <p>${fallbackMessage}</p>
                            <button class="error-boundary-retry">Tentar Novamente</button>
                        </div>
                    </div>
                `,
                
                show: function(container, error) {
                    const boundary = container.querySelector('.error-boundary');
                    if (boundary) {
                        boundary.style.display = 'flex';
                        ErrorService.logError('boundary', error);
                        
                        // Add retry handler
                        boundary.querySelector('.error-boundary-retry').onclick = () => {
                            boundary.style.display = 'none';
                        };
                    }
                }
            };
        }
    };

    // Initialize the service immediately
    ErrorService.initialize();

    // Register default handlers
    ErrorService.registerHandler('api', function(error) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        const btnSubmitIA = document.getElementById('btn-submit-ia');
        if (btnSubmitIA) {
            btnSubmitIA.disabled = false;
            btnSubmitIA.textContent = "Gerar Perguntas";
        }

        alert(`Erro API: ${error.message}`);
    });

    ErrorService.registerHandler('storage', function(error) {
        alert(`Erro de armazenamento: ${error.message}. Tente limpar o cache.`);
    });

    // Make it globally available
    window.errorService = ErrorService;
})();