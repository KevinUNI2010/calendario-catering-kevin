# 02. MANUAL DE USUARIO Y GUÍA DE OPERACIÓN
## Sistema Web de Gestión de Calendario y Catering para Locales

---

### ÍNDICE DE CONTENIDOS
1. [Introducción y Perfiles de Acceso](#1-introducción-y-perfiles-de-acceso)
2. [Guía Operativa para Administradores (`/admin`)](#2-guía-operativa-para-administradores-admin)
   - [2.1 Inicio de Sesión](#21-inicio-de-sesión)
   - [2.2 Creación de Eventos y Pedidos de Catering](#22-creación-de-eventos-y-pedidos-de-catering)
   - [2.3 Modificación y Eliminación de Eventos](#23-modificación-y-eliminación-de-eventos)
   - [2.4 Reporte de Resumen Mensual (Producción de Cocina)](#24-reporte-de-resumen-mensual-producción-de-cocina)
   - [2.5 Configuración del Catálogo de Menú](#25-configuración-del-catálogo-de-menú)
   - [2.6 Gestión de Accesos y Creación de PINs](#26-gestión-de-accesos-y-creación-de-pins)
3. [Guía Operativa para Clientes y Encargados (`/`)](#3-guía-operativa-para-clientes-y-encargados-)
   - [3.1 Ingreso Mediante Código PIN](#31-ingreso-mediante-código-pin)
   - [3.2 Navegación en Vista Mes y Vista Agenda](#32-navegación-en-vista-mes-y-vista-agenda)
   - [3.3 Consulta Detallada de Eventos del Local](#33-consulta-detallada-de-eventos-del-local)
   - [3.4 Cierre de Sesión Seguro](#34-cierre-de-sesión-seguro)

---

## 1. INTRODUCCIÓN Y PERFILES DE ACCESO

El sistema opera bajo un modelo de doble interfaz según el rol del usuario:

* **Perfil Administrador (`/admin`):** Diseñado para la gerencia, operaciones y supervisores de catering. Cuenta con permisos completos de escritura, configuración de menús, gestión de clientes y generación de métricas de producción.
* **Perfil Espectador / Cliente / Encargado (`/`):** Diseñado para los encargados de sede, clientes corporativos, mozos y personal de cocina. Permite consultar de forma rápida y clara la programación del día y del mes sin riesgo de alterar o borrar información.

---

## 2. GUÍA OPERATIVA PARA ADMINISTRADORES (`/admin`)

### 2.1 Inicio de Sesión
1. Ingrese desde su navegador a la dirección del sistema añadiendo `/admin` al final (ejemplo: `https://tu-dominio.vercel.app/admin`).
2. Haga clic en el botón **"Iniciar sesión con Google"**.
3. Seleccione su cuenta corporativa autorizada en la lista blanca (`admin_emails`).
4. El sistema validará su identidad y cargará de inmediato el panel de control administrativo.

![Calendario de Administrador](assets/screen_02_admin_calendar.png)

### 2.2 Creación de Eventos y Pedidos de Catering
1. Para programar una nueva actividad, puede:
   - Pulsar el botón azul **"+ Crear Evento"** en la barra lateral.
   - O hacer clic directamente sobre el casillero del día deseado en el calendario.
2. Complete la información básica:
   - **Título:** Nombre identificador (ejemplo: *Catering Almuerzo Corporativo - Turno 1*).
   - **Local:** Seleccione el local de destino en la lista desplegable.
   - **Fecha y Horario:** Defina la hora de inicio y finalización (calculado automáticamente en horario de Perú UTC-5).
   - **Color de Identificación:** Seleccione una etiqueta cromática (azul, verde, rojo, uva, etc.).
3. Complete el **Detalle de Menú y Catering**:
   - **Control de Platos (3 Estados):**
     - **1. Platos Contratados (Preventa):** Soporta números (`150`) o fórmulas de distribución como **`23x8`** o **`23*8`** (23 mesas de 8) o `20*8 + 5`. El sistema calcula automáticamente el total de raciones en tiempo real sin requerir calculadora.
     - **2. Platos Confirmados (Día del Evento - Cocina):** Cantidad de platos para la cocina; admite números directos o fórmulas (`24*8`, `24x8`). El sistema calcula en vivo la variación (ej. *+14 platos adicionales*).
     - **3. Platos Servidos (Final / Liquidación):** Conteo de platos entregados en sala; admite números o fórmulas (`25*8`, `25x8`) para auditoría y facturación final de excedentes.
   - **Evidencia / Cuaderno Físico (Foto y Recorte):**
     - **Tomar Foto:** En celulares o tablets abre la cámara trasera para fotografiar la hoja del cuaderno de apuntes o minuta firmada.
     - **Subir Archivo:** Permite cargar fotos o escaneos desde la galería o computadora.
     - **Herramienta de Recorte y Rotación:** Permite girar la foto a 90° para corregir orientaciones y recortar con precisión los bordes del cuaderno.
     - **Compresión Inteligente:** Optimiza automáticamente la imagen a ~150-250 KB preservando nitidez y legibilidad de textos manuscritos.
     - **Visor Lightbox:** En el resumen del evento, pulsar la miniatura abre un visor en pantalla completa con zoom y opción de descarga para auditar firmas y anotaciones.
   - Seleccione la **Proteína**, **Carbohidrato**, **Guarnición**, **Ensalada** y **Salsa**.
   - Indique el color de servilletas o complementos especiales.
4. Presione **"Guardar Evento"**. El evento se sincronizará en tiempo real con la base de datos y quedará disponible al instante para el local correspondiente.

![Modal de Crear Evento y Detalle de Menú con Control de Platos en 3 Estados](assets/screen_03_create_event.png)

### 2.3 Modificación y Eliminación de Eventos
* **Editar:** Haga clic sobre el evento en el calendario para abrir la ventana de detalles y pulse **"Editar"**. Al finalizar sus ajustes, pulse **"Guardar"**.
* **Eliminar:** En la ventana del evento, pulse el botón rojo con ícono de papelera **"Eliminar"** y confirme la acción.

### 2.4 Reporte de Resumen Mensual (Producción de Cocina)
Este reporte es la herramienta principal para la planificación gastronómica:
1. En la barra superior, pulse el botón naranja **"Resumen Mensual"**.
2. Seleccione el mes a analizar y el local específico (o deje en blanco para consolidar todos los locales).
3. La ventana mostrará:
   - **Histograma Diario:** Gráfico de barras que representa el volumen de platos programados para cada uno de los días del mes (del día 1 al 31).
   - **Detalle de Menús:** Desglose exacto de las combinaciones de platos programados para esa fecha.
   - **Criterio Inteligente de Conteo (Cascada de Platos):**
     1. El reporte toma prioritariamente los **Platos Servidos** (conteo real final de sala).
     2. Si no hay servidos (no aumentaron en sala o evento reciente), toma los **Platos Confirmados** de cocina.
     3. Si no hay confirmados (no hubo llamada de ajuste), toma los **Platos Contratados** de la preventa.
4. Esta información permite a cocina y compras programar la adquisición exacta de carnes, verduras e insumos sin excesos ni faltantes.

![Modal de Resumen Mensual con Histograma de Raciones](assets/screen_04_monthly_summary.png)

### 2.5 Configuración del Catálogo de Menú
1. En el menú lateral izquierdo, pulse sobre **"Gestión de Menú"**.
2. Podrá añadir, activar o inactivar opciones de proteínas, salsas, ensaladas y guarniciones para que aparezcan en el selector de creación de eventos.
3. Pulse **"Guardar Catálogo"** para actualizar la base de datos.

### 2.6 Gestión de Accesos y Creación de PINs
1. En el menú lateral, seleccione **"Accesos y Permisos"**.
2. **Crear Nuevo Cliente / Espectador:**
   - Escriba el **Nombre** del encargado o empresa cliente.
   - Defina un **PIN de 4 dígitos** (numérico, ejemplo: `4821`).
   - Marque los **Locales Permitidos**: Seleccione las casillas de los locales que este usuario podrá visualizar.
   - Pulse **"Crear Espectador"**.
3. **Pestaña Administradores:** Si desea autorizar a un nuevo supervisor, ingrese su correo de Google y presione **"Añadir Administrador"**.

![Modal de Accesos y Permisos](assets/screen_05_access_management.png)

---

## 3. GUÍA OPERATIVA PARA CLIENTES Y ENCARGADOS (`/`)

### 3.1 Ingreso Mediante Código PIN
1. Ingrese a la dirección principal del sistema (`/`).
2. En la pantalla de bienvenida, digite el **código de seguridad de 4 dígitos** proporcionado por la administración.
3. El sistema verificará automáticamente el código sin necesidad de presionar enter.
4. *Mecanismo de Seguridad:* Si se ingresa un código erróneo 5 veces consecutivas, el sistema se bloqueará por 30 segundos como protección contra intentos no autorizados.

![Pantalla de Login por PIN de Clientes](assets/screen_01_pin_login.png)

### 3.2 Navegación en Vista Mes y Vista Agenda
* **Vista Mes:** Permite ver la cuadrícula mensual completa con los eventos distribuidos por fecha.
* **Vista Agenda:** Muestra un listado cronológico ordenado día por día, ideal para revisar turnos en teléfonos celulares.
* **Buscador:** En la barra superior puede buscar eventos por nombre o palabra clave.

### 3.3 Consulta Detallada de Eventos del Local
1. Haga clic sobre cualquier fecha o evento en el calendario.
2. Se abrirá la ventana de detalle que muestra el nombre del turno, horario y notas en modo solo lectura.

![Vista del Portal de Clientes con Filtro de Sede](assets/screen_06_client_portal.png)
   - Horario exacto de atención/despacho.
   - Raciones programadas y notas operativas.
3. La vista es de **solo lectura**, garantizando que ningún usuario externo pueda borrar o desconfigurar la planificación de la empresa.

### 3.4 Cierre de Sesión Seguro
Para salir del sistema, pulse el botón **"Cerrar Sesión"** en la esquina inferior izquierda. La sesión local se limpiará inmediatamente para que nadie más pueda ver la información en ese equipo.
