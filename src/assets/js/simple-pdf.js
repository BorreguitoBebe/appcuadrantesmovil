// Simple PDF Export Function
window.SimplePDF = {
    exportToPDF: function(content, filename) {
        // Create HTML content for PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Cuadrante de Servicio - Guardia Civil</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #2d5016;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #2d5016;
                    }
                    .subtitle {
                        font-size: 14px;
                        margin-top: 5px;
                    }
                    .content {
                        line-height: 1.6;
                    }
                    .calendar-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .calendar-table th,
                    .calendar-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: center;
                    }
                    .calendar-table th {
                        background-color: #2d5016;
                        color: white;
                        font-weight: bold;
                    }
                    .stats-section {
                        margin-top: 30px;
                    }
                    .stats-title {
                        font-size: 16px;
                        font-weight: bold;
                        color: #2d5016;
                        margin-bottom: 10px;
                    }
                    .stats-item {
                        margin: 5px 0;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">CUADRANTE DE SERVICIO - GUARDIA CIVIL</div>
                    <div class="subtitle">${content.periodo}</div>
                </div>
                <div class="content">
                    ${content.calendar}
                    <div class="stats-section">
                        <div class="stats-title">ESTADÍSTICAS DEL PERÍODO</div>
                        ${content.stats}
                    </div>
                </div>
            </body>
            </html>
        `;

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link and click it
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.pdf', '.html');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show instruction to user
        return {
            success: true,
            message: 'Archivo HTML descargado. Para generar PDF:\n1. Abre el archivo HTML\n2. Presiona Ctrl+P\n3. Selecciona "Guardar como PDF"\n4. Guarda el archivo'
        };
    }
};

// Excel export using basic CSV
window.SimpleExcel = {
    exportToExcel: function(data, filename) {
        let csvContent = '';
        
        // Add header
        csvContent += 'Día,Fecha,Día de la Semana,Turno,Horas\n';
        
        // Add data
        data.calendar.forEach(row => {
            csvContent += row.join(',') + '\n';
        });
        
        // Add statistics
        csvContent += '\n\nESTADÍSTICAS\n';
        csvContent += 'Tipo de Turno,Cantidad,Total Horas\n';
        data.stats.forEach(row => {
            csvContent += row.join(',') + '\n';
        });
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.xlsx', '.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return {
            success: true,
            message: 'Archivo CSV descargado. Puedes abrirlo con Excel o Google Sheets.'
        };
    }
}; 