# 04. PLAN DE SOPORTE, MANTENIMIENTO Y CONTINUIDAD OPERATIVA
## Garantía de Disponibilidad, Respaldo y Gestión del Cambio

---

### 1. OBJETIVO
Establecer los procedimientos operativos estándar (SOP) para el mantenimiento preventivo y correctivo, la ejecución de copias de seguridad, la respuesta ante incidencias y la continuidad del servicio del **Sistema de Gestión de Calendario y Catering de Locales**.

---

### 2. POLÍTICA DE COPIAS DE SEGURIDAD (BACKUPS)

La información corporativa almacenada en la base de datos cuenta con una estrategia de respaldo automatizada:

| Tipo de Respaldo | Frecuencia | Retención | Ubicación | Procedimiento de Restauración |
| :--- | :--- | :--- | :--- | :--- |
| **Respaldo Automático Cloud** | Diario (00:00 UTC) | 7 a 30 días | Supabase Managed Storage | Restauración en 1 clic desde el panel de Supabase |
| **Exportación Manual de Seguridad** | Semanal / Mensual | Indefinida | Almacenamiento seguro interno | Archivo `.sql` / `.csv` exportable desde el SQL Editor |

#### 2.1 Procedimiento para Exportar Datos Manualmente:
1. Ingresar a la consola de Supabase con la cuenta administradora.
2. Ir a la sección **Database -> Backups** o utilizar el comando `supabase db dump`.
3. Guardar una copia cifrada en el repositorio seguro de la empresa.

---

### 3. GESTIÓN DE CONTINUIDAD Y CONTINGENCIA

#### 3.1 Pérdida Temporal de Conexión a Internet
* La aplicación cuenta con almacenamiento en caché local (`localStorage`). Si un encargado pierde momentáneamente la conectividad a internet en su sede, el calendario continuará mostrando los eventos previamente sincronizados sin bloquear la pantalla.

#### 3.2 Olvido o Bloqueo de PIN de un Encargado de Local
* **Solución:**
  1. El administrador ingresa a `/admin` y abre la ventana **"Accesos y Permisos"**.
  2. Localiza al cliente o encargado en la lista y pulsa el ícono de edición (lápiz).
  3. Modifica el PIN por uno nuevo y presiona **"Guardar"**.
  4. El cambio tiene efecto inmediato en la base de datos sin necesidad de reiniciar la aplicación.

#### 3.3 Rotación de Personal o Desvinculación Laboral
* **Acción Inmediata:** Si un empleado deja de laborar en la empresa:
  - Si era **Administrador:** Eliminar su correo de la pestaña *Administradores* en *Accesos y Permisos*. Perderá de inmediato los permisos de modificación en la base de datos.
  - Si era **Encargado de Local:** Eliminar o cambiar el PIN en la pestaña *Clientes*.

---

### 4. MATRIZ DE NIVELES DE SERVICIO (SLA) Y TIEMPOS DE RESPUESTA

| Severidad | Descripción del Incidente | Tiempo de Respuesta Inicial | Tiempo de Resolución Objetivo |
| :--- | :--- | :--- | :--- |
| **Crítica (Sev-1)** | El sistema no carga para ningún usuario (caída total de la plataforma). | Menor a 30 minutos | Menor a 2 horas |
| **Alta (Sev-2)** | El calendario carga, pero no se pueden guardar eventos o menús en la base de datos. | Menor a 2 horas | Menor a 6 horas |
| **Media (Sev-3)** | Error visual o problema de acceso en un único local o dispositivo específico. | Menor a 4 horas | Menor a 24 horas |
| **Baja (Sev-4)** | Solicitud de nuevos colores de locales, categorías de menú o cambios de diseño. | 24 a 48 horas | Según cronograma planificado |

---

### 5. PROCEDIMIENTO DE ACTUALIZACIÓN Y DESPLIEGUE (CI/CD)

El sistema utiliza integración y despliegue continuo a través de **GitHub** y **Vercel**:
* **Despliegues sin Caída de Servicio (Zero Downtime):** Al subir mejoras al repositorio en la rama `main`, Vercel compila una nueva versión en paralelo y cambia el tráfico web de forma instantánea.
* **Rollback Inmediato:** Si una nueva versión presenta cualquier anomalía, el panel de control de Vercel permite revertir a la versión anterior en menos de 10 segundos con un solo clic.

---

### 6. CANALES DE SOPORTE TÉCNICO

* **Responsable Técnico:** Kevin Zambrano
* **Correo de Contacto:** `kevin.zambrano.inteligencia@gmail.com`
* **Horario de Atención:** Lunes a Viernes de 08:00 a 18:00 (Soporte crítico 24/7 para incidencias Sev-1).
