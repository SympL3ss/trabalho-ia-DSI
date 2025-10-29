// Non-module initializer for errorService (compatible with classic <script> loading)
const errorService = window.errorService || (function(){
    const stub = {
        initialize: function(){ this.isInitialized = true; },
        registerHandler: function(){},
        createErrorBoundary: function(msg){ return { show: function(){} }; },
        handleError: function(type, err){ console.error('[stub errorService]', type, err); }
    };
    window.errorService = stub;
    return stub;
})();

try { if (typeof errorService.initialize === 'function') errorService.initialize(); } catch(e) { /* ignore */ }

// Register custom error handlers (safe no-op if stub)
try {
    errorService.registerHandler('api', (error) => {
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

    errorService.registerHandler('storage', (error) => {
        alert(`Erro de armazenamento: ${error.message}. Tente limpar o cache.`);
    });

    // Create error boundary
    const errorBoundary = (typeof errorService.createErrorBoundary === 'function')
        ? errorService.createErrorBoundary('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.')
        : { show: function(){} };
} catch (e) { console.error('init-error.js: failed to register handlers', e); }

// expose
window.errorService = errorService;