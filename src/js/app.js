// App principal para Cuadrante PWA - Guardia Civil
class CuadranteApp {
    constructor() {
        this.currentSection = 'calendar';
        this.selectedDate = null;
        this.selectedShift = 'M';
        this.tipoSeleccionado = 'M';
        this.modoMultiple = false;
        this.diasSeleccionados = new Set();
        this.seleccionandoRango = false;
        this.primerDiaRango = null;
        this.calendarData = {};
        this.config = {
            officerName: '',
            unit: '',
            colors: {
                M: '#2d5016',      // Mañana
                T: '#FF9800',      // Tarde
                N: '#2196F3',      // Noche
                MN: '#2196F3',     // Mañana y Noche
                SN: '#8b5cf6',     // Saliente Nocturno
                AP: '#4a7c3a',     // Asunto Propio
                ASC: '#10b981',    // Día Asociativo
                DAS: '#06b6d4',    // Descanso Singularizado
                DF: '#a855f7',     // Descanso Festivo
                IND: '#ef4444',    // Indispuesto
                B: '#6b7280',      // Baja
                V: '#10b981',      // Vacaciones
                D: '#9E9E9E'       // Descanso
            }
        };

        this.init();
    }

    init() {
        this.loadConfiguration();
        this.loadCalendarData();
        this.setupEventListeners();
        this.showSection(this.currentSection);
        console.log('App Cuadrante PWA inicializada');
        console.log('Turnos disponibles:', Object.keys(this.config.colors));
        
        // Verificar que los botones de turnos existen
        const shiftButtons = document.querySelectorAll('.shift-btn');
        console.log('Botones de turno encontrados:', shiftButtons.length);
        shiftButtons.forEach((btn, index) => {
            console.log(`Botón ${index}:`, btn.dataset.shift, btn.textContent);
        });
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Turno item buttons (new enhanced buttons)
        document.querySelectorAll('.turno-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tipo = e.currentTarget.dataset.tipo;
                this.seleccionarTipoTurno(tipo);
            });
        });

        // Legacy shift buttons for compatibility
        document.querySelectorAll('.shift-btn:not(.turno-item)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectShift(e.target.dataset.shift);
            });
        });

        // Modo múltiple
        const modoMultiple = document.getElementById('modo-multiple');
        if (modoMultiple) {
            modoMultiple.addEventListener('change', (e) => {
                this.toggleModoMultiple(e.target.checked);
            });
        }

        // Acciones rápidas
        const btnSemanaCompleta = document.getElementById('btn-semana-completa');
        if (btnSemanaCompleta) {
            btnSemanaCompleta.addEventListener('click', () => {
                this.aplicarSemanaCompleta();
            });
        }

        const btnLimpiarSemana = document.getElementById('btn-limpiar-semana');
        if (btnLimpiarSemana) {
            btnLimpiarSemana.addEventListener('click', () => {
                this.limpiarSemana();
            });
        }

        const btnSeleccionarRango = document.getElementById('btn-seleccionar-rango');
        if (btnSeleccionarRango) {
            btnSeleccionarRango.addEventListener('click', () => {
                this.activarSeleccionRango();
            });
        }

        // Botones del modo múltiple
        const btnAplicarSeleccion = document.getElementById('btn-aplicar-seleccion');
        if (btnAplicarSeleccion) {
            btnAplicarSeleccion.addEventListener('click', () => {
                this.aplicarTurnoSeleccionados();
            });
        }

        const btnLimpiarSeleccion = document.getElementById('btn-limpiar-seleccion');
        if (btnLimpiarSeleccion) {
            btnLimpiarSeleccion.addEventListener('click', () => {
                this.limpiarSeleccionDias();
            });
        }

        // Export buttons
        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcel();
        });

        // Configuration
        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Calendar day selection with multiple modes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.calendar-day') && !e.target.closest('.calendar-day').classList.contains('out-of-period')) {
                this.handleDayClick(e.target.closest('.calendar-day'), e);
            }
        });

        // Loading overlay
        this.showLoading = (show) => {
            document.getElementById('loading').style.display = show ? 'flex' : 'none';
        };
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        document.getElementById(`${sectionName}-section`).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // Update content based on section
        if (sectionName === 'stats') {
            window.statsManager?.updateStats();
        } else if (sectionName === 'config') {
            this.loadConfigurationForm();
        } else if (sectionName === 'appointments') {
            window.appointmentsManager?.renderAppointments();
        }
    }

    selectDay(dayElement) {
        // Don't select days outside the period
        if (dayElement.classList.contains('out-of-period')) {
            this.showNotification('Este día está fuera del período del cuadrante.', 'warning');
            return;
        }

        // Remove previous selection
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });

        // Select current day
        dayElement.classList.add('selected');
        
        const date = dayElement.dataset.date;
        this.selectedDate = date;

        console.log('Día seleccionado:', date);
    }

    selectShift(shiftType) {
        if (!this.selectedDate) {
            this.showNotification('Selecciona primero un día en el calendario', 'warning');
            return;
        }

        // Remove previous active shift
        document.querySelectorAll('.shift-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activate selected shift
        document.querySelector(`[data-shift="${shiftType}"]`).classList.add('active');

        this.selectedShift = shiftType;
        
        // Apply shift to selected date
        this.applyShiftToDate(this.selectedDate, shiftType);
        
        console.log('Turno aplicado:', shiftType, 'a fecha:', this.selectedDate);
    }

    applyShiftToDate(date, shift) {
        // Parse date string to create Date object
        const [year, month, day] = date.split('-').map(Number);
        const fechaActual = new Date(year, month, day);
        
        // Validate consecutive shifts before applying
        const validacion = this.validarTurnosConsecutivos(date, fechaActual, shift);
        if (validacion.bloquear) {
            this.showNotification(validacion.mensaje, 'error');
            return; // Don't apply the shift
        }
        
        // Store in calendar data
        this.calendarData[date] = {
            shift: shift,
            timestamp: new Date().toISOString()
        };

        // Update visual representation
        const dayElement = document.querySelector(`[data-date="${date}"]`);
        if (dayElement) {
            // Remove existing shift classes
            dayElement.classList.remove('shift-M', 'shift-T', 'shift-N', 'shift-MN', 'shift-SN', 'shift-AP', 'shift-ASC', 'shift-DAS', 'shift-DF', 'shift-IND', 'shift-B', 'shift-V', 'shift-D');
            
            // Remove existing shift indicator
            const existingShift = dayElement.querySelector('.day-shift');
            if (existingShift) {
                existingShift.remove();
            }

            // Add new shift indicator
            const shiftElement = document.createElement('div');
            shiftElement.className = `day-shift shift-${shift}`;
            shiftElement.textContent = shift; // Use the code directly
            dayElement.appendChild(shiftElement);
        }

        // Apply automatic weekly rest logic
        this.aplicarDescansoSemanalAutomatico();

        // Save to localStorage
        this.saveCalendarData();
        
        // Show success notification or warning
        if (validacion.aviso) {
            this.showNotification(validacion.mensaje, 'warning');
        } else {
            this.showNotification(`Turno ${this.getShiftLabel(shift)} asignado correctamente`, 'success');
        }

        // Update statistics
        if (window.statsManager) {
            window.statsManager.updateStats();
        }
    }

    getShiftLabel(shift) {
        const labels = {
            'M': 'Mañana',
            'T': 'Tarde', 
            'N': 'Noche',
            'MN': 'Mañana y Noche',
            'SN': 'Saliente Nocturno',
            'AP': 'Asunto Propio',
            'ASC': 'Día Asociativo',
            'DAS': 'Descanso Singularizado',
            'DF': 'Descanso Festivo',
            'IND': 'Indispuesto',
            'B': 'Baja',
            'V': 'Vacaciones',
            'D': 'Descanso'
        };
        return labels[shift] || shift;
    }

    exportToPDF() {
        if (!window.SimplePDF) {
            this.showNotification('Función de exportación no disponible', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const calendarHTML = this.generateCalendarHTML();
            const statsHTML = window.statsManager?.generateStatsHTML() || '';
            const currentMonth = document.getElementById('currentMonth').textContent;

            const content = {
                periodo: currentMonth,
                calendar: calendarHTML,
                stats: statsHTML
            };

            const filename = `cuadrante_${currentMonth.replace(' ', '_')}.pdf`;
            const result = window.SimplePDF.exportToPDF(content, filename);

            if (result.success) {
                this.showNotification(result.message, 'success');
            }
        } catch (error) {
            console.error('Error al exportar PDF:', error);
            this.showNotification('Error al exportar PDF', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    exportToExcel() {
        if (!window.SimpleExcel) {
            this.showNotification('Función de exportación no disponible', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const calendarData = this.generateExcelData();
            const statsData = window.statsManager?.generateStatsData() || [];
            const currentMonth = document.getElementById('currentMonth').textContent;

            const data = {
                calendar: calendarData,
                stats: statsData
            };

            const filename = `cuadrante_${currentMonth.replace(' ', '_')}.xlsx`;
            const result = window.SimpleExcel.exportToExcel(data, filename);

            if (result.success) {
                this.showNotification(result.message, 'success');
            }
        } catch (error) {
            console.error('Error al exportar Excel:', error);
            this.showNotification('Error al exportar Excel', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    generateCalendarHTML() {
        let html = '<table class="calendar-table">';
        html += '<thead><tr><th>Día</th><th>Fecha</th><th>Turno</th></tr></thead><tbody>';

        Object.keys(this.calendarData).forEach(date => {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
            const shift = this.calendarData[date].shift;
            
            html += `<tr>
                <td>${dayName}</td>
                <td>${dateObj.toLocaleDateString('es-ES')}</td>
                <td>${this.getShiftLabel(shift)}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        return html;
    }

    generateExcelData() {
        const data = [];
        Object.keys(this.calendarData).forEach(date => {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
            const shift = this.calendarData[date].shift;
            
            data.push([
                dayName,
                dateObj.toLocaleDateString('es-ES'),
                this.getShiftLabel(shift),
                this.getShiftHours(shift)
            ]);
        });

        return data;
    }

    getShiftHours(shift) {
        const hours = {
            'M': 8,        // Mañana
            'T': 8,        // Tarde
            'N': 8,        // Noche
            'MN': 16,      // Mañana y Noche (doble turno)
            'SN': 0,       // Saliente Nocturno
            'AP': 7.5,     // Asunto Propio
            'ASC': 7.5,    // Día Asociativo
            'DAS': 7.5,    // Descanso Singularizado
            'DF': 7.5,     // Descanso Festivo
            'IND': 7.5,    // Indispuesto
            'B': 7.5,      // Baja
            'V': 7.5,      // Vacaciones
            'D': 0         // Descanso
        };
        return hours[shift] || 0;
    }

    loadConfiguration() {
        const savedConfig = localStorage.getItem('cuadrante-config');
        if (savedConfig) {
            this.config = { ...this.config, ...JSON.parse(savedConfig) };
        }
    }

    saveConfiguration() {
        const officerName = document.getElementById('officerName').value;
        const unit = document.getElementById('unit').value;
        const colorMañana = document.getElementById('colorMañana').value;
        const colorTarde = document.getElementById('colorTarde').value;
        const colorNoche = document.getElementById('colorNoche').value;

        this.config.officerName = officerName;
        this.config.unit = unit;
        this.config.colors.M = colorMañana;
        this.config.colors.T = colorTarde;
        this.config.colors.N = colorNoche;

        localStorage.setItem('cuadrante-config', JSON.stringify(this.config));
        
        // Update CSS variables
        this.updateColorVariables();
        
        this.showNotification('Configuración guardada correctamente', 'success');
    }

    loadConfigurationForm() {
        document.getElementById('officerName').value = this.config.officerName;
        document.getElementById('unit').value = this.config.unit;
        document.getElementById('colorMañana').value = this.config.colors.M;
        document.getElementById('colorTarde').value = this.config.colors.T;
        document.getElementById('colorNoche').value = this.config.colors.N;
    }

    updateColorVariables() {
        const root = document.documentElement;
        root.style.setProperty('--shift-M-color', this.config.colors.M);
        root.style.setProperty('--shift-T-color', this.config.colors.T);
        root.style.setProperty('--shift-N-color', this.config.colors.N);
    }

    loadCalendarData() {
        const savedData = localStorage.getItem('cuadrante-data');
        if (savedData) {
            this.calendarData = JSON.parse(savedData);
        }
    }

    saveCalendarData() {
        localStorage.setItem('cuadrante-data', JSON.stringify(this.calendarData));
        
        // Register background sync if service worker is available
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('sync-calendar-data');
            }).catch(console.error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Handle multiline messages
        const formattedMessage = message.includes('\n') 
            ? message.split('\n').map(line => line.trim()).filter(line => line).join('<br>')
            : message;
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${formattedMessage}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            max-width: 400px;
            animation: slideIn 0.3s ease;
            white-space: pre-line;
        `;

        document.body.appendChild(notification);

        // Auto remove after different times based on type
        const duration = type === 'warning' ? 7000 : type === 'error' ? 8000 : 4000;
        const timeout = setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeout);
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Validate consecutive shifts (from original appCuadrante)
    validarTurnosConsecutivos(fechaId, fechaActual, nuevoTipo) {
        // BLOCK: ASC cannot be assigned on Saturdays or Sundays
        if (nuevoTipo === 'ASC') {
            const diaSemana = fechaActual.getDay(); // 0=Sunday, 6=Saturday
            if (diaSemana === 0 || diaSemana === 6) {
                return {
                    bloquear: true,
                    mensaje: 'El Día Asociativo (ASC) no se puede asignar en sábados o domingos.'
                };
            }
        }
        
        // Get previous day
        const fechaAnterior = new Date(fechaActual);
        fechaAnterior.setDate(fechaAnterior.getDate() - 1);
        const fechaAnteriorId = `${fechaAnterior.getFullYear()}-${fechaAnterior.getMonth()}-${fechaAnterior.getDate()}`;
        const turnoAnterior = this.calendarData[fechaAnteriorId]?.shift;
        
        if (!turnoAnterior) return { bloquear: false, aviso: false };
        
        // Rule 1: After night shift (N or MN) only SN or another night shift is allowed
        if ((turnoAnterior === 'N' || turnoAnterior === 'MN')) {
            if (nuevoTipo !== 'SN' && nuevoTipo !== 'N' && nuevoTipo !== 'MN' && nuevoTipo !== 'D') {
                return {
                    bloquear: true,
                    mensaje: `Error: Tras un servicio nocturno (${turnoAnterior}) solo se permite:\n• Saliente Nocturno (SN)\n• Otro servicio nocturno (N o MN)\n• Descanso (D)\n\nNo se permite: ${this.getShiftLabel(nuevoTipo)}`
                };
            }
        }
        
        // Rule 2: Double Afternoon + Morning (warning, not block)
        if (turnoAnterior === 'T' && (nuevoTipo === 'M' || nuevoTipo === 'MN')) {
            return {
                bloquear: false,
                aviso: true,
                mensaje: `⚠️ Doblete detectado\n\nTarde (${fechaAnterior.getDate()}) → ${this.getShiftLabel(nuevoTipo)} (${fechaActual.getDate()})\n\nLos dobletes solo están permitidos en situaciones justificadas según normativa.`
            };
        }
        
        return { bloquear: false, aviso: false };
    }

    // Apply automatic weekly rest (from original appCuadrante)
    aplicarDescansoSemanalAutomatico() {
        if (!window.calendarManager || !window.calendarManager.currentPeriod) return;
        
        const tiposNoDisponibilidad = ['AP', 'ASC', 'DAS', 'DF', 'IND', 'B', 'V'];
        const fechaInicio = new Date(window.calendarManager.currentPeriod.inicio);
        const fechaFin = new Date(window.calendarManager.currentPeriod.fin);
        
        console.log('🔍 Iniciando verificación de descanso automático...');
        
        // Iterate through complete weeks (Monday to Sunday)
        let fechaActual = new Date(fechaInicio);
        
        while (fechaActual <= fechaFin) {
            const semanaActual = [];
            const fechaInicioSemana = new Date(fechaActual);
            
            // Create a complete week (7 days)
            for (let i = 0; i < 7; i++) {
                if (fechaActual <= fechaFin) {
                    const fechaId = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}-${fechaActual.getDate()}`;
                    const turno = this.calendarData[fechaId]?.shift || 'D';
                    
                    semanaActual.push({
                        fecha: new Date(fechaActual),
                        fechaId: fechaId,
                        diaSemana: fechaActual.getDay(), // 0=Sunday, 1=Monday, ..., 6=Saturday
                        turno: turno
                    });
                    
                    fechaActual.setDate(fechaActual.getDate() + 1);
                }
            }
            
            if (semanaActual.length === 7) { // Only process complete weeks
                // Get working days (Monday to Friday) - days with diaSemana 1, 2, 3, 4, 5
                const diasLaborables = semanaActual.filter(dia => dia.diaSemana >= 1 && dia.diaSemana <= 5);
                
                console.log(`📅 Semana ${fechaInicioSemana.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}:`, 
                    diasLaborables.map(d => `${d.diaSemana}:${d.turno}`).join(' '));
                
                // Check if all working days have unavailability types
                const todosNoDisponibles = diasLaborables.length === 5 && 
                    diasLaborables.every(dia => tiposNoDisponibilidad.includes(dia.turno));
                
                console.log(`   Todos no disponibles: ${todosNoDisponibles}`);
                
                if (todosNoDisponibles) {
                    // Get Saturday and Sunday of this week
                    const sabado = semanaActual.find(dia => dia.diaSemana === 6);
                    const domingo = semanaActual.find(dia => dia.diaSemana === 0);
                    
                    let cambios = 0;
                    
                    // Automatically set Saturday and Sunday as rest
                    if (sabado && sabado.turno !== 'D') {
                        this.calendarData[sabado.fechaId] = {
                            shift: 'D',
                            timestamp: new Date().toISOString()
                        };
                        cambios++;
                        console.log(`   ✅ Sábado ${sabado.fecha.getDate()} puesto como descanso`);
                    }
                    if (domingo && domingo.turno !== 'D') {
                        this.calendarData[domingo.fechaId] = {
                            shift: 'D',
                            timestamp: new Date().toISOString()
                        };
                        cambios++;
                        console.log(`   ✅ Domingo ${domingo.fecha.getDate()} puesto como descanso`);
                    }
                    
                    if (cambios > 0) {
                        console.log(`🔄 Descanso automático aplicado a semana: ${diasLaborables[0].fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${diasLaborables[diasLaborables.length-1].fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`);
                        
                        // Save changes and update interface
                        this.saveCalendarData();
                        window.calendarManager?.loadShiftData();
                    }
                }
            }
        }
    }

    // Nueva funcionalidad: Seleccionar tipo de turno (del proyecto original)
    seleccionarTipoTurno(tipo) {
        // Remover selección anterior
        document.querySelectorAll('.turno-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Seleccionar nuevo tipo
        const item = document.querySelector(`[data-tipo="${tipo}"]`);
        if (item) {
            item.classList.add('selected');
            this.tipoSeleccionado = tipo;
            this.selectedShift = tipo;
            
            // Actualizar display del turno seleccionado
            this.actualizarDisplayTurnoSeleccionado(tipo);
        }
    }

    actualizarDisplayTurnoSeleccionado(tipo) {
        const turnoCodigoElement = document.querySelector('.turno-codigo');
        const turnoNombreElement = document.querySelector('.turno-nombre');
        
        if (turnoCodigoElement && turnoNombreElement) {
            turnoCodigoElement.textContent = tipo;
            turnoCodigoElement.className = `turno-codigo codigo-${tipo}`;
            turnoNombreElement.textContent = this.getShiftLabel(tipo);
        }
    }

    // Manejar clic en día del calendario
    handleDayClick(dayElement, event) {
        const date = dayElement.dataset.date;
        
        if (this.modoMultiple) {
            event.stopPropagation();
            
            if (this.seleccionandoRango) {
                // Selección por rango
                if (!this.primerDiaRango) {
                    this.primerDiaRango = { date: date, element: dayElement };
                    dayElement.classList.add('dia-seleccionado');
                    this.showNotification('Primer día seleccionado. Haz clic en el último día del rango.', 'info');
                } else {
                    // Completar rango
                    this.seleccionarRango(this.primerDiaRango, { date: date, element: dayElement });
                    this.aplicarTurnoSeleccionados();
                    this.seleccionandoRango = false;
                    this.primerDiaRango = null;
                }
            } else {
                // Selección múltiple normal
                if (this.diasSeleccionados.has(date)) {
                    this.diasSeleccionados.delete(date);
                    dayElement.classList.remove('dia-seleccionado');
                } else {
                    this.diasSeleccionados.add(date);
                    dayElement.classList.add('dia-seleccionado');
                }
            }
        } else {
            // Modo normal
            this.selectDay(dayElement);
            if (this.tipoSeleccionado) {
                this.applyShiftToDate(date, this.tipoSeleccionado);
            }
        }
    }

    // Toggle modo múltiple
    toggleModoMultiple(activo) {
        this.modoMultiple = activo;
        const calendarContainer = document.querySelector('.calendar-container');
        const infoModo = document.getElementById('info-modo');
        const modoControls = document.querySelector('.modo-multiple-controls');
        
        if (activo) {
            calendarContainer?.classList.add('modo-multiple-activo');
            if (infoModo) infoModo.style.display = 'block';
            if (modoControls) modoControls.style.display = 'block';
            this.diasSeleccionados.clear();
            this.showNotification(`Modo selección múltiple activado.\nTurno seleccionado: ${this.tipoSeleccionado} (${this.getShiftLabel(this.tipoSeleccionado)})`, 'info');
        } else {
            calendarContainer?.classList.remove('modo-multiple-activo');
            if (infoModo) infoModo.style.display = 'none';
            if (modoControls) modoControls.style.display = 'none';
            this.limpiarSeleccionDias();
        }
    }

    // Limpiar selección de días
    limpiarSeleccionDias() {
        document.querySelectorAll('.dia-seleccionado').forEach(dia => {
            dia.classList.remove('dia-seleccionado');
        });
        this.diasSeleccionados.clear();
    }

    // Aplicar turno a días seleccionados
    aplicarTurnoSeleccionados() {
        if (this.diasSeleccionados.size === 0) {
            this.showNotification('No hay días seleccionados.', 'warning');
            return;
        }
        
        let contador = 0;
        let errores = 0;
        let avisos = 0;
        
        this.diasSeleccionados.forEach(date => {
            const [year, month, day] = date.split('-').map(Number);
            const fechaActual = new Date(year, month, day);
            
            const validacion = this.validarTurnosConsecutivos(date, fechaActual, this.tipoSeleccionado);
            if (validacion.bloquear) {
                errores++;
            } else {
                // Aplicar turno
                this.calendarData[date] = {
                    shift: this.tipoSeleccionado,
                    timestamp: new Date().toISOString()
                };
                contador++;
                
                if (validacion.aviso) {
                    avisos++;
                }
            }
        });
        
        // Aplicar lógica automática de descanso semanal
        this.aplicarDescansoSemanalAutomatico();
        
        // Actualizar interfaz
        window.calendarManager?.loadShiftData();
        this.saveCalendarData();
        this.limpiarSeleccionDias();
        
        if (window.statsManager) {
            window.statsManager.updateStats();
        }
        
        let mensaje = `Se aplicó el turno ${this.tipoSeleccionado} a ${contador} días.`;
        if (errores > 0) {
            mensaje += `\n${errores} días no se pudieron modificar por restricciones de normativa.`;
        }
        if (avisos > 0) {
            mensaje += `\n${avisos} días tienen dobletes detectados.`;
        }
        
        this.showNotification(mensaje, errores > 0 ? 'warning' : 'success');
    }

    // Seleccionar rango de días
    seleccionarRango(primerDia, ultimoDia) {
        const fechaInicio = new Date(Math.min(new Date(primerDia.date), new Date(ultimoDia.date)));
        const fechaFin = new Date(Math.max(new Date(primerDia.date), new Date(ultimoDia.date)));
        
        this.diasSeleccionados.clear();
        
        // Seleccionar todos los días en el rango
        const fechaActual = new Date(fechaInicio);
        while (fechaActual <= fechaFin) {
            const dateString = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}-${fechaActual.getDate()}`;
            this.diasSeleccionados.add(dateString);
            
            // Marcar visualmente
            const dayElement = document.querySelector(`[data-date="${dateString}"]`);
            if (dayElement) {
                dayElement.classList.add('dia-seleccionado');
            }
            
            fechaActual.setDate(fechaActual.getDate() + 1);
        }
    }

    // Activar selección por rango
    activarSeleccionRango() {
        if (!this.modoMultiple) {
            this.showNotification('Primero activa el modo selección múltiple.', 'warning');
            return;
        }
        
        this.seleccionandoRango = true;
        this.primerDiaRango = null;
        this.limpiarSeleccionDias();
        this.showNotification('Haz clic en el primer día del rango que quieres seleccionar.', 'info');
    }

    // Aplicar semana completa
    async aplicarSemanaCompleta() {
        if (!window.calendarManager || !window.calendarManager.currentPeriod) {
            this.showNotification('Primero genera un cuadrante con período calculado.', 'error');
            return;
        }
        
        if (!this.tipoSeleccionado) {
            this.showNotification('Primero selecciona un tipo de turno.', 'error');
            return;
        }
        
        const numSemanasTotal = window.calendarManager.currentPeriod.semanas || 4;
        
        try {
            const numSemana = await this.mostrarInputModal(
                'Aplicar Semana Completa',
                `¿Qué semana quieres completar con el turno ${this.tipoSeleccionado} (${this.getShiftLabel(this.tipoSeleccionado)})?\n\nIntroduce el número de semana:`,
                '1',
                1,
                numSemanasTotal
            );
            
            // Calcular los días de esa semana
            const fechaInicioCuadrante = new Date(window.calendarManager.currentPeriod.inicio);
            const fechaInicioSemana = new Date(fechaInicioCuadrante);
            fechaInicioSemana.setDate(fechaInicioSemana.getDate() + ((numSemana - 1) * 7));
            
            this.diasSeleccionados.clear();
            let diasAgregados = 0;
            
            // Seleccionar los 7 días de la semana
            for (let i = 0; i < 7; i++) {
                const fecha = new Date(fechaInicioSemana);
                fecha.setDate(fecha.getDate() + i);
                
                if (fecha >= new Date(window.calendarManager.currentPeriod.inicio) && 
                    fecha <= new Date(window.calendarManager.currentPeriod.fin)) {
                    const fechaId = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
                    this.diasSeleccionados.add(fechaId);
                    diasAgregados++;
                }
            }
            
            if (diasAgregados === 0) {
                this.showNotification('No se encontraron días válidos para esa semana.', 'error');
                return;
            }
            
            // Aplicar los turnos
            this.aplicarTurnoSeleccionados();
            
        } catch (error) {
            if (error !== 'cancelado') {
                console.error('Error en aplicar semana completa:', error);
            }
        }
    }

    // Limpiar semana
    async limpiarSemana() {
        if (!window.calendarManager || !window.calendarManager.currentPeriod) {
            this.showNotification('Primero genera un cuadrante con período calculado.', 'error');
            return;
        }
        
        const numSemanasTotal = window.calendarManager.currentPeriod.semanas || 4;
        
        try {
            const numSemana = await this.mostrarInputModal(
                'Limpiar Semana',
                `¿Qué semana quieres limpiar (eliminar todos los turnos asignados)?\n\nIntroduce el número de semana:`,
                '1',
                1,
                numSemanasTotal
            );
            
            // Calcular los días de esa semana
            const fechaInicioCuadrante = new Date(window.calendarManager.currentPeriod.inicio);
            const fechaInicioSemana = new Date(fechaInicioCuadrante);
            fechaInicioSemana.setDate(fechaInicioSemana.getDate() + ((numSemana - 1) * 7));
            
            let contador = 0;
            
            // Limpiar los 7 días de la semana
            for (let i = 0; i < 7; i++) {
                const fecha = new Date(fechaInicioSemana);
                fecha.setDate(fecha.getDate() + i);
                
                if (fecha >= new Date(window.calendarManager.currentPeriod.inicio) && 
                    fecha <= new Date(window.calendarManager.currentPeriod.fin)) {
                    const fechaId = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
                    delete this.calendarData[fechaId];
                    contador++;
                }
            }
            
            // Aplicar lógica automática de descanso semanal
            this.aplicarDescansoSemanalAutomatico();
            
            // Actualizar interfaz
            window.calendarManager?.loadShiftData();
            this.saveCalendarData();
            
            if (window.statsManager) {
                window.statsManager.updateStats();
            }
            
            this.showNotification(`Se limpiaron ${contador} días de la semana ${numSemana}.`, 'success');
            
        } catch (error) {
            if (error !== 'cancelado') {
                console.error('Error en limpiar semana:', error);
            }
        }
    }

    // Modal de entrada (del proyecto original)
    mostrarInputModal(titulo, mensaje, valorDefecto = '', min = 1, max = 10) {
        return new Promise((resolve, reject) => {
            // Crear modal
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            `;
            
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                text-align: center;
            `;
            
            modal.innerHTML = `
                <h3 style="margin: 0 0 1rem 0; color: var(--primary-color);">${titulo}</h3>
                <p style="margin: 0 0 1.5rem 0; white-space: pre-line;">${mensaje}</p>
                <input type="number" id="modal-input" min="${min}" max="${max}" value="${valorDefecto}" 
                       style="width: 100px; padding: 0.5rem; border: 2px solid #ddd; border-radius: 4px; text-align: center; font-size: 1.1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="modal-ok" style="background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;">Aceptar</button>
                    <button id="modal-cancel" style="background: #f44336; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancelar</button>
                </div>
            `;
            
            modalOverlay.appendChild(modal);
            document.body.appendChild(modalOverlay);
            
            const input = modal.querySelector('#modal-input');
            const okBtn = modal.querySelector('#modal-ok');
            const cancelBtn = modal.querySelector('#modal-cancel');
            
            // Focus en el input
            setTimeout(() => input.focus(), 100);
            
            const cerrar = (resultado = null) => {
                document.body.removeChild(modalOverlay);
                if (resultado !== null) {
                    resolve(resultado);
                } else {
                    reject('cancelado');
                }
            };
            
            okBtn.addEventListener('click', () => {
                const valor = parseInt(input.value);
                if (isNaN(valor) || valor < min || valor > max) {
                    input.style.borderColor = '#f44336';
                    input.focus();
                    return;
                }
                cerrar(valor);
            });
            
            cancelBtn.addEventListener('click', () => cerrar());
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    okBtn.click();
                } else if (e.key === 'Escape') {
                    cancelBtn.click();
                }
            });
            
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    cancelBtn.click();
                }
            });
        });
    }
}

// Add notification animations to CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(notificationStyles);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cuadranteApp = new CuadranteApp();
}); 