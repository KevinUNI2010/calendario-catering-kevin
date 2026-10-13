# 01. FICHA TÉCNICA Y RESUMEN EJECUTIVO
## Sistema Web de Gestión de Calendario y Catering para Locales

---

### 1. INFORMACIÓN GENERAL DEL PROYECTO

| Campo | Detalle |
| :--- | :--- |
| **Nombre del Sistema:** | Calendario de Locales y Gestión de Catering |
| **Responsable del Proyecto:** | Kevin Zambrano |
| **Tipo de Proyecto:** | Plataforma Web Empresarial SPA (Single Page Application) |
| **Versión:** | 1.0.0 (Producción) |
| **Fecha de Emisión:** | Octubre de 2026 |
| **Huso Horario Base:** | Hora Oficial de Perú (`America/Lima`, UTC-5) |
| **Arquitectura de Despliegue:** | Frontend en Vercel Edge + Base de Datos en Supabase (PostgreSQL Cloud) |

---

### 2. RESUMEN EJECUTIVO

El **Sistema de Gestión de Calendario y Catering para Locales** nace como una solución integral para resolver los desafíos operativos en la coordinación de eventos, despacho de alimentos y asignación de turnos entre la cocina central y los diversos locales de la empresa.

Antes de esta solución, la coordinación de raciones y turnos se realizaba por canales informales o planillas descentralizadas, lo que provocaba:
* Descoordinación en los horarios de entrega.
* Errores en la cantidad de raciones y menús requeridos por sede.
* Desfases de huso horario al registrar fechas.
* Dificultades para que cada local visualice únicamente lo que le compete.

Con esta plataforma, la empresa centraliza la toma de decisiones, automatiza el cálculo de raciones y asegura que cada involucrado (Administración, Cocina y Locales) consulte la información precisa en tiempo real.

---

### 3. BENEFICIOS CLAVE PARA EL NEGOCIO

1. **Ahorro de Costos y Cero Desperdicio:**
   * Gracias al **Resumen Mensual**, el área de cocina conoce con antelación el volumen exacto de platos diarios clasificados por sede y menú, optimizando las compras y reduciendo mermas de insumos.
2. **Privacidad y Visualización Segura por Local:**
   * Cada sede o cliente solo accede mediante un **PIN de 4 dígitos** a sus propios turnos y despachos, impidiendo que terceros vean información comercial de otros locales.
3. **Disponibilidad 24/7 en la Nube:**
   * La aplicación es accesible desde cualquier navegador web (computadoras de escritorio, tablets y smartphones) sin requerir instalación previa.
4. **Sincronización en Tiempo Real:**
   * Cualquier cambio realizado por la administración (actualización de hora, cambio de menú o nuevo turno) se refleja instantáneamente en las pantallas de los locales.
5. **Fiabilidad Horaria Peruana:**
   * Los componentes de fecha y hora respetan estrictamente la hora peruana (UTC-5), eliminando los típicos errores de "cambio de día" a partir de las 19:00 horas ocasionados por servidores UTC internacionales.

---

### 4. ESPECIFICACIONES TÉCNICAS (STACK TECNOLÓGICO)

```
┌────────────────────────────────────────────────────────┐
│                   CAPA DE USUARIO                      │
│   React 19  •  TypeScript 5.8  •  Tailwind CSS Modern   │
│   Diseño Adaptativo (Escritorio, Tablet y Celular)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 INFRAESTRUCTURA CLOUD                  │
│   • Vercel Edge Network (Hosting de Alto Rendimiento)  │
│   • Google OAuth 2.0 (Autenticación de Administrador)  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│               BASE DE DATOS Y SEGURIDAD                │
│   • Supabase Cloud (PostgreSQL Gestionado)             │
│   • Row Level Security (RLS) en todas las tablas       │
│   • Procedimiento Almacenado verify_client_pin() (RPC) │
│   • Extensiones Criptográficas: pgcrypto (SHA-256)     │
└────────────────────────────────────────────────────────┘
```

---

### 5. MATRIZ DE MÓDULOS DEL SISTEMA

| Módulo | Descripción | Usuarios Destino |
| :--- | :--- | :--- |
| **Portal de Locales (`/`)** | Vista mensual y de agenda con acceso por PIN de seguridad. Solo lectura filtrada por sede. | Clientes, Mozo, Encargados de Local, Cocina |
| **Panel de Control (`/admin`)** | Creación, modificación y borrado de eventos y locales. Asignación detallada de menús y raciones. | Administrador, Gerencia de Operaciones |
| **Resumen Mensual** | Histograma interactivo de carga diaria y consolidado cuantitativo de raciones de catering por mes. | Cocina Central, Compras, Logística |
| **Gestión de Menú** | Catálogo de proteínas, guarniciones, ensaladas, salsas y complementos disponibles. | Administración |
| **Gestión de Accesos** | Creación y administración de clientes con PIN, selección de locales y lista blanca de administradores. | Administración |
