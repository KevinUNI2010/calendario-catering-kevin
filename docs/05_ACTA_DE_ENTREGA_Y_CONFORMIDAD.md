# 05. ACTA DE ENTREGA Y CONFORMIDAD DEL PROYECTO
## Certificado de Recepción y Aceptación a Entera Satisfacción

---

### DATOS DEL PROYECTO
* **Nombre del Proyecto:** Plataforma Web de Calendario de Locales y Gestión de Catering
* **Versión Entregada:** 1.0.0 (Producción)
* **Fecha de Entrega:** ___ de Octubre de 2026
* **Lugar de Ejecución:** Lima, Perú
* **Responsable Técnico:** Kevin Zambrano

---

### 1. DECLARACIÓN DE LAS PARTES
Por medio del presente documento, el **Responsable Técnico (Desarrollador)** hace entrega formal a la **Empresa Receptora** del software desarrollado para la planificación centralizada de eventos, gestión de catering y asignación de turnos operativos.

La **Empresa Receptora**, a través de sus representantes de Operaciones y Gerencia, declara haber presenciado las pruebas de funcionamiento, revisado la documentación técnica correspondiente y recibido los accesos a la plataforma en su entorno de producción.

---

### 2. LISTA DE ENTREGABLES VERIFICADOS

Las partes dejan constancia de la recepción conforme de los siguientes entregables:

- [x] **Aplicación Web en Producción:** Desplegada en la nube de alta disponibilidad (Vercel) y conectada a la base de datos PostgreSQL (Supabase).
- [x] **Módulo de Administración (`/admin`):** Con autenticación Google OAuth y control de eventos, menús y locales.
- [x] **Módulo de Clientes / Encargados (`/`):** Con autenticación por código PIN de 4 dígitos y filtro estricto por local.
- [x] **Módulo de Resumen Mensual:** Con generación de histogramas y cálculo cuantitativo de platos por día para cocina.
- [x] **Seguridad de Base de Datos:** Políticas Row Level Security (RLS) activas y verificación segura de credenciales mediante procedimiento `verify_client_pin`.
- [x] **Sincronización Horaria de Perú:** Adaptación al huso horario oficial `America/Lima` (UTC-5).
- [x] **Dossier de Documentación en Markdown:** Ficha Técnica, Manual de Usuario, Informe de Seguridad y Plan de Continuidad.

---

### 3. PRUEBAS DE ACEPTACIÓN REALIZADAS

| Prueba Realizada | Criterio de Aceptación | Resultado |
| :--- | :--- | :---: |
| **Autenticación Administrador** | Acceso concedido solo a correos en lista blanca mediante Google | **CONFORME** |
| **Autenticación Cliente / PIN** | Acceso concedido solo con código válido; bloqueo tras 5 intentos | **CONFORME** |
| **Creación de Eventos y Menús** | Guardado de fechas, raciones y opciones de menú en tiempo real | **CONFORME** |
| **Resumen Mensual** | Visualización íntegra del mes con conteo exacto de platos por día | **CONFORME** |
| **Filtro de Locales** | Cada local solo visualiza los turnos que le corresponden | **CONFORME** |
| **Prueba de Seguridad RLS** | Imposibilidad de alterar datos desde el exterior sin credenciales | **CONFORME** |

---

### 4. GARANTÍA Y SOPORTE INICIAL
El Responsable Técnico otorga un periodo de **garantía técnica de 30 días calendario** a partir de la firma de la presente acta para la subsanación sin costo de cualquier anomalía o defecto que pudiera presentarse en las funcionalidades entregadas.

---

### 5. FIRMAS DE CONFORMIDAD Y ACEPTACIÓN

Habiéndose verificado el cumplimiento total de los requerimientos y encontrándose el sistema en óptimas condiciones operativas, las partes firman la presente Acta en señal de conformidad:

<br><br>

```
_________________________________________         _________________________________________
            KEVIN ZAMBRANO                                    REPRESENTANTE DE OPERACIONES
    Desarrollador / Responsable Técnico                        Jefatura / Dirección Operativa
            DNI: _________________                                  DNI: _________________
```

<br><br>

```
_________________________________________
            GERENCIA GENERAL
           Dirección Ejecutiva
         RUC / DNI: _________________
```
