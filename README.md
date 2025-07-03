# 🚔 Cuadrante PWA - Guardia Civil

Una aplicación web progresiva (PWA) completa para la gestión de cuadrantes de servicio de la Guardia Civil, con capacidades móviles nativas a través de Capacitor.

[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://web.dev/progressive-web-apps/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Ready-blue.svg)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-Internal_Use-yellow.svg)]()

## 🎯 Características Principales

### 🗓️ Gestión Avanzada de Turnos
- **13 tipos de turno** organizados por categorías
- **Validaciones normativas** automáticas en tiempo real
- **Períodos de semanas completas** con cálculo inteligente
- **Modo selección múltiple** para asignación masiva
- **Acciones rápidas** (semana completa, rangos, limpieza)

### 📱 Aplicación Multiplataforma
- **PWA instalable** en cualquier dispositivo
- **Apps nativas** para Android e iOS (via Capacitor)
- **Funcionamiento offline** completo
- **Diseño responsive** adaptado a todos los tamaños

### 📊 Análisis y Reportes
- **Estadísticas semanales** con objetivos de 37.5h
- **Indicadores de cumplimiento** normativo
- **Exportación PDF/Excel** profesional
- **Backup automático** de datos

### ⚡ Funcionalidades Avanzadas
- **Descanso semanal automático** 
- **Validación de turnos consecutivos**
- **Notificaciones inteligentes**
- **Gestión de citas y recordatorios**
- **Configuración personalizable**

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **PWA**: Service Worker, Web App Manifest
- **Móvil**: Capacitor 7.x
- **Almacenamiento**: LocalStorage, IndexedDB
- **Exportación**: PDF/Excel generation
- **Plataformas**: Web, Android, iOS

## 📋 Tipos de Turno Disponibles

### 🌅 Turnos de Trabajo (8h)
- **M** - Mañana (6:00-14:00)
- **T** - Tarde (14:00-22:00)
- **N** - Noche (22:00-6:00)
- **MN** - Mañana y Noche (16h)

### ⚡ Situaciones Especiales (7.5h)
- **SN** - Saliente Nocturno
- **AP** - Asunto Propio
- **ASC** - Día Asociativo
- **DAS** - Descanso Singularizado
- **DF** - Descanso Festivo
- **IND** - Indispuesto
- **B** - Baja
- **V** - Vacaciones

### 🏠 Descanso (0h)
- **D** - Descanso

## 🚀 Instalación y Uso

### Como PWA (Recomendado)
```bash
# Servidor local con Python
python -m http.server 8000

# Servidor local con Node.js
npx http-server -p 8000

# Acceder a http://localhost:8000
```

1. Abre la aplicación en tu navegador
2. Busca el botón "Instalar App" 
3. Sigue las instrucciones de instalación
4. ¡La app estará disponible como aplicación nativa!

### Desarrollo de Apps Móviles
```bash
# Instalar dependencias
npm install

# Sincronizar con plataformas móviles
npx cap sync

# Abrir en Android Studio
npx cap open android

# Abrir en Xcode
npx cap open ios
```

## 📱 Guía de Uso

### Modo Normal (Clic Simple)
1. Selecciona un tipo de turno de la lista
2. Haz clic en un día del calendario
3. El turno se aplica automáticamente con validaciones

### Modo Selección Múltiple
1. Activa el **switch "Selección Múltiple"**
2. Selecciona el tipo de turno deseado
3. Haz clic en varios días para seleccionarlos
4. Usa **"Aplicar a Seleccionados"** para aplicar el turno

### Acciones Rápidas
- **📅 Semana Completa**: Aplicar turno a toda una semana
- **🧹 Limpiar Semana**: Eliminar turnos de una semana completa
- **📏 Selección por Rango**: Seleccionar días entre dos fechas

## 🔧 Validaciones Normativas

### Restricciones Automáticas
- **Bloqueo ASC** en fines de semana (sábados/domingos)
- **Validación turnos nocturnos**: tras N/MN solo SN, N, MN o D
- **Aviso de dobletes**: T→M genera advertencia (no bloquea)

### Descanso Semanal Automático
- **Detección automática** de semanas con días no disponibles
- **Asignación automática** de descanso en sábado y domingo
- **Logging detallado** del proceso

## 📊 Estructura del Proyecto

```
appcuadrantemovil/
├── src/                          # Código fuente de la PWA
│   ├── index.html               # Página principal
│   ├── manifest.json            # Configuración PWA
│   ├── sw.js                    # Service Worker
│   ├── css/
│   │   └── styles.css          # Estilos principales
│   ├── js/
│   │   ├── app.js              # Lógica principal
│   │   ├── calendar.js         # Gestión del calendario
│   │   ├── stats.js            # Estadísticas
│   │   ├── appointments.js     # Citas y recordatorios
│   │   ├── backup.js           # Gestión de backups
│   │   └── pwa.js              # Funcionalidad PWA
│   └── assets/
│       ├── js/
│       │   └── simple-pdf.js   # Exportación PDF/Excel
│       └── src/
│           ├── BannerGC.png    # Recursos gráficos
│           ├── EscudoGc.svg    # Escudo oficial
│           └── iconoGC.ico.ico # Icono de la app
├── android/                     # Proyecto Android (Capacitor)
├── ios/                        # Proyecto iOS (Capacitor)
├── package.json                # Configuración del proyecto
├── capacitor.config.json       # Configuración Capacitor
└── README.md                   # Este archivo
```

## 💾 Almacenamiento de Datos

Los datos se almacenan localmente para garantizar la privacidad:

- **cuadrante-data**: Información de turnos del calendario
- **cuadrante-config**: Configuración personalizada del usuario
- **cuadrante-appointments**: Citas y recordatorios
- **cuadrante-backup**: Backups automáticos

## 🔒 Seguridad y Privacidad

- ✅ **Todos los datos se almacenan localmente**
- ✅ **No se envía información a servidores externos**
- ✅ **Compatible con políticas de privacidad institucionales**
- ✅ **Funciona completamente offline**

## 🌐 Compatibilidad

### Navegadores
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Dispositivos
- ✅ Escritorio (Windows, Mac, Linux)
- ✅ Móviles (Android 7+, iOS 13+)
- ✅ Tablets

### Funcionalidades Offline
- ✅ Visualización del calendario
- ✅ Asignación de turnos
- ✅ Cálculo de estadísticas
- ✅ Configuración personal
- ✅ Gestión de citas
- ✅ Backup y restauración

## 🆘 Solución de Problemas

### La app no se instala como PWA
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

### Problemas con las apps móviles
```bash
# Limpiar y reconstruir
npx cap clean
npx cap sync
```

## 📈 Próximas Mejoras

- [ ] Sincronización entre dispositivos
- [ ] Notificaciones push
- [ ] Integración con calendarios externos
- [ ] Modo oscuro
- [ ] Exportación a Google Calendar
- [ ] API para integración con sistemas externos

## 👥 Contribuir

Este proyecto fue desarrollado para uso interno de la Guardia Civil. Para mejoras o sugerencias:

1. Crear un issue describiendo la mejora
2. Fork del repositorio
3. Crear una rama para la nueva funcionalidad
4. Realizar los cambios y tests
5. Crear un Pull Request

## 📄 Licencia

**Uso Interno - Guardia Civil de España**

Este software es de uso exclusivo para personal de la Guardia Civil y no debe ser distribuido fuera de la institución.

---

**Versión**: 1.0.0  
**Última actualización**: 2024  
**Desarrollado para**: Guardia Civil de España  
**Tecnologías**: PWA + Capacitor  
**Estado**: ✅ Funcionalidades Completas

## 🔗 Enlaces Útiles

- [Documentación de Funcionalidades](src/FUNCIONALIDADES_COMPLETAS.md)
- [Test de Reglas](src/test_reglas.html)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [PWA Guidelines](https://web.dev/progressive-web-apps/) 