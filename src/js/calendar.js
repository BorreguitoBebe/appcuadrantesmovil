// Calendar Manager para Cuadrante PWA
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.currentPeriod = null; // Período calculado de semanas completas
        this.monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        this.dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateCalendar();
        console.log('Calendar Manager inicializado');
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.changeMonth(1);
        });
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        // Recalcular período para el nuevo mes
        this.currentPeriod = this.calcularPeriodoCuadrante(this.currentYear, this.currentMonth);
        this.generateCalendar();
        
        // Update statistics if stats manager exists
        if (window.statsManager) {
            window.statsManager.updateStats();
        }
    }

    generateCalendar() {
        const calendar = document.getElementById('calendar');
        const currentMonthElement = document.getElementById('currentMonth');
        
        // Calculate period if not already calculated
        if (!this.currentPeriod) {
            this.currentPeriod = this.calcularPeriodoCuadrante(this.currentYear, this.currentMonth);
        }
        
        // Update month display with period info
        const fechaInicioStr = this.currentPeriod.inicio.toLocaleDateString('es-ES', { 
            day: 'numeric', month: 'short' 
        });
        const fechaFinStr = this.currentPeriod.fin.toLocaleDateString('es-ES', { 
            day: 'numeric', month: 'short' 
        });
        
        currentMonthElement.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 1.2rem; font-weight: 600;">${this.monthNames[this.currentMonth]} ${this.currentYear}</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">
                    Período: ${fechaInicioStr} - ${fechaFinStr} (${this.currentPeriod.semanas} semanas)
                </div>
            </div>
        `;
        
        // Clear previous calendar
        calendar.innerHTML = '';
        
        // Add day headers
        this.dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header';
            dayHeader.textContent = day;
            dayHeader.style.cssText = `
                background: var(--primary-color);
                color: white;
                padding: 0.5rem;
                text-align: center;
                font-weight: 600;
                font-size: 0.9rem;
            `;
            calendar.appendChild(dayHeader);
        });

        // Generate calendar based on calculated period
        const fechaActual = new Date(this.currentPeriod.inicio);
        const fechaFin = new Date(this.currentPeriod.fin);
        
        while (fechaActual <= fechaFin) {
            const dayElement = this.createDayElementFromPeriod(new Date(fechaActual));
            calendar.appendChild(dayElement);
            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        // Load existing shift data
        this.loadShiftData();
    }

    createDayElementFromPeriod(fecha) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if it's from the natural month or other months (for visual styling only)
        const esMesNatural = fecha.getMonth() === this.currentMonth && fecha.getFullYear() === this.currentYear;
        if (!esMesNatural) {
            dayElement.classList.add('other-month');
        }
        
        // Check if it's within the calculated period (for selection purposes)
        const esDentroPeriodo = fecha >= this.currentPeriod.inicio && fecha <= this.currentPeriod.fin;
        if (!esDentroPeriodo) {
            dayElement.classList.add('out-of-period');
        }
        
        // Mark weekends
        if (fecha.getDay() === 0 || fecha.getDay() === 6) {
            dayElement.classList.add('weekend');
        }

        // Create unique identifier for this date
        const dateString = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
        dayElement.dataset.date = dateString;

        // Add day number with month abbreviation
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.innerHTML = `
            <span class="dia-numero">${fecha.getDate()}</span>
            <span class="dia-mes">${this.monthNames[fecha.getMonth()].substring(0, 3)}</span>
        `;
        dayElement.appendChild(dayNumber);

        // Add appointment info integrated with the day
        this.addAppointmentInfo(dayElement, dateString);

        // Highlight today
        const today = new Date();
        if (fecha.getFullYear() === today.getFullYear() && 
            fecha.getMonth() === today.getMonth() && 
            fecha.getDate() === today.getDate() && esMesNatural) {
            dayElement.style.border = '2px solid var(--primary-color)';
            dayElement.style.fontWeight = 'bold';
        }

        return dayElement;
    }

    // Legacy method for compatibility
    createDayElement(day, month, year, isOtherMonth) {
        const fecha = new Date(year, month, day);
        return this.createDayElementFromPeriod(fecha);
    }

    loadShiftData() {
        if (!window.cuadranteApp || !window.cuadranteApp.calendarData) {
            return;
        }

        const calendarData = window.cuadranteApp.calendarData;
        
        Object.keys(calendarData).forEach(dateString => {
            const dayElement = document.querySelector(`[data-date="${dateString}"]`);
            if (dayElement && !dayElement.classList.contains('out-of-period')) {
                const shift = calendarData[dateString].shift;
                
                // Remove existing shift indicator
                const existingShift = dayElement.querySelector('.day-shift');
                if (existingShift) {
                    existingShift.remove();
                }

                // Add shift indicator
                const shiftElement = document.createElement('div');
                shiftElement.className = `day-shift shift-${shift}`;
                shiftElement.textContent = this.getShiftLabel(shift);
                dayElement.appendChild(shiftElement);
                
                // Refresh appointment info for this day
                this.refreshAppointmentInfoForDay(dayElement, dateString);
            }
        });
    }

    refreshAppointmentInfoForDay(dayElement, dateString) {
        // Remove existing appointment elements
        const existingIndicator = dayElement.querySelector('.appointment-indicator');
        const existingPreview = dayElement.querySelector('.day-appointment-preview');
        
        if (existingIndicator) existingIndicator.remove();
        if (existingPreview) existingPreview.remove();
        
        // Remove appointment class
        dayElement.classList.remove('has-appointments');
        
        // Re-add appointment info
        this.addAppointmentInfo(dayElement, dateString);
    }

    getShiftLabel(shift) {
        // Los códigos ya son las etiquetas cortas del proyecto original
        return shift;
    }

    addAppointmentInfo(dayElement, dateString) {
        // Check if appointments manager exists and has appointments for this date
        if (window.appointmentsManager) {
            console.log('📅 Verificando citas para:', dateString);
            const appointments = window.appointmentsManager.getAppointmentsForDate(dateString);
            if (appointments && appointments.length > 0) {
                console.log('✅ Agregando indicadores para', appointments.length, 'citas en', dateString);
                
                // Add CSS class for styling
                dayElement.classList.add('has-appointments');
                
                // Add small indicator (keeping existing functionality)
                const indicator = document.createElement('div');
                indicator.className = 'appointment-indicator';
                indicator.title = `${appointments.length} cita${appointments.length > 1 ? 's' : ''}`;
                indicator.textContent = appointments.length;
                
                // Add click event to show appointments for this day
                indicator.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showDayAppointments(dateString, appointments);
                });
                
                dayElement.appendChild(indicator);

                // Add integrated appointment info
                this.addIntegratedAppointmentInfo(dayElement, appointments);
            } else {
                // Remove CSS class if no appointments
                dayElement.classList.remove('has-appointments');
            }
        } else {
            console.log('❌ Appointments manager no disponible para:', dateString);
        }
    }

    addIntegratedAppointmentInfo(dayElement, appointments) {
        // Sort appointments by time
        const sortedAppointments = appointments.sort((a, b) => a.time.localeCompare(b.time));
        
        // Get the first appointment (earliest time)
        const firstAppointment = sortedAppointments[0];
        
        // Category icons for appointments
        const categoryIcons = {
            personal: '👤',
            work: '💼',
            medical: '🏥',
            legal: '⚖️',
            training: '📚',
            other: '📌'
        };

        // Create appointment preview element
        const appointmentPreview = document.createElement('div');
        appointmentPreview.className = 'day-appointment-preview';
        
        // Show different info based on number of appointments
        if (appointments.length === 1) {
            // Single appointment - show icon, time and short title
            const icon = categoryIcons[firstAppointment.category] || '📌';
            const time = firstAppointment.time.substring(0, 5); // HH:MM format
            const shortTitle = firstAppointment.title.length > 12 ? 
                               firstAppointment.title.substring(0, 12) + '...' : 
                               firstAppointment.title;
            
            appointmentPreview.innerHTML = `
                <div class="appointment-preview-line">
                    <span class="appointment-icon">${icon}</span>
                    <span class="appointment-time">${time}</span>
                    <span class="appointment-title-short">${shortTitle}</span>
                </div>
            `;
        } else {
            // Multiple appointments - show count and first appointment time
            const icon = categoryIcons[firstAppointment.category] || '📌';
            const time = firstAppointment.time.substring(0, 5);
            
            appointmentPreview.innerHTML = `
                <div class="appointment-preview-line">
                    <span class="appointment-icon">${icon}</span>
                    <span class="appointment-time">${time}</span>
                    <span class="appointment-multiple">+${appointments.length - 1} más</span>
                </div>
            `;
        }

        // Add tooltip with all appointments
        const tooltipText = appointments.map(apt => 
            `${apt.time} - ${apt.title}`
        ).join('\n');
        appointmentPreview.title = tooltipText;

        // Add click event to show appointments
        appointmentPreview.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDayAppointments(dayElement.dataset.date, appointments);
        });

        dayElement.appendChild(appointmentPreview);
    }

    showDayAppointments(dateString, appointments) {
        // Switch to appointments section and filter by date
        if (window.cuadranteApp) {
            window.cuadranteApp.showSection('appointments');
            
            // Wait a bit for the section to load, then show appointments for this day
            setTimeout(() => {
                if (window.appointmentsManager) {
                    // Create a temporary filter for this specific date
                    const container = document.getElementById('appointments-list');
                    if (container) {
                        const formattedDate = new Date(dateString).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                        });
                        
                        container.innerHTML = `
                            <div class="day-appointments-header">
                                <h3>Citas para ${formattedDate}</h3>
                                <button onclick="window.appointmentsManager.renderAppointments()" class="btn-back">
                                    ← Volver a todas las citas
                                </button>
                            </div>
                            ${appointments.map(apt => {
                                const categoryIcons = {
                                    personal: '👤',
                                    work: '💼',
                                    medical: '🏥',
                                    legal: '⚖️',
                                    training: '📚',
                                    other: '📌'
                                };
                                
                                return `
                                    <div class="appointment-card" 
                                         onclick="window.appointmentsManager.showAppointmentModal(${JSON.stringify(apt).replace(/"/g, '&quot;')})">
                                        <div class="appointment-header">
                                            <div class="appointment-category">
                                                ${categoryIcons[apt.category] || '📌'}
                                            </div>
                                            <div class="appointment-title">${apt.title}</div>
                                            <div class="appointment-status">📅</div>
                                        </div>
                                        
                                        <div class="appointment-datetime">
                                            🕐 ${apt.time}
                                        </div>
                                        
                                        ${apt.description ? `<div class="appointment-description">${apt.description}</div>` : ''}
                                        
                                        ${apt.reminders && apt.reminders.length > 0 ? `
                                            <div class="appointment-reminders">
                                                🔔 ${apt.reminders.map(r => window.appointmentsManager.formatReminder(r)).join(', ')}
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        `;
                    }
                }
            }, 100);
        }
    }

    // Calculate period for quadrant (complete weeks)
    calcularPeriodoCuadrante(año, mes) {
        // First day of natural month
        const primerDiaMes = new Date(año, mes, 1);
        const ultimoDiaMes = new Date(año, mes + 1, 0);
        
        // Find Monday of the week containing the first day
        const diaSemana = primerDiaMes.getDay();
        const diasHastaLunes = diaSemana === 0 ? -6 : -(diaSemana - 1);
        
        let fechaInicio = new Date(primerDiaMes);
        fechaInicio.setDate(fechaInicio.getDate() + diasHastaLunes);
        
        // Check if invasion of previous month is greater than 3 days
        const diasInvasionAnterior = Math.abs(diasHastaLunes);
        if (diasInvasionAnterior > 3) {
            // If invades more than 3 days of previous month, start on first Monday of natural month
            fechaInicio = new Date(primerDiaMes);
            if (primerDiaMes.getDay() === 1) {
                // If first day is already Monday, use that day
                // Do nothing, fechaInicio is already correct
            } else {
                // Find next Monday
                const diasHastaSiguienteLunes = primerDiaMes.getDay() === 0 ? 1 : 8 - primerDiaMes.getDay();
                fechaInicio.setDate(fechaInicio.getDate() + diasHastaSiguienteLunes);
            }
        }
        
        // Find Sunday of the week containing the last day
        const diaSemanaUltimo = ultimoDiaMes.getDay();
        const diasHastaDomingo = diaSemanaUltimo === 0 ? 0 : 7 - diaSemanaUltimo;
        
        let fechaFin = new Date(ultimoDiaMes);
        fechaFin.setDate(fechaFin.getDate() + diasHastaDomingo);
        
        // Check if invasion of next month is greater than 3 days
        const diasInvasionSiguiente = diasHastaDomingo;
        if (diasInvasionSiguiente > 3) {
            // If invades more than 3 days of next month, end on last Sunday within natural month
            fechaFin = new Date(ultimoDiaMes);
            if (ultimoDiaMes.getDay() === 0) {
                // If last day is already Sunday, use that day
                // Do nothing, fechaFin is already correct
            } else {
                // Find previous Sunday within the month
                fechaFin.setDate(fechaFin.getDate() - ultimoDiaMes.getDay());
            }
        }
        
        // Calculate number of weeks
        const diferenciaMilisegundos = fechaFin.getTime() - fechaInicio.getTime();
        const semanas = Math.floor(diferenciaMilisegundos / (7 * 24 * 60 * 60 * 1000)) + 1;
        
        console.log(`📅 Cálculo período ${this.monthNames[mes]} ${año}:`);
        console.log(`   Mes natural: ${primerDiaMes.toLocaleDateString('es-ES')} - ${ultimoDiaMes.toLocaleDateString('es-ES')}`);
        console.log(`   Invasión anterior: ${diasInvasionAnterior} días ${diasInvasionAnterior > 3 ? '(LIMITADA)' : '(OK)'}`);
        console.log(`   Invasión siguiente: ${diasInvasionSiguiente} días ${diasInvasionSiguiente > 3 ? '(LIMITADA)' : '(OK)'}`);
        console.log(`   Período final: ${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`);
        console.log(`   Semanas: ${semanas}`);
        
        return {
            inicio: fechaInicio,
            fin: fechaFin,
            semanas: semanas
        };
    }

    // Get current month data for exports and statistics
    getCurrentMonthData() {
        if (!window.cuadranteApp || !window.cuadranteApp.calendarData) {
            return {};
        }

        const calendarData = window.cuadranteApp.calendarData;
        const currentMonthData = {};
        
        // Filter data for current period (not just natural month)
        if (this.currentPeriod) {
            Object.keys(calendarData).forEach(dateString => {
                // Parse date correctly: formato es YYYY-M-D donde M ya está en 0-11
                const [year, month, day] = dateString.split('-').map(Number);
                const date = new Date(year, month, day);
                
                if (date >= this.currentPeriod.inicio && date <= this.currentPeriod.fin) {
                    currentMonthData[dateString] = calendarData[dateString];
                }
            });
        }

        return currentMonthData;
    }

    // Get date range for current month
    getCurrentMonthRange() {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        
        return {
            start: firstDay,
            end: lastDay,
            month: this.currentMonth,
            year: this.currentYear,
            monthName: this.monthNames[this.currentMonth]
        };
    }

    // Navigate to specific month
    goToMonth(month, year) {
        this.currentMonth = month;
        this.currentYear = year;
        this.generateCalendar();
    }

    // Navigate to today
    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.generateCalendar();
    }

    // Get all working days in current month
    getWorkingDays() {
        const monthData = this.getCurrentMonthData();
        const workingDays = [];
        
        Object.keys(monthData).forEach(dateString => {
            const shift = monthData[dateString].shift;
            if (shift !== 'libre' && shift !== 'vacaciones') {
                workingDays.push({
                    date: dateString,
                    shift: shift
                });
            }
        });

        return workingDays;
    }

    // Get shift pattern analysis
    getShiftPattern() {
        const monthData = this.getCurrentMonthData();
        const pattern = {
            mañana: 0,
            tarde: 0,
            noche: 0,
            libre: 0,
            vacaciones: 0
        };

        Object.values(monthData).forEach(dayData => {
            if (pattern.hasOwnProperty(dayData.shift)) {
                pattern[dayData.shift]++;
            }
        });

        return pattern;
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
}); 