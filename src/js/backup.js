// Backup Manager para Cuadrante PWA
class BackupManager {
    constructor() {
        this.backupKey = 'cuadrante-backup-history';
        this.maxBackups = 10; // Mantener últimos 10 backups
        this.autoBackupEnabled = true;
        this.init();
    }

    init() {
        this.setupAutoBackup();
        this.checkDataIntegrity();
        this.setupUI();
        this.detectMobileDevice();
        console.log('✅ Backup Manager inicializado');
    }

    // Crear backup completo de todos los datos
    createFullBackup() {
        const timestamp = new Date().toISOString();
        const backup = {
            id: Date.now().toString(),
            timestamp: timestamp,
            version: '1.0',
            data: {
                cuadrantes: localStorage.getItem('cuadrante-data'),
                citas: localStorage.getItem('cuadrante-appointments'),
                config: localStorage.getItem('cuadrante-config')
            },
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            }
        };

        this.saveBackup(backup);
        return backup;
    }

    // Guardar backup en el historial
    saveBackup(backup) {
        const backupHistory = this.getBackupHistory();
        backupHistory.unshift(backup);

        // Mantener solo los últimos N backups
        if (backupHistory.length > this.maxBackups) {
            backupHistory.splice(this.maxBackups);
        }

        localStorage.setItem(this.backupKey, JSON.stringify(backupHistory));
        console.log('💾 Backup guardado:', backup.timestamp);
    }

    // Obtener historial de backups
    getBackupHistory() {
        const saved = localStorage.getItem(this.backupKey);
        return saved ? JSON.parse(saved) : [];
    }

    // Restaurar desde backup
    restoreFromBackup(backupId) {
        const backupHistory = this.getBackupHistory();
        const backup = backupHistory.find(b => b.id === backupId);

        if (!backup) {
            throw new Error('Backup no encontrado');
        }

        // Restaurar datos
        if (backup.data.cuadrantes) {
            localStorage.setItem('cuadrante-data', backup.data.cuadrantes);
        }
        if (backup.data.citas) {
            localStorage.setItem('cuadrante-appointments', backup.data.citas);
        }
        if (backup.data.config) {
            localStorage.setItem('cuadrante-config', backup.data.config);
        }

        console.log('✅ Datos restaurados desde backup:', backup.timestamp);
        
        // Recargar la aplicación
        window.location.reload();
    }

    // Exportar backup como archivo
    exportBackupAsFile(backupId = null) {
        const backup = backupId ? 
            this.getBackupHistory().find(b => b.id === backupId) : 
            this.createFullBackup();

        if (!backup) {
            throw new Error('No se pudo crear/encontrar el backup');
        }

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cuadrante-backup-${backup.timestamp.split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📥 Backup exportado como archivo');
    }

    // Importar backup desde archivo
    importBackupFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Validar estructura del backup
                    if (!backup.data || !backup.timestamp) {
                        throw new Error('Archivo de backup inválido');
                    }

                    // Agregar al historial
                    backup.id = Date.now().toString();
                    backup.imported = true;
                    this.saveBackup(backup);
                    
                    resolve(backup);
                } catch (error) {
                    reject(new Error('Error al leer el archivo: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }

    // Configurar backup automático
    setupAutoBackup() {
        if (!this.autoBackupEnabled) return;

        // Backup automático cada hora de uso activo
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.createFullBackup();
            }
        }, 60 * 60 * 1000); // 1 hora

        // Backup al detectar cambios importantes
        this.setupChangeListeners();

        // Backup al salir de la página
        window.addEventListener('beforeunload', () => {
            this.createFullBackup();
        });
    }

    // Escuchar cambios en los datos
    setupChangeListeners() {
        // Monitorear cambios en localStorage
        let lastDataHash = this.getDataHash();
        
        setInterval(() => {
            const currentHash = this.getDataHash();
            if (currentHash !== lastDataHash) {
                this.createFullBackup();
                lastDataHash = currentHash;
            }
        }, 5 * 60 * 1000); // Cada 5 minutos
    }

    // Crear hash de los datos para detectar cambios
    getDataHash() {
        const data = {
            cuadrantes: localStorage.getItem('cuadrante-data'),
            citas: localStorage.getItem('cuadrante-appointments'),
            config: localStorage.getItem('cuadrante-config')
        };
        return btoa(JSON.stringify(data)).slice(0, 16);
    }

    // Verificar integridad de los datos
    checkDataIntegrity() {
        const issues = [];
        
        // Verificar cuadrantes
        try {
            const cuadrantes = localStorage.getItem('cuadrante-data');
            if (cuadrantes) {
                JSON.parse(cuadrantes);
            }
        } catch (e) {
            issues.push('Datos de cuadrantes corruptos');
        }

        // Verificar citas
        try {
            const citas = localStorage.getItem('cuadrante-appointments');
            if (citas) {
                JSON.parse(citas);
            }
        } catch (e) {
            issues.push('Datos de citas corruptos');
        }

        if (issues.length > 0) {
            console.warn('⚠️ Problemas de integridad detectados:', issues);
            this.showDataRecoveryOptions();
        }
    }

    // Mostrar opciones de recuperación
    showDataRecoveryOptions() {
        const backupHistory = this.getBackupHistory();
        if (backupHistory.length > 0) {
            const lastBackup = backupHistory[0];
            const message = `Se detectaron problemas con los datos. ¿Deseas restaurar desde el último backup (${new Date(lastBackup.timestamp).toLocaleString()})?`;
            
            if (confirm(message)) {
                this.restoreFromBackup(lastBackup.id);
            }
        }
    }

    // Obtener estadísticas de backup
    getBackupStats() {
        const history = this.getBackupHistory();
        const totalSize = history.reduce((size, backup) => {
            return size + JSON.stringify(backup).length;
        }, 0);

        return {
            totalBackups: history.length,
            totalSize: Math.round(totalSize / 1024) + ' KB',
            lastBackup: history[0]?.timestamp || 'Nunca',
            autoBackupEnabled: this.autoBackupEnabled
        };
    }

    // Limpiar backups antiguos
    cleanOldBackups(daysToKeep = 30) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        const history = this.getBackupHistory();
        
        const filtered = history.filter(backup => {
            return new Date(backup.timestamp) > cutoffDate;
        });

        localStorage.setItem(this.backupKey, JSON.stringify(filtered));
        console.log(`🧹 Limpiados ${history.length - filtered.length} backups antiguos`);
    }

    // Configurar backup automático
    setAutoBackup(enabled) {
        this.autoBackupEnabled = enabled;
        if (enabled) {
            this.setupAutoBackup();
        }
    }

    // Configurar interfaz de usuario
    setupUI() {
        // Actualizar estadísticas cada vez que se cambia de sección
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section="config"]')) {
                setTimeout(() => this.updateBackupStatsUI(), 100);
            }
        });

        // Configurar importación de archivos
        const importInput = document.getElementById('import-backup');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleImportFile(file);
                }
            });
        }

        // Actualizar estadísticas iniciales
        this.updateBackupStatsUI();
    }

    // Detectar dispositivos móviles
    detectMobileDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         window.innerWidth <= 768 ||
                         'ontouchstart' in window;

        if (isMobile) {
            this.showMobileWarning();
            // Crear backup inmediato en móviles
            this.createFullBackup();
            
            // Backup más frecuente en móviles (cada 30 minutos)
            setInterval(() => {
                if (document.visibilityState === 'visible') {
                    this.createFullBackup();
                }
            }, 30 * 60 * 1000);
        }
    }

    // Mostrar advertencia específica para móviles
    showMobileWarning() {
        const warningElement = document.getElementById('mobile-warning');
        if (warningElement) {
            warningElement.style.display = 'block';
            warningElement.innerHTML = `
                ⚠️ <strong>DISPOSITIVO MÓVIL DETECTADO</strong><br>
                <strong>¡IMPORTANTE!</strong> Los datos pueden perderse automáticamente en móviles debido a:
                <ul>
                    <li>🧹 Limpieza automática del navegador (iOS Safari: ~7 días)</li>
                    <li>📱 Gestión de memoria del sistema</li>
                    <li>🔄 Actualizaciones del navegador/sistema</li>
                    <li>🕵️ Modo privado/incógnito</li>
                </ul>
                <strong style="color: #d63031;">RECOMENDACIÓN CRÍTICA:</strong> Exporta backups después de cada sesión importante.
            `;
        }
    }

    // Actualizar estadísticas en la interfaz
    updateBackupStatsUI() {
        const statsContainer = document.getElementById('backup-stats');
        if (!statsContainer) return;

        const stats = this.getBackupStats();
        const dataSize = this.getLocalStorageSize();
        
        statsContainer.innerHTML = `
            <div class="backup-stat-item">
                <span class="backup-stat-value">${stats.totalBackups}</span>
                <span class="backup-stat-label">Backups Guardados</span>
            </div>
            <div class="backup-stat-item">
                <span class="backup-stat-value">${stats.totalSize}</span>
                <span class="backup-stat-label">Tamaño Total</span>
            </div>
            <div class="backup-stat-item">
                <span class="backup-stat-value">${dataSize}</span>
                <span class="backup-stat-label">Datos Actuales</span>
            </div>
            <div class="backup-stat-item">
                <span class="backup-stat-value">${stats.lastBackup === 'Nunca' ? 'Nunca' : this.getTimeAgo(stats.lastBackup)}</span>
                <span class="backup-stat-label">Último Backup</span>
            </div>
        `;
    }

    // Obtener tamaño de localStorage
    getLocalStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return Math.round(total / 1024) + ' KB';
    }

    // Formatear tiempo transcurrido
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return time.toLocaleDateString('es-ES');
    }

    // Manejar importación de archivos
    async handleImportFile(file) {
        try {
            const backup = await this.importBackupFromFile(file);
            
            const message = `Backup importado correctamente:\n` +
                          `Fecha: ${new Date(backup.timestamp).toLocaleString()}\n` +
                          `¿Quieres restaurar estos datos ahora?`;
            
            if (confirm(message)) {
                this.restoreFromBackup(backup.id);
            } else {
                alert('Backup importado y guardado en el historial. Puedes restaurarlo desde "Ver Historial".');
                this.updateBackupStatsUI();
            }
        } catch (error) {
            alert('Error al importar backup: ' + error.message);
        }
        
        // Limpiar input
        document.getElementById('import-backup').value = '';
    }
}

// Funciones de utilidad globales
window.exportarBackup = () => {
    if (window.backupManager) {
        window.backupManager.exportBackupAsFile();
    }
};

window.verBackups = () => {
    if (window.backupManager) {
        const stats = window.backupManager.getBackupStats();
        console.log('📊 Estadísticas de Backup:', stats);
        const history = window.backupManager.getBackupHistory();
        console.log('📋 Historial de Backups:', history.map(b => ({
            fecha: new Date(b.timestamp).toLocaleString(),
            id: b.id
        })));
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.backupManager = new BackupManager();
    
    console.log('💡 Tips de backup:');
    console.log('- exportarBackup() - Descargar backup como archivo');
    console.log('- verBackups() - Ver estadísticas y historial');
}); 