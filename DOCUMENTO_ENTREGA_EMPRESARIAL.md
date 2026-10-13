# DOSSIER DE ENTREGA TÉCNICA Y OPERATIVA
## Sistema de Gestión de Calendario y Catering de Locales

---

### DATOS GENERALES DEL PROYECTO
* **Nombre del Sistema:** Plataforma Web de Gestión de Calendario y Catering para Locales
* **Desarrollador / Responsable Técnico:** Kevin Zambrano
* **Versión del Software:** 1.0 (Producción)
* **Fecha de Entrega:** Octubre 2026
* **Zona Horaria Oficial:** Lima, Perú (`America/Lima`, UTC-5)
* **Plataforma de Despliegue:** Vercel (Frontend SPA) + Supabase (PostgreSQL Cloud)

---

## 1. RESUMEN EJECUTIVO
El presente proyecto ha sido diseñado e implementado para digitalizar, centralizar y optimizar la planificación de eventos, despachos de catering y turnos operativos de los locales de la empresa.

### Objetivos Alcanzados:
1. **Control de Turnos y Eventos en Tiempo Real:** Visualización en modalidades de Mes y Agenda con sincronización instantánea entre múltiples dispositivos.
2. **Planificación de Catering y Menú Diario:** Registro detallado de requerimientos gastronómicos (proteína, guarnición, ensalada, salsa, carbohidrato, servilletas y cantidad exacta de platos).
3. **Resumen Mensual de Producción:** Módulo con histogramas y consolidación cuantitativa de platos por día para facilitar las compras de insumos y la preparación en cocina.
4. **Acceso Diferenciado por Roles:**
   - **Administración:** Control total con inicio de sesión seguro mediante Google Workspace / Gmail autorizado.
   - **Clientes / Encargados de Local:** Acceso rápido y amigable mediante código de seguridad (PIN de 4 dígitos), restringido exclusivamente a sus locales asignados.
5. **Cero Desfases Horarios:** Adaptación estricta al huso horario de Perú (`America/Lima`, UTC-5), garantizando que las fechas y horas registradas coincidan en todos los dispositivos.

---

## 2. MANUAL DE OPERACIÓN POR ROLES

### A. Manual para el Administrador (`/admin`)
1. **Acceso al Panel:**
   - Ingresar a la URL del sistema con la ruta `/admin`.
   - Pulsar en **"Iniciar sesión con Google"** utilizando un correo habilitado en la lista blanca (`admin_emails`).
2. **Gestión de Eventos:**
   - Hacer clic en el botón **"+ Crear Evento"** o pulsar sobre cualquier casilla del calendario.
   - Completar título, local destino, fecha y hora.
   - En la sección **"Detalle de Menú"**, seleccionar los platos requeridos y definir la cantidad de raciones.
3. **Resumen Mensual para Cocina:**
   - En la barra superior, hacer clic en **"Resumen Mensual"**.
   - Elegir el mes y el local deseado para visualizar el histograma de demanda y el total de platos programados por fecha.
4. **Administración de Accesos y Permisos:**
   - En el menú lateral, seleccionar **"Accesos y Permisos"**.
   - **Pestaña Clientes:** Crear nuevos espectadores ingresando su Nombre, asignando un PIN de 4 dígitos y seleccionando a qué locales tendrá acceso.
   - **Pestaña Administradores:** Gestionar los correos autorizados para administrar el sistema.

### B. Manual para Clientes / Encargados de Local (`/`)
1. **Acceso Rápido:**
   - Ingresar a la dirección principal del sistema (`/`).
   - Introducir el código PIN de 4 dígitos asignado.
2. **Consulta de Actividades:**
   - El sistema cargará el calendario mostrando **únicamente** los turnos y actividades del local autorizado.
   - Al pulsar sobre un día, se abre la vista detallada con los eventos programados, horarios y notas operativas en modo solo lectura.

---

## 3. INFORME DE SEGURIDAD Y CUMPLIMIENTO TÉCNICO

El sistema ha sido auditado y fortalecido con estándares internacionales de seguridad:

1. **Row Level Security (RLS) en Base de Datos:**
   - Todas las tablas en PostgreSQL (`events`, `locales`, `menu_items`, `clients`, `admin_emails`) tienen políticas de seguridad estrictas.
   - Ningún usuario anónimo puede crear, modificar ni eliminar datos. Las operaciones de escritura requieren verificación de identidad de administrador mediante la función `public.is_admin()`.
2. **Protección de PINs y Clientes:**
   - La tabla `public.clients` está oculta para consultas públicas directas.
   - La verificación de credenciales se procesa mediante el procedimiento remoto `verify_client_pin(p_pin)` con privilegios `SECURITY DEFINER`. No se exponen contraseñas ni listas de clientes en el navegador.
3. **Defensa contra Ataques de Fuerza Bruta:**
   - Si un usuario ingresa un PIN incorrecto 5 veces consecutivas, el formulario se bloquea temporalmente por 30 segundos, impidiendo ataques automatizados por diccionario o scripts.
4. **Protección de Red y Consola:**
   - Cabeceras HTTP de seguridad (`Helmet`) activadas contra clickjacking e inyección.
   - Consola del navegador limpia de tokens JWT, correos o credenciales sensibles.

---

## 4. PLAN DE CONTINUIDAD Y MANTENIMIENTO

* **Copias de Seguridad (Backups):** Supabase realiza copias de seguridad automáticas diarias de la base de datos PostgreSQL en la nube.
* **Alta y Baja de Personal:** En caso de desvinculación de un encargado o cliente, el administrador puede revocar o cambiar su PIN en segundos desde el modal *Accesos y Permisos*, sin necesidad de reiniciar la plataforma.
* **Disponibilidad del Servicio:** Alojamiento en infraestructura serverless de alta disponibilidad con redundancia geográfica (Vercel Edge Network + Supabase Cloud).

---

## 5. ACTA DE CONFORMIDAD Y ENTREGA (SIGN-OFF)

Por medio del presente documento, se hace constar la entrega formal y recepción a satisfacción del **Sistema de Gestión de Calendario y Catering de Locales**, habiéndose verificado el correcto funcionamiento de los módulos operativos, la seguridad de la información y la capacitación inicial correspondiente.

| Rol | Nombre y Apellidos | Cargo | Firma | Fecha |
| :--- | :--- | :--- | :--- | :--- |
| **Entregado por (TI):** | Kevin Zambrano | Responsable Técnico | ____________________ | ___/___/2026 |
| **Recibido por (Operaciones):** | | Jefe / Gerente de Operaciones | ____________________ | ___/___/2026 |
| **Aprobado por (Gerencia):** | | Gerencia General | ____________________ | ___/___/2026 |
