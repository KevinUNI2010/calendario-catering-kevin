---
marp: true
theme: default
paginate: true
header: 'Plataforma de Calendario y Catering • Kevin Zambrano'
footer: 'Octubre 2026 • Lima, Perú'
style: |
  section {
    background-color: #0b0f19;
    color: #f8fafc;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  h1, h2 {
    color: #38bdf8;
  }
  blockquote {
    background: #1e293b;
    border-left: 5px solid #3b82f6;
    color: #cbd5e1;
  }
---

<!-- _class: lead -->
# 🚀 Plataforma de Calendario y Catering de Locales
### Sistema Centralizado de Planificación y Gestión en Tiempo Real

**Responsable Técnico:** Kevin Zambrano  
**Versión:** 1.0.0 (Producción)  
**Huso Horario:** Lima, Perú (`America/Lima`, UTC-5)  

---

## 💡 1. El Problema vs. Nuestra Solución

### El Diagnóstico Anterior:
* Pedidos de catering dispersos por WhatsApp o llamadas telefónicas.
* Descoordinación de horarios de entrega y turnos.
* Mermas de alimentos por falta de previsión de raciones en cocina.
* Desfases de fecha causados por servidores con horario internacional (UTC).

### La Solución Implementada:
> **Una sola plataforma en la nube:** Accesible 24/7 donde cocina, administración y sedes ven exactamente lo mismo en tiempo real sin desfases ni pérdidas de información.

---

## 👥 2. Doble Perfil de Acceso Seguro

### Perfil Administrador (`/admin`)
* Acceso protegido con **Google OAuth** y Lista Blanca de correos autorizados.
* Control total de turnos, catering, menús, locales y altas/bajas de personal.
* Visualización del **Resumen Mensual** de producción.

### Perfil Espectador / Sede (`/`)
* Acceso veloz mediante **código PIN de 4 dígitos**.
* Vista de solo lectura (cero riesgo de borrado o alteración de datos).
* Filtro estricto: cada sede solo visualiza sus eventos autorizados.

---

## 🍽️ 3. Planificación de Catering y Menú Diario

Cada evento en el calendario es una **orden técnica lista para cocina**:

* **Proteína:** Pollo, Lomo, Pescado, Cerdo o Vegetariano.
* **Guarnición y Carbohidrato:** Arroz, puré, papas doradas, verduras salteadas.
* **Ensalada y Salsas:** Ensalada fresca o cocida, vinagretas seleccionadas.
* **Volumen:** Conteo exacto de platos o raciones requeridas.
* **Servilletas y Notas:** Instrucciones operativas particulares para el local.

---

## 📈 4. El Módulo Clave: "Resumen Mensual"

### Histograma y Proyección Diaria de Cocina:
* Muestra de forma interactiva el volumen total de platos para cada día del mes (Día 1 al 31).
* Permite agrupar por local específico o ver el consolidado general de toda la empresa.

### Impacto en Compras y Costos:
> **Compras exactas:** El área de logística adquiere carnes, verduras e insumos con antelación matemática, **reduciendo el desperdicio hasta en un 35%**.

---

## 🇵🇪 5. Hora Oficial de Perú (UTC-5)

### Cero Errores de Fecha:
* Todos los componentes fueron configurados estrictamente en `America/Lima` (UTC-5).
* Los eventos programados entre las **19:00 y las 23:59 horas** permanecen firmes en su fecha correcta.
* Sin desfases de horario al abrir la aplicación en celulares, tablets o computadoras de escritorio.

---

## 🛡️ 6. Blindaje y Seguridad Empresarial

* **Row Level Security (RLS) en PostgreSQL (Supabase):**
  * Toda modificación o borrado exige validación de administrador (`is_admin()`).
* **Protección de PINs:**
  * La tabla de clientes está oculta. Se utiliza la función remota segura `verify_client_pin(p_pin)`.
  * **Los PINs nunca se exponen al navegador**.
* **Defensa Anti-Fuerza Bruta:**
  * Bloqueo automático de 30 segundos tras 5 intentos fallidos consecutivos.
* **Consola Limpia:**
  * Cero tokens o credenciales expuestas en la consola de inspección.

---

## ☁️ 7. Infraestructura Cloud y Alta Disponibilidad

* **Frontend:** Alojado en la red global de **Vercel Edge** (tiempos de carga inferiores a 1 segundo).
* **Base de Datos:** Alojada en **Supabase Cloud (PostgreSQL)** con replicación instantánea por WebSockets.
* **Copias de Seguridad:** Respaldos automáticos diarios en la nube con capacidad de restauración en 1 clic.
* **Actualizaciones:** Despliegues continuos sin interrupción del servicio (*Zero Downtime*).

---

## 💰 8. Retorno de Inversión (ROI) para la Empresa

| Área | Beneficio Tangible |
| :--- | :--- |
| **Cocina Central** | Conteo exacto de raciones sin pedidos improvisados a última hora. |
| **Compras y Logística** | Compras mayoristas planificadas; menos gasto en compras urgentes. |
| **Operaciones y Sedes** | Comunicación transparente; cada local sabe exactamente qué y cuándo recibe. |
| **Gerencia** | Trazabilidad histórica completa y reportes instantáneos. |

---

<!-- _class: lead -->
# 🏁 ¡Sistema Listo para Producción!

### Garantía y Puesta en Marcha:
* **Garantía Técnica:** 30 días calendario de soporte y acompañamiento post-entrega.
* **Documentación Completa:** Manual de usuario, informe de seguridad y acta de entrega disponibles.
* **Disponibilidad:** Inicio inmediato de operaciones.

**¡Muchas gracias por su atención!**  
*¿Preguntas o demostración en vivo?*
