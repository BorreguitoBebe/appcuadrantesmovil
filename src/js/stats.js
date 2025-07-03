// Statistics Manager para Cuadrante PWA
class StatsManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Stats Manager inicializado');
        this.updateStats();
    }

    updateStats() {
        const statsContainer = document.getElementById('stats-content');
        if (!statsContainer) {
            console.log('❌ Stats container not found');
            return;
        }

        const monthData = this.getCurrentMonthData();
        const stats = this.calculateStats(monthData);
        
        statsContainer.innerHTML = this.renderStats(stats);
    }

    getCurrentMonthData() {
        // Usar los datos filtrados del calendar manager para el período activo
        if (!window.calendarManager) {
            console.log('❌ CalendarManager not found');
            return {};
        }
        return window.calendarManager.getCurrentMonthData();
    }

    calculateStats(monthData) {
        const stats = {
            shifts: {
                M: 0,      // Mañana
                T: 0,      // Tarde
                N: 0,      // Noche
                MN: 0,     // Mañana y Noche
                SN: 0,     // Saliente Nocturno
                AP: 0,     // Asunto Propio
                ASC: 0,    // Día Asociativo
                DAS: 0,    // Descanso Singularizado
                DF: 0,     // Descanso Festivo
                IND: 0,    // Indispuesto
                B: 0,      // Baja
                V: 0,      // Vacaciones
                D: 0       // Descanso
            },
            totalDays: 0,
            workingDays: 0,
            totalHours: 0,
            averageHoursPerDay: 0,
            weekends: {
                working: 0,
                free: 0
            },
            consecutive: {
                maxWorking: 0,
                maxFree: 0,
                currentWorking: 0,
                currentFree: 0
            }
        };

        // Get current month info
        const currentDate = new Date();
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        
        stats.totalDays = daysInMonth;

        // Analyze each day
        const sortedDates = Object.keys(monthData).sort();
        let consecutiveWorking = 0;
        let consecutiveFree = 0;

        sortedDates.forEach(dateString => {
            const dayData = monthData[dateString];
            const shift = dayData.shift;
            const date = new Date(dateString);
            const dayOfWeek = date.getDay();

            // Count shifts
            if (stats.shifts.hasOwnProperty(shift)) {
                stats.shifts[shift]++;
            }

            // Count working days and hours - SOLO M, T, N, MN son días trabajados
            if (shift === 'M' || shift === 'T' || shift === 'N' || shift === 'MN') {
                // Para MN contamos como 2 servicios
                if (shift === 'MN') {
                    stats.workingDays += 2; // MN cuenta como 2 servicios
                } else {
                    stats.workingDays++;
                }
                
                // Solo contar horas de turnos de trabajo (M, T, N, MN)
                stats.totalHours += this.getShiftHours(shift);
                
                // Weekend working
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    stats.weekends.working++;
                }

                // Consecutive working days
                consecutiveWorking++;
                consecutiveFree = 0;
                stats.consecutive.maxWorking = Math.max(stats.consecutive.maxWorking, consecutiveWorking);
            } else {
                // Weekend free
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    stats.weekends.free++;
                }

                // Consecutive free days
                consecutiveFree++;
                consecutiveWorking = 0;
                stats.consecutive.maxFree = Math.max(stats.consecutive.maxFree, consecutiveFree);
            }
        });

        // Calculate averages - usar días reales en lugar de servicios para el promedio
        const realWorkingDays = stats.shifts.M + stats.shifts.T + stats.shifts.N + stats.shifts.MN;
        stats.averageHoursPerDay = realWorkingDays > 0 ? (stats.totalHours / realWorkingDays).toFixed(1) : 0;
        stats.consecutive.currentWorking = consecutiveWorking;
        stats.consecutive.currentFree = consecutiveFree;

        return stats;
    }

    getShiftHours(shift) {
        const hours = {
            'M': 8,        // Mañana
            'T': 8,        // Tarde
            'N': 8,        // Noche
            'MN': 16,      // Mañana y Noche (doble turno)
            'SN': 0,       // Saliente Nocturno - NO suma horas
            'AP': 0,       // Asunto Propio - NO suma horas
            'ASC': 0,      // Día Asociativo - NO suma horas
            'DAS': 0,      // Descanso Singularizado - NO suma horas
            'DF': 0,       // Descanso Festivo - NO suma horas
            'IND': 0,      // Indispuesto - NO suma horas
            'B': 0,        // Baja - NO suma horas
            'V': 0,        // Vacaciones - NO suma horas
            'D': 0         // Descanso - NO suma horas
        };
        return hours[shift] || 0;
    }

    renderStats(stats) {
        const weeklyStats = this.calculateWeeklyStats();
        const periodInfo = this.getCurrentPeriodInfo();
        
        let periodHTML = '';
        if (periodInfo) {
            const fechaInicioStr = periodInfo.inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const fechaFinStr = periodInfo.fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            periodHTML = `
                <div class="stat-item">
                    <span class="stat-label">Período del cuadrante:</span>
                    <span class="stat-value">${fechaInicioStr} - ${fechaFinStr}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Semanas completas:</span>
                    <span class="stat-value">${periodInfo.semanas}</span>
                </div>
            `;
        }

        return `
            <div class="stat-card">
                <h3>📊 Resumen del Período</h3>
                ${periodHTML}
                <div class="stat-item">
                    <span class="stat-label">Servicios trabajados:</span>
                    <span class="stat-value">${stats.workingDays} (MN = 2 servicios)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total de horas trabajadas:</span>
                    <span class="stat-value">${stats.totalHours}h</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Promedio horas/día:</span>
                    <span class="stat-value">${stats.averageHoursPerDay}h</span>
                </div>
            </div>

            ${this.renderWeeklyStats(weeklyStats)}

            <div class="stat-card">
                <h3>🕐 Turnos de Trabajo</h3>
                <div class="stat-item">
                    <span class="stat-label">🌅 M - Mañana (6:00-14:00):</span>
                    <span class="stat-value">${stats.shifts.M} días (${stats.shifts.M * 8}h)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🌇 T - Tarde (14:00-22:00):</span>
                    <span class="stat-value">${stats.shifts.T} días (${stats.shifts.T * 8}h)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🌙 N - Noche (22:00-6:00):</span>
                    <span class="stat-value">${stats.shifts.N} días (${stats.shifts.N * 8}h)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🌅🌙 MN - Mañana y Noche:</span>
                    <span class="stat-value">${stats.shifts.MN} días (${stats.shifts.MN * 16}h)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🌅 SN - Saliente Nocturno:</span>
                    <span class="stat-value">${stats.shifts.SN} días</span>
                </div>
            </div>

            <div class="stat-card">
                <h3>📋 Situaciones Especiales (No computan horas)</h3>
                <div class="stat-item">
                    <span class="stat-label">👤 AP - Asunto Propio:</span>
                    <span class="stat-value">${stats.shifts.AP} días</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🏛️ ASC - Día Asociativo:</span>
                    <span class="stat-value">${stats.shifts.ASC} días</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">📅 DAS - Descanso Singularizado:</span>
                    <span class="stat-value">${stats.shifts.DAS} días</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🎉 DF - Descanso Festivo:</span>
                    <span class="stat-value">${stats.shifts.DF} días</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🤒 IND - Indispuesto:</span>
                    <span class="stat-value">${stats.shifts.IND} días</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🏥 B - Baja:</span>
                    <span class="stat-value">${stats.shifts.B} días</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🏖️ V - Vacaciones:</span>
                    <span class="stat-value">${stats.shifts.V} días</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🏠 D - Descanso:</span>
                    <span class="stat-value">${stats.shifts.D} días</span>
                </div>
            </div>

            ${this.renderChart(stats)}

            <!-- Próximas Citas -->
            ${this.getAppointmentsStats()}
        `;
    }

    getCurrentPeriodInfo() {
        // Usar el período calculado del calendar manager (calendario activo)
        if (!window.calendarManager || !window.calendarManager.currentPeriod) {
            console.log('❌ CalendarManager or current period not found');
            // Fallback al mes actual si no hay datos
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            const inicio = new Date(year, month, 1);
            const fin = new Date(year, month + 1, 0);
            const semanas = Math.ceil(fin.getDate() / 7);
            
            return { inicio, fin, semanas };
        }
        
        const period = window.calendarManager.currentPeriod;
        
        return {
            inicio: period.inicio,
            fin: period.fin,
            semanas: period.semanas
        };
    }

    calculateWeeklyStats() {
        const periodInfo = this.getCurrentPeriodInfo();
        if (!periodInfo) {
            return [];
        }

        // Usar período del calendario activo

        const weeks = [];
        const fechaInicio = new Date(periodInfo.inicio);
        const fechaFin = new Date(periodInfo.fin);
        
        // Iterate through complete weeks (Monday to Sunday)
        let fechaActual = new Date(fechaInicio);
        
        while (fechaActual <= fechaFin) {
            const semanaActual = [];
            const fechaInicioSemana = new Date(fechaActual);
            
            // Create a complete week (7 days)
            for (let i = 0; i < 7; i++) {
                if (fechaActual <= fechaFin) {
                    const fechaId = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}-${fechaActual.getDate()}`;
                    const shiftData = window.cuadranteApp?.calendarData?.[fechaId];
                    const shift = shiftData?.shift || 'D';
                    
                    semanaActual.push({
                        fecha: new Date(fechaActual),
                        fechaId: fechaId,
                        shift: shift
                    });
                    
                    fechaActual.setDate(fechaActual.getDate() + 1);
                }
            }
            
            if (semanaActual.length > 0) {
                const totalHours = semanaActual.reduce((total, day) => {
                    return total + this.getShiftHours(day.shift);
                }, 0);
                
                // Contar días de situaciones especiales que reducen el objetivo
                const diasEspeciales = semanaActual.filter(day => 
                    ['V', 'B', 'DAS', 'DF', 'IND', 'AP', 'ASC'].includes(day.shift)
                ).length;
                
                // Calcular objetivo ajustado: 37.5h - (7.5h × días especiales)
                const objetivoAjustado = 37.5 - (diasEspeciales * 7.5);
                
                const firstDay = semanaActual[0].fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                const lastDay = semanaActual[semanaActual.length - 1].fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                
                weeks.push({
                    dateRange: `${firstDay} - ${lastDay}`,
                    totalHours: totalHours,
                    days: semanaActual,
                    objective: objetivoAjustado,
                    difference: totalHours - objetivoAjustado,
                    diasEspeciales: diasEspeciales // Para información adicional
                });
            }
        }
        
        return weeks;
    }

    renderWeeklyStats(weeklyStats) {
        if (!weeklyStats || weeklyStats.length === 0) {
            return `
                <div class="stat-card">
                    <h3>📅 Desglose Semanal</h3>
                    <p>No hay datos de semanas disponibles.</p>
                </div>
            `;
        }

        let html = `
            <div class="stat-card">
                <h3>📅 Desglose Semanal (Objetivo: 37.5h base, ajustado por situaciones especiales)</h3>
                <div class="weekly-breakdown">
        `;

        weeklyStats.forEach((week, index) => {
            const statusClass = week.difference === 0 ? 'exact' : week.difference > 0 ? 'excess' : 'deficit';
            const statusIcon = week.difference === 0 ? '✅' : week.difference > 0 ? '⚠️' : '❌';
            const statusText = week.difference === 0 ? 'Exacto' : 
                              week.difference > 0 ? `Exceso: +${week.difference.toFixed(1)}h` : 
                              `Déficit: ${week.difference.toFixed(1)}h`;
            
            // Información adicional sobre días especiales
            const diasEspecialesInfo = week.diasEspeciales > 0 ? 
                ` (Objetivo ajustado: ${week.objective.toFixed(1)}h por ${week.diasEspeciales} día${week.diasEspeciales > 1 ? 's' : ''} especial${week.diasEspeciales > 1 ? 'es' : ''})` : 
                '';
            
            html += `
                <div class="week-item ${statusClass}">
                    <div class="week-header">
                        <span class="week-title">Semana ${index + 1}: ${week.dateRange}${diasEspecialesInfo}</span>
                        <span class="week-hours">${week.totalHours.toFixed(1)}h</span>
                    </div>
                    <div class="week-status">
                        <span class="status-icon">${statusIcon}</span>
                        <span class="status-text">${statusText}</span>
                    </div>
                </div>
            `;
        });

        // Add summary
        const totalHours = weeklyStats.reduce((sum, week) => sum + week.totalHours, 0);
        const totalObjective = weeklyStats.reduce((sum, week) => sum + week.objective, 0);
        const totalDifference = totalHours - totalObjective;
        const overallStatusClass = totalDifference === 0 ? 'exact' : totalDifference > 0 ? 'excess' : 'deficit';
        const overallStatusIcon = totalDifference === 0 ? '✅' : totalDifference > 0 ? '⚠️' : '❌';
        const overallStatusText = totalDifference === 0 ? 'Exacto según normativa' : 
                                 totalDifference > 0 ? `Exceso total: +${totalDifference.toFixed(1)}h` : 
                                 `Déficit total: ${totalDifference.toFixed(1)}h`;

        html += `
                    <div class="week-summary ${overallStatusClass}">
                        <div class="summary-header">
                            <span class="summary-title">📊 RESUMEN TOTAL DEL PERÍODO</span>
                        </div>
                        <div class="summary-content">
                            <div class="summary-item">
                                <span>Semanas completas:</span>
                                <span>${weeklyStats.length}</span>
                            </div>
                            <div class="summary-item">
                                <span>Horas objetivo:</span>
                                <span>${totalObjective.toFixed(1)}h</span>
                            </div>
                            <div class="summary-item">
                                <span>Horas trabajadas:</span>
                                <span>${totalHours.toFixed(1)}h</span>
                            </div>
                            <div class="summary-item status-summary">
                                <span class="status-icon">${overallStatusIcon}</span>
                                <span class="status-text">${overallStatusText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    renderChart(stats) {
        const total = stats.shifts.M + stats.shifts.T + stats.shifts.N + stats.shifts.MN + 
                     stats.shifts.SN + stats.shifts.AP + stats.shifts.ASC + stats.shifts.DAS + 
                     stats.shifts.DF + stats.shifts.IND + stats.shifts.B + stats.shifts.V + stats.shifts.D;
        
        if (total === 0) {
            return `
                <div class="stat-card">
                    <h3>📊 Gráfico de Distribución</h3>
                    <p>No hay datos para mostrar el gráfico.</p>
                </div>
            `;
        }

        const getPercentage = (value) => ((value / total) * 100).toFixed(1);
        
        return `
            <div class="stat-card">
                <h3>📊 Gráfico de Distribución</h3>
                <div class="chart-container">
                    <div class="chart-bar">
                        <div class="chart-label">M - Mañana</div>
                        <div class="chart-progress">
                            <div class="chart-fill" style="width: ${getPercentage(stats.shifts.M)}%; background-color: #2d5016;"></div>
                        </div>
                        <div class="chart-value">${getPercentage(stats.shifts.M)}%</div>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-label">T - Tarde</div>
                        <div class="chart-progress">
                            <div class="chart-fill" style="width: ${getPercentage(stats.shifts.T)}%; background-color: #FF9800;"></div>
                        </div>
                        <div class="chart-value">${getPercentage(stats.shifts.T)}%</div>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-label">N - Noche</div>
                        <div class="chart-progress">
                            <div class="chart-fill" style="width: ${getPercentage(stats.shifts.N)}%; background-color: #2196F3;"></div>
                        </div>
                        <div class="chart-value">${getPercentage(stats.shifts.N)}%</div>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-label">MN - Doble</div>
                        <div class="chart-progress">
                            <div class="chart-fill" style="width: ${getPercentage(stats.shifts.MN)}%; background: linear-gradient(45deg, #2d5016 50%, #2196F3 50%);"></div>
                        </div>
                        <div class="chart-value">${getPercentage(stats.shifts.MN)}%</div>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-label">V - Vacaciones</div>
                        <div class="chart-progress">
                            <div class="chart-fill" style="width: ${getPercentage(stats.shifts.V)}%; background-color: #10b981;"></div>
                        </div>
                        <div class="chart-value">${getPercentage(stats.shifts.V)}%</div>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-label">D - Descanso</div>
                        <div class="chart-progress">
                            <div class="chart-fill" style="width: ${getPercentage(stats.shifts.D)}%; background-color: #9E9E9E;"></div>
                        </div>
                        <div class="chart-value">${getPercentage(stats.shifts.D)}%</div>
                    </div>
                </div>
            </div>
        `;
    }

    getAppointmentsStats() {
        if (!window.appointmentsManager) {
            return `
                <div class="stat-card">
                    <h3>🔔 Próximas Citas</h3>
                    <p>Sistema de citas no disponible.</p>
                </div>
            `;
        }

        const now = new Date();
        const upcomingAppointments = window.appointmentsManager.appointments.filter(apt => {
            const aptDateTime = new Date(`${apt.date}T${apt.time}`);
            return aptDateTime >= now;
        }).sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        const todayAppointments = window.appointmentsManager.appointments.filter(apt => {
            return apt.date === now.toISOString().split('T')[0];
        });

        if (upcomingAppointments.length === 0 && todayAppointments.length === 0) {
            return `
                <div class="stat-card">
                    <h3>🔔 Próximas Citas</h3>
                    <div class="stat-item">
                        <span class="stat-label">No hay citas próximas</span>
                        <button onclick="window.cuadranteApp.showSection('appointments')" class="btn-appointments">
                            Crear cita
                        </button>
                    </div>
                </div>
            `;
        }

        let html = `
            <div class="stat-card">
                <h3>🔔 Próximas Citas</h3>
                <div class="stat-item">
                    <span class="stat-label">Total próximas:</span>
                    <span class="stat-value">${upcomingAppointments.length}</span>
                </div>
        `;

        if (todayAppointments.length > 0) {
            html += `
                <div class="stat-item highlight">
                    <span class="stat-label">🔥 Hoy:</span>
                    <span class="stat-value">${todayAppointments.length} cita${todayAppointments.length > 1 ? 's' : ''}</span>
                </div>
            `;
        }

        // Show next 3 appointments
        const nextAppointments = upcomingAppointments.slice(0, 3);
        
        if (nextAppointments.length > 0) {
            html += `<div class="next-appointments">`;
            nextAppointments.forEach(apt => {
                const aptDate = new Date(`${apt.date}T${apt.time}`);
                const isToday = apt.date === now.toISOString().split('T')[0];
                const formattedDate = isToday ? 'Hoy' : aptDate.toLocaleDateString('es-ES', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                });
                
                const categoryIcons = {
                    personal: '👤',
                    work: '💼',
                    medical: '🏥',
                    legal: '⚖️',
                    training: '📚',
                    other: '📌'
                };

                html += `
                    <div class="appointment-preview ${isToday ? 'today' : ''}" 
                         onclick="window.cuadranteApp.showSection('appointments')">
                        <div class="appointment-preview-header">
                            <span class="preview-icon">${categoryIcons[apt.category] || '📌'}</span>
                            <span class="preview-title">${apt.title}</span>
                        </div>
                        <div class="appointment-preview-time">
                            ${formattedDate} • ${apt.time}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `
                <div class="stat-item">
                    <button onclick="window.cuadranteApp.showSection('appointments')" class="btn-appointments">
                        Ver todas las citas
                    </button>
                </div>
            </div>
        `;

        return html;
    }

    generateStatsHTML() {
        const monthData = this.getCurrentMonthData();
        const stats = this.calculateStats(monthData);
        
        let html = '<div class="stats-summary">';
        html += `<h3>ESTADÍSTICAS DEL PERÍODO</h3>`;
        html += `<p><strong>Total de horas trabajadas:</strong> ${stats.totalHours} horas</p>`;
        html += `<p><strong>Servicios trabajados:</strong> ${stats.workingDays} servicios</p>`;
        html += `<p><strong>Turnos de mañana (M):</strong> ${stats.shifts.M} días</p>`;
        html += `<p><strong>Turnos de tarde (T):</strong> ${stats.shifts.T} días</p>`;
        html += `<p><strong>Turnos de noche (N):</strong> ${stats.shifts.N} días</p>`;
        html += `<p><strong>Turnos dobles (MN):</strong> ${stats.shifts.MN} días</p>`;
        html += `<p><strong>Asuntos propios (AP):</strong> ${stats.shifts.AP} días</p>`;
        html += `<p><strong>Días asociativos (ASC):</strong> ${stats.shifts.ASC} días</p>`;
        html += `<p><strong>Bajas (B):</strong> ${stats.shifts.B} días</p>`;
        html += `<p><strong>Vacaciones (V):</strong> ${stats.shifts.V} días</p>`;
        html += `<p><strong>Descansos (D):</strong> ${stats.shifts.D} días</p>`;
        html += '</div>';
        
        return html;
    }

    generateStatsData() {
        const monthData = this.getCurrentMonthData();
        const stats = this.calculateStats(monthData);
        
        return [
            ['Turnos de Mañana (M)', stats.shifts.M, stats.shifts.M * 8],
            ['Turnos de Tarde (T)', stats.shifts.T, stats.shifts.T * 8],
            ['Turnos de Noche (N)', stats.shifts.N, stats.shifts.N * 8],
            ['Turnos Dobles (MN)', stats.shifts.MN, stats.shifts.MN * 16],
            ['Saliente Nocturno (SN)', stats.shifts.SN, 0],
            ['Asunto Propio (AP)', stats.shifts.AP, 0],
            ['Día Asociativo (ASC)', stats.shifts.ASC, 0],
            ['Descanso Singularizado (DAS)', stats.shifts.DAS, 0],
            ['Descanso Festivo (DF)', stats.shifts.DF, 0],
            ['Indispuesto (IND)', stats.shifts.IND, 0],
            ['Baja (B)', stats.shifts.B, 0],
            ['Vacaciones (V)', stats.shifts.V, 0],
            ['Descansos (D)', stats.shifts.D, 0],
            ['TOTAL SERVICIOS TRABAJADOS', '', stats.workingDays],
            ['TOTAL HORAS TRABAJADAS', '', stats.totalHours]
        ];
    }
}

// Add chart styles and weekly stats styles
const chartStyles = document.createElement('style');
chartStyles.textContent = `
    .chart-container {
        margin-top: 1rem;
    }
    
    .chart-bar {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
        gap: 1rem;
    }
    
    .chart-label {
        min-width: 80px;
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .chart-progress {
        flex: 1;
        height: 20px;
        background-color: #f0f0f0;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
    }
    
    .chart-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.5s ease;
        position: relative;
    }
    
    .chart-value {
        min-width: 50px;
        text-align: right;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--primary-color);
    }
    
    .weekly-breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1rem;
    }
    
    .week-item {
        padding: 0.75rem;
        border-radius: 8px;
        border-left: 4px solid;
    }
    
    .week-item.exact {
        background: #f0fdf4;
        border-left-color: #22c55e;
    }
    
    .week-item.excess {
        background: #fef3c7;
        border-left-color: #f59e0b;
    }
    
    .week-item.deficit {
        background: #fef2f2;
        border-left-color: #ef4444;
    }
    
    .week-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .week-title {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .week-hours {
        font-weight: 700;
        color: var(--primary-color);
    }
    
    .week-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .status-icon {
        font-size: 1.1rem;
    }
    
    .status-text {
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .week-summary {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 8px;
        border: 2px solid;
    }
    
    .week-summary.exact {
        background: #f0fdf4;
        border-color: #22c55e;
    }
    
    .week-summary.excess {
        background: #fef3c7;
        border-color: #f59e0b;
    }
    
    .week-summary.deficit {
        background: #fef2f2;
        border-color: #ef4444;
    }
    
    .summary-header {
        margin-bottom: 0.75rem;
    }
    
    .summary-title {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--text-primary);
    }
    
    .summary-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
    }
    
    .summary-item.status-summary {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(0,0,0,0.1);
        font-weight: 600;
    }
`;
document.head.appendChild(chartStyles);

// Initialize stats when DOM is loaded and both cuadranteApp and calendarManager are available
document.addEventListener('DOMContentLoaded', () => {
    // Wait for both cuadranteApp and calendarManager to be initialized
    const initStatsManager = () => {
        if (window.cuadranteApp && window.calendarManager) {
            window.statsManager = new StatsManager();
            console.log('✅ Stats Manager initialized');
        } else {
            console.log('⏳ Waiting for cuadranteApp and calendarManager...');
            setTimeout(initStatsManager, 100);
        }
    };
    initStatsManager();
}); 