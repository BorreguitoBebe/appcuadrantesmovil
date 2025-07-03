// Appointments Manager para Cuadrante PWA
class AppointmentsManager {
    constructor() {
        this.appointments = [];
        this.notificationPermission = false;
        this.init();
    }

    init() {
        this.loadAppointments();
        this.setupEventListeners();
        this.requestNotificationPermission();
        this.checkPendingNotifications();
        console.log('✅ Appointments Manager inicializado con', this.appointments.length, 'citas');
        
        // Refresh calendar indicators after initialization
        this.refreshCalendarAppointments();
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission === 'granted';
        }
    }

    setupEventListeners() {
        // Add appointment button
        const addBtn = document.getElementById('addAppointmentBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAppointmentModal());
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderAppointments(e.target.dataset.filter);
            });
        });
    }

    showAppointmentModal(appointment = null) {
        const isEdit = appointment !== null;
        const modalId = isEdit ? 'editAppointmentModal' : 'addAppointmentModal';
        
        // Remove existing modal if any
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content appointment-modal">
                <div class="modal-header">
                    <h3>${isEdit ? 'Editar Cita' : 'Nueva Cita'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="appointmentForm" class="appointment-form">
                    <div class="form-group">
                        <label for="appt-title">Título *</label>
                        <input type="text" id="appt-title" required value="${appointment?.title || ''}" 
                               placeholder="Ej: Cita médica, Reunión, etc.">
                    </div>
                    
                    <div class="form-group">
                        <label for="appt-description">Descripción</label>
                        <textarea id="appt-description" rows="3" placeholder="Detalles adicionales...">${appointment?.description || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="appt-date">Fecha *</label>
                            <input type="date" id="appt-date" required value="${appointment?.date || ''}">
                        </div>
                        <div class="form-group">
                            <label for="appt-time">Hora *</label>
                            <input type="time" id="appt-time" required value="${appointment?.time || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="appt-category">Categoría</label>
                        <select id="appt-category">
                            <option value="personal" ${appointment?.category === 'personal' ? 'selected' : ''}>Personal</option>
                            <option value="work" ${appointment?.category === 'work' ? 'selected' : ''}>Trabajo</option>
                            <option value="medical" ${appointment?.category === 'medical' ? 'selected' : ''}>Médico</option>
                            <option value="legal" ${appointment?.category === 'legal' ? 'selected' : ''}>Legal</option>
                            <option value="training" ${appointment?.category === 'training' ? 'selected' : ''}>Formación</option>
                            <option value="other" ${appointment?.category === 'other' ? 'selected' : ''}>Otro</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Recordatorios</label>
                        <div class="reminders-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="reminder-5min" ${appointment?.reminders?.includes('5min') ? 'checked' : ''}>
                                <span>5 minutos antes</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="reminder-1hour" ${appointment?.reminders?.includes('1hour') ? 'checked' : ''}>
                                <span>1 hora antes</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="reminder-1day" ${appointment?.reminders?.includes('1day') ? 'checked' : ''}>
                                <span>1 día antes</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancelar</button>
                        <button type="submit" class="btn-save">${isEdit ? 'Actualizar' : 'Guardar'}</button>
                        ${isEdit ? '<button type="button" class="btn-delete">Eliminar</button>' : ''}
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners for modal
        const form = modal.querySelector('#appointmentForm');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const deleteBtn = modal.querySelector('.btn-delete');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAppointment(isEdit ? appointment.id : null);
            this.closeModal(modal);
        });

        closeBtn.addEventListener('click', () => this.closeModal(modal));
        cancelBtn.addEventListener('click', () => this.closeModal(modal));
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
                    this.deleteAppointment(appointment.id);
                    this.closeModal(modal);
                }
            });
        }

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });
    }

    closeModal(modal) {
        modal.remove();
    }

    saveAppointment(editId = null) {
        const form = document.getElementById('appointmentForm');
        const formData = new FormData(form);
        
        const reminders = [];
        if (document.getElementById('reminder-5min').checked) reminders.push('5min');
        if (document.getElementById('reminder-1hour').checked) reminders.push('1hour');
        if (document.getElementById('reminder-1day').checked) reminders.push('1day');

        const appointmentData = {
            id: editId || Date.now().toString(),
            title: document.getElementById('appt-title').value,
            description: document.getElementById('appt-description').value,
            date: document.getElementById('appt-date').value,
            time: document.getElementById('appt-time').value,
            category: document.getElementById('appt-category').value,
            reminders: reminders,
            created: editId ? this.appointments.find(a => a.id === editId)?.created : new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (editId) {
            // Update existing appointment
            const index = this.appointments.findIndex(a => a.id === editId);
            if (index !== -1) {
                this.appointments[index] = appointmentData;
            }
        } else {
            // Add new appointment
            this.appointments.push(appointmentData);
        }

        this.saveAppointments();
        this.renderAppointments();
        this.scheduleNotifications(appointmentData);
        this.refreshCalendarAppointments();
        
        this.showNotification(`Cita ${editId ? 'actualizada' : 'creada'} correctamente`, 'success');
    }

    deleteAppointment(id) {
        this.appointments = this.appointments.filter(a => a.id !== id);
        this.saveAppointments();
        this.renderAppointments();
        this.refreshCalendarAppointments();
        this.showNotification('Cita eliminada correctamente', 'success');
    }

    renderAppointments(filter = 'all') {
        const container = document.getElementById('appointments-list');
        if (!container) return;

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        let filteredAppointments = [...this.appointments];

        // Apply filter
        switch (filter) {
            case 'upcoming':
                filteredAppointments = this.appointments.filter(apt => {
                    const aptDateTime = new Date(`${apt.date}T${apt.time}`);
                    return aptDateTime >= now;
                });
                break;
            case 'today':
                filteredAppointments = this.appointments.filter(apt => apt.date === today);
                break;
            case 'past':
                filteredAppointments = this.appointments.filter(apt => {
                    const aptDateTime = new Date(`${apt.date}T${apt.time}`);
                    return aptDateTime < now;
                });
                break;
        }

        // Sort by date and time
        filteredAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        if (filteredAppointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No hay citas para mostrar</p>
                    <button onclick="window.appointmentsManager.showAppointmentModal()" class="btn-primary">
                        Crear primera cita
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredAppointments.map(apt => {
            const aptDateTime = new Date(`${apt.date}T${apt.time}`);
            const isPast = aptDateTime < now;
            const isToday = apt.date === today;
            const isUpcoming = aptDateTime >= now;

            const categoryIcons = {
                personal: '👤',
                work: '💼',
                medical: '🏥',
                legal: '⚖️',
                training: '📚',
                other: '📌'
            };

            const timeUntil = this.getTimeUntil(aptDateTime);

            return `
                <div class="appointment-card ${isPast ? 'past' : ''} ${isToday ? 'today' : ''}" 
                     onclick="window.appointmentsManager.showAppointmentModal(${JSON.stringify(apt).replace(/"/g, '&quot;')})">
                    <div class="appointment-header">
                        <div class="appointment-category">
                            ${categoryIcons[apt.category] || '📌'}
                        </div>
                        <div class="appointment-title">${apt.title}</div>
                        <div class="appointment-status">
                            ${isPast ? '✅' : isToday ? '🔥' : '⏰'}
                        </div>
                    </div>
                    
                    <div class="appointment-datetime">
                        📅 ${this.formatDate(apt.date)} • 🕐 ${apt.time}
                        ${timeUntil ? `<span class="time-until">${timeUntil}</span>` : ''}
                    </div>
                    
                    ${apt.description ? `<div class="appointment-description">${apt.description}</div>` : ''}
                    
                    ${apt.reminders.length > 0 ? `
                        <div class="appointment-reminders">
                            🔔 ${apt.reminders.map(r => this.formatReminder(r)).join(', ')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
    }

    formatReminder(reminder) {
        const formats = {
            '5min': '5 min antes',
            '1hour': '1h antes',
            '1day': '1 día antes'
        };
        return formats[reminder] || reminder;
    }

    getTimeUntil(dateTime) {
        const now = new Date();
        const diff = dateTime - now;
        
        if (diff < 0) return null; // Past appointment
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `en ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `en ${hours}h ${minutes}m`;
        if (minutes > 0) return `en ${minutes} min`;
        return 'ahora';
    }

    scheduleNotifications(appointment) {
        if (!this.notificationPermission) return;

        const aptDateTime = new Date(`${appointment.date}T${appointment.time}`);
        const now = new Date();

        appointment.reminders.forEach(reminder => {
            let notificationTime;
            
            switch (reminder) {
                case '5min':
                    notificationTime = new Date(aptDateTime.getTime() - 5 * 60 * 1000);
                    break;
                case '1hour':
                    notificationTime = new Date(aptDateTime.getTime() - 60 * 60 * 1000);
                    break;
                case '1day':
                    notificationTime = new Date(aptDateTime.getTime() - 24 * 60 * 60 * 1000);
                    break;
            }

            if (notificationTime > now) {
                const delay = notificationTime.getTime() - now.getTime();
                setTimeout(() => {
                    this.showBrowserNotification(appointment, reminder);
                }, delay);
            }
        });
    }

    showBrowserNotification(appointment, reminder) {
        if (!this.notificationPermission) return;

        const reminderText = this.formatReminder(reminder);
        new Notification(`Recordatorio: ${appointment.title}`, {
            body: `${reminderText}\n${appointment.description || ''}`,
            icon: 'assets/src/iconoGC.ico.ico',
            tag: `appointment-${appointment.id}-${reminder}`,
            requireInteraction: true
        });
    }

    checkPendingNotifications() {
        // Check for appointments in the next hour that might need immediate notification
        const now = new Date();
        const oneHour = new Date(now.getTime() + 60 * 60 * 1000);

        this.appointments.forEach(appointment => {
            const aptDateTime = new Date(`${appointment.date}T${appointment.time}`);
            if (aptDateTime >= now && aptDateTime <= oneHour) {
                this.scheduleNotifications(appointment);
            }
        });
    }

    loadAppointments() {
        const saved = localStorage.getItem('cuadrante-appointments');
        if (saved) {
            this.appointments = JSON.parse(saved);
        }
        
        // DEBUG: Add test appointment if none exist
        if (this.appointments.length === 0) {
            console.log('🧪 No hay citas, creando cita de prueba...');
            const today = new Date();
            const testDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            this.appointments.push({
                id: 'test-' + Date.now(),
                title: 'Cita de Prueba',
                description: 'Esta es una cita de prueba para verificar funcionamiento',
                date: testDate,
                time: '10:30',
                category: 'work',
                reminders: ['1hour'],
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            });
            
            this.saveAppointments();
            console.log('✅ Cita de prueba creada para hoy:', testDate);
        }
    }

    saveAppointments() {
        localStorage.setItem('cuadrante-appointments', JSON.stringify(this.appointments));
    }

    showNotification(message, type = 'info') {
        // Reuse the notification system from the main app
        if (window.cuadranteApp) {
            window.cuadranteApp.showNotification(message, type);
        }
    }

    // Get appointments for a specific date (for calendar integration)
    getAppointmentsForDate(dateString) {
        console.log('🔍 Buscando citas para fecha:', dateString);
        console.log('📋 Citas disponibles:', this.appointments.map(apt => apt.date));
        
        // El dateString viene del calendario en formato YYYY-M-D (con mes 0-11)
        // Necesitamos convertirlo al formato estándar YYYY-MM-DD
        const [year, month, day] = dateString.split('-').map(Number);
        const standardDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        console.log('🔄 Fecha convertida a formato estándar:', standardDate);
        
        const result = this.appointments.filter(apt => apt.date === standardDate);
        console.log('✅ Citas encontradas:', result);
        
        return result;
    }

    // Get upcoming appointments count
    getUpcomingCount() {
        const now = new Date();
        return this.appointments.filter(apt => {
            const aptDateTime = new Date(`${apt.date}T${apt.time}`);
            return aptDateTime >= now;
        }).length;
    }

    // DEBUG: Remove test appointments
    removeTestAppointments() {
        this.appointments = this.appointments.filter(apt => !apt.id.startsWith('test-'));
        this.saveAppointments();
        this.refreshCalendarAppointments();
        console.log('🧹 Citas de prueba eliminadas');
    }

    // Refresh calendar appointments indicators
    refreshCalendarAppointments() {
        console.log('🔄 Intentando refrescar indicadores del calendario...');
        
        const tryRefresh = () => {
            if (window.calendarManager) {
                console.log('✅ Calendar manager encontrado, refrescando...');
                window.calendarManager.generateCalendar();
            } else {
                console.log('⏳ Calendar manager no disponible aún, reintentando...');
                setTimeout(tryRefresh, 100);
            }
        };
        
        tryRefresh();
    }
}

// Initialize appointments manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.appointmentsManager = new AppointmentsManager();
    
    // DEBUG: Add global function for easy access
    window.limpiarCitasPrueba = () => {
        if (window.appointmentsManager) {
            window.appointmentsManager.removeTestAppointments();
        }
    };
    
    window.debugCitas = () => {
        if (window.appointmentsManager) {
            console.log('🔍 DEBUG - Estado de citas:');
            console.log('Total citas:', window.appointmentsManager.appointments.length);
            console.log('Citas:', window.appointmentsManager.appointments);
            console.log('Calendar manager disponible:', !!window.calendarManager);
        }
    };
    
    console.log('💡 Tips: Usa limpiarCitasPrueba() o debugCitas() en la consola');
}); 