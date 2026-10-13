# 03. INFORME DE SEGURIDAD Y PROTECCIÓN DE DATOS
## Auditoría Técnica, Políticas de Acceso y Medidas de Protección

---

### 1. OBJETIVO DEL INFORME
Certificar que la plataforma web **Calendario de Locales y Gestión de Catering** cuenta con las medidas de seguridad, autenticación, control de accesos y resguardo de la información requeridas para operar en entornos corporativos de producción sin vulnerabilidades conocidas.

---

### 2. ARQUITECTURA DE SEGURIDAD EN CAPAS (DEFENSE IN DEPTH)

El sistema implementa una estrategia de **defensa en profundidad**, lo que significa que la seguridad no recae exclusivamente en la interfaz gráfica (frontend), sino que está respaldada por el motor de base de datos PostgreSQL y controles de red en el servidor.

```
                    ┌────────────────────────────────────────┐
                    │               CLIENTE                  │
                    │   • Protección contra fuerza bruta     │
                    │   • Cero credenciales en consola       │
                    │   • Sin backdoors de depuración        │
                    └───────────────────┬────────────────────┘
                                        │ HTTPS / WSS Cifrado
                    ┌───────────────────▼────────────────────┐
                    │          SERVIDOR Y RED                │
                    │   • Cabeceras Helmet (anti-XSS/MIME)   │
                    │   • Rate Limiting (anti-DoS / Spam)    │
                    │   • Tamaño máx. payloads (1MB/64KB)    │
                    └───────────────────┬────────────────────┘
                                        │ Token JWT / OAuth 2.0
                    ┌───────────────────▼────────────────────┐
                    │        BASE DE DATOS (POSTGRESQL)      │
                    │   • Row Level Security (RLS) activo    │
                    │   • Función RPC verify_client_pin()    │
                    │   • Lista blanca de administradores    │
                    │   • pgcrypto (Cifrado SHA-256)         │
                    └────────────────────────────────────────┘
```

---

### 3. SEGURIDAD EN BASE DE DATOS (SUPABASE / POSTGRESQL)

#### 3.1 Row Level Security (RLS) en Todas las Tablas
Cada tabla de la base de datos cuenta con políticas RLS obligatorias:

| Tabla | Acceso de Lectura (`SELECT`) | Acceso de Modificación (`INSERT`, `UPDATE`, `DELETE`) |
| :--- | :--- | :--- |
| `public.events` | Público (filtrado por local en cliente) | **Exclusivo Administrador (`is_admin()`)** |
| `public.locales` | Público (para renderizado de interfaz) | **Exclusivo Administrador (`is_admin()`)** |
| `public.menu_items` | Público (consulta de platos) | **Exclusivo Administrador (`is_admin()`)** |
| `public.clients` | **BLOQUEADO AL PÚBLICO** | **Exclusivo Administrador (`is_admin()`)** |
| `public.admin_emails`| Solo si es admin o su propio correo | **Exclusivo Administrador (`is_admin()`)** |
| `public.email_logs` | **Exclusivo Administrador** | **Exclusivo Administrador** |

#### 3.2 Protección Crítica de la Tabla `clients` y Códigos PIN
* **Riesgo Mitigado:** En sistemas vulnerables, un atacante puede ejecutar consultas con la clave pública de la API (`SELECT * FROM clients`) y descargar todos los PINs en texto plano.
* **Solución Implementada:** La tabla `clients` está completamente cerrada al público. Nadie desde internet puede leerla directamente.
* **Procedimiento Remoto `verify_client_pin(p_pin)`:**
  La autenticación de clientes se realiza a través de una función segura en el servidor (`SECURITY DEFINER`):
  1. El cliente envía el PIN ingresado.
  2. La función busca si existe coincidencia exacta o por hash SHA-256 (`pgcrypto`).
  3. Si es correcto, devuelve **únicamente** `{ id, name, role, allowed_locales }`.
  4. **Nunca retorna el PIN ni datos de otros clientes**, haciendo imposible la extracción de credenciales.

#### 3.3 Verificación de Administradores por Lista Blanca (`is_admin()`)
La función de base de datos `public.is_admin()` comprueba el correo electrónico contenido en el token de autenticación de Google (`auth.jwt() ->> 'email'`). Solo si dicho correo está registrado en `admin_emails` (o corresponde a la cuenta principal del responsable del proyecto), PostgreSQL autoriza la ejecución de transacciones de escritura.

---

### 4. SEGURIDAD EN EL FRONTEND (APLICACIÓN REACT)

1. **Eliminación Total de Backdoors:**
   * Se retiró cualquier atajo de prueba (como el código `9999`) que pudiera conceder privilegios administrativos sin autenticación de Google.
2. **Defensa contra Ataques de Fuerza Bruta (Brute-Force Lockout):**
   * El teclado de PIN bloquea los intentos tras 5 fallos consecutivos durante un lapso de 30 segundos, impidiendo que herramientas automatizadas adivinen los códigos.
3. **Limpieza de Consola y Protección de Tokens:**
   * La aplicación no emite registros de depuración (`console.log`) que contengan tokens JWT, contraseñas o correos de usuarios.
4. **Validación de Entorno de Desarrollo:**
   * Las credenciales de prueba (`1111`, `2222`) están aisladas exclusivamente al entorno local desconectado (`DEV`), quedando inactivas en producción.

---

### 5. SEGURIDAD EN EL SERVIDOR (EXPRESS / WEBSOCKETS)

1. **Cabeceras HTTP de Seguridad (`Helmet`):**
   * Mitigación de ataques de inclusión no autorizada en marcos externos (*clickjacking*).
   * Prevención de manipulación de tipos de contenido (*MIME sniffing*).
2. **Limitadores de Tasa (Rate Limiting):**
   * Límite general de 200 solicitudes por IP cada 15 minutos en rutas `/api/`.
   * Límite estricto de 20 solicitudes cada 15 minutos en envío de correos y acciones de compartir calendario, previniendo el uso del servidor como vector de spam.
3. **Restricción de Cargas Útiles (Payload Protection):**
   * Cuerpos de solicitudes JSON limitados a 1 MB.
   * Mensajes de sincronización WebSocket limitados a 64 KB, cerrando la conexión automáticamente ante paquetes sobrecargados.

---

### 6. CUMPLIMIENTO HORARIO Y CONSISTENCIA DE DATOS

* **Zona Horaria Estricta:** Toda manipulación, almacenamiento y cálculo de fechas se procesa en el huso horario oficial de Perú (`America/Lima`, UTC-5).
* **Prevención de Desplazamientos UTC:** Se neutralizó el desfase de 5 horas que suele alterar la fecha de eventos nocturnos en librerías estándar de JavaScript.

---

### 7. CONCLUSIÓN DE AUDITORÍA
La aplicación **cumple satisfactoriamente con los principios de confidencialidad, integridad y disponibilidad**, mitigando los principales riesgos identificados en el estándar OWASP Top 10 para aplicaciones web modernas.
