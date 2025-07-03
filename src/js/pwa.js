// PWA Manager para Cuadrante Guardia Civil
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.checkInstallation();
        console.log('PWA Manager inicializado');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado:', registration.scope);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Error registrando Service Worker:', error);
            }
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            console.log('App instalada correctamente');
        });

        // Install button click handler
        document.getElementById('installBtn').addEventListener('click', () => {
            this.installApp();
        });
    }

    showInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn && !this.isInstalled) {
            installBtn.style.display = 'flex';
        }
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.log('No hay prompt de instalación disponible');
            return;
        }

        try {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                console.log('Usuario aceptó instalar la app');
            } else {
                console.log('Usuario rechazó instalar la app');
            }
            
            this.deferredPrompt = null;
        } catch (error) {
            console.error('Error durante la instalación:', error);
        }
    }

    checkInstallation() {
        // Check if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            this.hideInstallButton();
        }

        // Check iOS installation
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            this.hideInstallButton();
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: var(--primary-color);
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                z-index: 1001;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span>Nueva versión disponible</span>
                <button onclick="window.location.reload()" style="
                    background: white;
                    color: var(--primary-color);
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                ">Actualizar</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
}); 