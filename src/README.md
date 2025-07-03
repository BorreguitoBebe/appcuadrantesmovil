<<<<<<< HEAD
# appcuadrantes-PWA
Aplicación para cuadrantes de la Guardia Civil versión PWA para cualquier dispositivo.
=======
# Cuadrante PWA - Guardia Civil

Una aplicación web progresiva (PWA) para gestionar cuadrantes de servicio de la Guardia Civil.

## 🚀 Características

- **Progressive Web App (PWA)**: Instalable en dispositivos móviles y escritorio
- **Funciona offline**: Gracias al service worker
- **Calendario interactivo**: Asigna turnos fácilmente con clicks
- **Estadísticas detalladas**: Análisis completo de horas y patrones de trabajo
- **Exportación**: PDF y Excel para reportes
- **Responsive**: Adaptado a todos los dispositivos
- **Colores personalizables**: Configuración de colores por turno

## 📱 Instalación

### Como PWA (Recomendado)
1. Abre la aplicación en tu navegador
2. Busca el botón "Instalar App" o el icono de instalación en la barra de direcciones
3. Sigue las instrucciones de instalación
4. La app estará disponible como aplicación nativa

### Servidor Local
1. Coloca los archivos en un servidor web (Apache, Nginx, etc.)
2. Accede a través de `http://localhost` o tu dominio
3. Para desarrollo, puedes usar: `python -m http.server 8000`

## 🎯 Uso

### Gestión de Turnos
1. **Seleccionar día**: Haz click en cualquier día del calendario
2. **Asignar turno**: Elige el turno deseado (Mañana, Tarde, Noche, Libre, Vacaciones)
3. **Navegación**: Usa las flechas para cambiar de mes

### Tipos de Turnos
- **🌅 Mañana**: 6:00 - 14:00 (8 horas)
- **🌇 Tarde**: 14:00 - 22:00 (8 horas)  
- **🌙 Noche**: 22:00 - 6:00 (8 horas)
- **🏠 Libre**: Sin servicio
- **🏖️ Vacaciones**: Período vacacional

### Estadísticas
- Resumen mensual de horas trabajadas
- Distribución de turnos por tipo
- Análisis de fines de semana
- Patrones de días consecutivos trabajados
- Gráficos visuales de distribución

### Exportación
- **PDF**: Genera un reporte en formato HTML para convertir a PDF
- **Excel**: Descarga datos en formato CSV compatible con Excel

### Configuración
- Nombre del agente
- Unidad de destino
- Personalización de colores por turno

## 🛠️ Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Diseño moderno con variables CSS
- **JavaScript ES6+**: Funcionalidad interactiva
- **Service Worker**: Funcionalidad offline
- **Web App Manifest**: Instalación PWA
- **LocalStorage**: Persistencia de datos local

## 📂 Estructura del Proyecto

```
appCuadrante-PWA/
├── index.html              # Página principal
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker
├── README.md              # Documentación
├── css/
│   └── styles.css         # Estilos principales
├── js/
│   ├── app.js             # Lógica principal
│   ├── calendar.js        # Gestión del calendario
│   ├── stats.js           # Cálculo de estadísticas
│   └── pwa.js             # Funcionalidad PWA
└── assets/
    ├── js/
    │   └── simple-pdf.js  # Exportación PDF/Excel
    └── src/
        ├── BannerGC.png   # Banner Guardia Civil
        ├── EscudoGc.svg   # Escudo oficial
        ├── FondoCuadrantes.jpg # Fondo
        └── iconoGC.ico.ico # Icono de la aplicación
```

## 💾 Almacenamiento de Datos

Los datos se almacenan localmente en el navegador:
- **cuadrante-data**: Información de turnos del calendario
- **cuadrante-config**: Configuración personalizada del usuario

## 🔧 Desarrollo

### Requisitos
- Navegador moderno con soporte para ES6+
- Servidor web (para service worker)

### Comandos útiles
```bash
# Servidor de desarrollo con Python
python -m http.server 8000

# Servidor con Node.js (si tienes http-server instalado)
npx http-server -p 8000

# Servidor con PHP
php -S localhost:8000
```

## 🚨 Funcionalidades Offline

Gracias al service worker, la aplicación funciona sin conexión:
- ✅ Visualización del calendario
- ✅ Asignación de turnos
- ✅ Cálculo de estadísticas
- ✅ Configuración personal
- ❌ Exportación (requiere conexión para descargas)

## 🔐 Seguridad y Privacidad

- Todos los datos se almacenan localmente
- No se envía información a servidores externos
- Compatible con políticas de privacidad institucionales

## 📱 Compatibilidad

### Navegadores
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Dispositivos
- ✅ Escritorio (Windows, Mac, Linux)
- ✅ Móviles (Android, iOS)
- ✅ Tablets

## 🆘 Solución de Problemas

### La app no se instala
- Verifica que estés usando HTTPS o localhost
- Asegúrate de que el manifest.json es válido
- Revisa la consola del navegador para errores

### Los datos no se guardan
- Verifica que el navegador permita localStorage
- Comprueba que no estés en modo incógnito
- Revisa el espacio de almacenamiento disponible

### Las exportaciones no funcionan
- Asegúrate de tener conexión a internet
- Verifica que el navegador permita descargas
- Revisa los permisos de descarga

## 👥 Contribuir

Este proyecto fue desarrollado para uso interno de la Guardia Civil. Para mejoras o sugerencias, contacta con el departamento de sistemas.

## 📄 Licencia

Uso interno - Guardia Civil de España

---

**Versión**: 1.0.0  
**Última actualización**: 2024  
**Desarrollado para**: Guardia Civil de España 
>>>>>>> 0bc8f08 (Aplicación APPCuadrantes en PWA funcionando)
