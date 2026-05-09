# MediConnect

**MediConnect** es una aplicación móvil de trazabilidad y donación segura de medicamentos. Su objetivo es conectar a personas o farmacias que desean donar medicamentos en buen estado con pacientes, ONG o centros de salud que los necesitan, garantizando seguridad, control de vencimiento, validación y seguimiento de cada donación.

---

## Objetivo del proyecto

Desarrollar una aplicación móvil que permita registrar, solicitar, validar y entregar medicamentos donados, asegurando que los productos se encuentren vigentes, en buen estado y correctamente trazados durante todo el proceso.

---

## Tecnologías utilizadas

- React Native
- Expo
- TypeScript
- Firebase Authentication
- Firebase Firestore
- Expo Camera
- Expo Image Picker
- Expo Location
- Expo Print
- Expo Sharing
- DateTimePicker
- Generación y escaneo de códigos QR
- Escáner de código de barras

---

## Roles del sistema

### Donante

El donante puede ser una persona individual o una farmacia. Su función principal es registrar medicamentos disponibles para donar.

Funciones principales:

- Crear cuenta e iniciar sesión.
- Registrar medicamentos.
- Agregar nombre, compuesto activo, miligramos, lote, fecha de vencimiento y cantidad.
- Subir foto del medicamento o empaque.
- Escanear código de barras.
- Guardar ubicación actual.
- Ver sus medicamentos publicados.
- Editar o eliminar medicamentos propios.
- Consultar solicitudes recibidas.

---

### Receptor

El receptor puede ser un paciente, una ONG o un centro de salud que necesita medicamentos.

Funciones principales:

- Crear cuenta e iniciar sesión.
- Buscar medicamentos disponibles.
- Ver detalles del medicamento.
- Consultar distancia aproximada respecto al donante.
- Solicitar medicamentos.
- Indicar motivo, cantidad, urgencia y datos de entrega.
- Ver el estado de sus solicitudes.
- Generar QR de entrega cuando la solicitud es aprobada.

---

### Validador

El validador es un usuario encargado de revisar solicitudes y confirmar entregas. Este rol requiere autorización del administrador.

Funciones principales:

- Crear cuenta como validador.
- Quedar en estado pendiente hasta ser autorizado.
- Revisar solicitudes pendientes cuando está autorizado.
- Aprobar o rechazar solicitudes con observaciones.
- Escanear QR para confirmar entregas.
- Validar trazabilidad del medicamento.

---

### Administrador

El administrador supervisa el funcionamiento general del sistema.

Funciones principales:

- Ver reportes generales.
- Consultar estadísticas de usuarios, medicamentos y solicitudes.
- Autorizar validadores.
- Rechazar validadores.
- Generar reportes PDF.
- Ver inventario general.
- Consultar solicitudes del sistema.
- Recibir alerta visual cuando existen validadores pendientes.

---

## Funcionalidades principales

### Autenticación y perfiles

- Registro de usuarios.
- Inicio de sesión con Firebase Authentication.
- Selección de rol.
- Perfil personalizado por tipo de usuario.
- Foto de perfil.
- Edición de datos personales.
- Cierre de sesión seguro.
- Botón para mostrar u ocultar contraseña en el inicio de sesión.

---

### Gestión de medicamentos

- Registro de medicamentos para donación.
- Validación automática de fecha de vencimiento.
- Rechazo de medicamentos vencidos o próximos a vencer.
- Registro de lote, miligramos, cantidad y compuesto activo.
- Foto del medicamento.
- Escaneo de código de barras.
- Edición y eliminación de medicamentos propios.
- Listado ordenado de medicamentos recientes.
- Ocultamiento de medicamentos agotados para receptores.

---

### Solicitudes de donación

- El receptor puede solicitar medicamentos disponibles.
- La solicitud guarda:
  - medicamento solicitado
  - cantidad requerida
  - motivo
  - urgencia
  - datos de entrega
  - receptor
  - donante
  - distancia aproximada
- Las solicitudes se muestran ordenadas de más recientes a más antiguas.
- El validador autorizado puede aprobar o rechazar solicitudes.
- Al aprobar, se descuenta automáticamente la cantidad disponible del medicamento.
- El receptor no puede marcar manualmente una solicitud como entregada.

---

### Trazabilidad y entrega por QR

- Cuando una solicitud es aprobada, el receptor puede ver el QR de entrega.
- El receptor debe mostrar el QR al validador autorizado.
- El validador autorizado escanea el QR.
- Al escanear el QR, la solicitud cambia a estado entregado.
- El sistema registra quién escaneó el QR y la fecha de confirmación.

---

### Geolocalización

- Los usuarios pueden guardar su ubicación actual.
- El sistema almacena latitud y longitud del usuario.
- Cuando el receptor consulta medicamentos disponibles, se muestra una distancia aproximada.
- La distancia se calcula entre la ubicación del receptor y la ubicación del donante.

---

### Módulo administrativo

El sistema cuenta con un módulo administrativo para supervisión y toma de decisiones.

Incluye:

- Total de usuarios registrados.
- Total de donantes.
- Total de receptores.
- Total de validadores.
- Validadores autorizados.
- Validadores pendientes.
- Validadores rechazados.
- Total de medicamentos.
- Medicamentos publicados.
- Medicamentos agotados.
- Solicitudes pendientes.
- Solicitudes aprobadas.
- Solicitudes rechazadas.
- Solicitudes entregadas.
- Reportes PDF.
- Alerta visual con contador rojo cuando existen validadores pendientes.

Tipos de reportes disponibles:

- Reporte general.
- Reporte de medicamentos.
- Reporte de solicitudes.
- Reporte de validadores.

---

## Seguridad y control de permisos

El sistema implementa control de permisos por rol utilizando Firebase Authentication y Firestore Rules.

Restricciones principales:

- Solo los donantes pueden registrar medicamentos.
- Solo los receptores pueden crear solicitudes.
- Solo los validadores autorizados pueden aprobar o rechazar solicitudes.
- Solo los validadores autorizados pueden escanear QR de entrega.
- El receptor no puede cambiar manualmente una solicitud a entregada.
- El administrador puede autorizar o rechazar validadores.
- El rol administrador no puede seleccionarse desde la app; se asigna manualmente en Firebase.
- Los validadores pendientes no pueden aprobar solicitudes ni escanear QR.
- Los validadores rechazados no pueden realizar funciones de validación.

---

## Estados principales

### Estados de medicamento

- `publicado`
- `agotado`

### Estados de validación

- `pendiente`
- `validado`

### Estados de solicitud

- `pendiente`
- `aprobado`
- `rechazado`
- `entregado`

### Estados de validador

- `pendiente`
- `autorizado`
- `rechazado`

---

## Flujo principal del sistema

```txt
1. Donante registra medicamento.
2. El sistema valida la fecha de vencimiento.
3. El medicamento se publica si cumple las condiciones.
4. Receptor busca medicamentos disponibles.
5. Receptor envía solicitud.
6. Validador autorizado revisa la solicitud.
7. Validador aprueba o rechaza.
8. Si aprueba, el receptor visualiza QR.
9. Receptor muestra QR al validador.
10. Validador escanea QR.
11. La solicitud queda marcada como entregada.
```

---

## Estructura general del proyecto

```txt
MediConnect/
├── App.tsx
├── package.json
├── README.md
├── src/
│   ├── config/
│   │   └── firebase.ts
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── RoleSelectScreen.tsx
│   │   ├── RoleGateScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── EditProfileScreen.tsx
│   │   ├── AddMedicineScreen.tsx
│   │   ├── EditMedicineScreen.tsx
│   │   ├── MedicineListScreen.tsx
│   │   ├── RequestsScreen.tsx
│   │   ├── DonationQRCodeScreen.tsx
│   │   ├── QRScannerScreen.tsx
│   │   ├── BarcodeScannerScreen.tsx
│   │   └── AdminDashboardScreen.tsx
│   └── utils/
│       └── distance.ts
```

---

## Instalación del proyecto

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar a la carpeta del proyecto:

```bash
cd MediConnect
```

Instalar dependencias:

```bash
npm install
```

Ejecutar el proyecto:

```bash
npx expo start
```

Ejecutar limpiando caché:

```bash
npx expo start --clear
```

---

## Dependencias principales

```bash
npm install firebase
npx expo install expo-camera
npx expo install expo-image-picker
npx expo install expo-location
npx expo install expo-print
npx expo install expo-sharing
npx expo install @react-native-community/datetimepicker
```

---

## Firebase

El proyecto utiliza Firebase para:

- autenticación de usuarios
- almacenamiento de perfiles
- registro de medicamentos
- solicitudes de donación
- control de validadores
- reportes administrativos
- seguridad por reglas de Firestore

Colecciones principales:

```txt
users
medicines
requests
```

---

## Modelo general de datos

### Colección `users`

Campos principales:

```txt
uid
email
role
fullName
phone
location
latitude
longitude
profileImage
donorType
receiverType
medicalNeed
validatorType
institution
validatorAuthorized
validatorStatus
validatorAuthorizedAt
validatorAuthorizedBy
validatorRejectedAt
validatorRejectedBy
createdAt
```

---

### Colección `medicines`

Campos principales:

```txt
name
active
mg
lot
expiration
quantity
packageStatus
barcode
medicinePhoto
userId
donorLatitude
donorLongitude
donationStatus
validationStatus
createdAt
updatedAt
```

---

### Colección `requests`

Campos principales:

```txt
medicineId
medicineName
medicineActive
medicineExpiration
medicineLot
medicinePhoto
requestedQuantity
requestReason
urgency
deliveryInfo
donorId
receiverId
approximateDistanceKm
status
validatorObservation
reviewedAt
reviewedBy
scannedAt
scannedBy
confirmedByRole
createdAt
```

---

## Reglas de seguridad

El proyecto utiliza reglas de Firestore para controlar permisos según rol.

Resumen:

```txt
Donante:
- Puede crear medicamentos.
- Puede editar o eliminar sus propios medicamentos.
- Puede ver solicitudes relacionadas con sus donaciones.

Receptor:
- Puede ver medicamentos disponibles.
- Puede crear solicitudes.
- Puede ver sus solicitudes.
- No puede marcar solicitudes como entregadas.

Validador autorizado:
- Puede ver solicitudes.
- Puede aprobar o rechazar solicitudes.
- Puede escanear QR y confirmar entregas.

Validador pendiente o rechazado:
- No puede aprobar solicitudes.
- No puede escanear QR.
- Debe esperar autorización del administrador.

Administrador:
- Puede ver información general.
- Puede autorizar o rechazar validadores.
- Puede generar reportes.
- Puede supervisar medicamentos y solicitudes.
```

---

## Pruebas realizadas

Se realizaron pruebas funcionales sobre los módulos principales:

- Registro de usuario.
- Inicio de sesión.
- Mostrar u ocultar contraseña.
- Selección de rol.
- Registro de medicamento.
- Validación de fecha de vencimiento.
- Registro con foto.
- Registro con código de barras.
- Guardado de ubicación.
- Búsqueda de medicamentos.
- Solicitud de medicamento.
- Aprobación por validador autorizado.
- Rechazo por validador autorizado.
- Generación de QR.
- Escaneo de QR.
- Confirmación de entrega.
- Autorización de validadores por administrador.
- Rechazo de validadores por administrador.
- Generación de reportes PDF.
- Restricciones por rol.
- Ordenamiento de medicamentos y solicitudes por fecha.
- Alerta visual para validadores pendientes.

---

## Resultados de pruebas

| Código | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| PU-01 | Registrar medicamento vencido | El sistema debe rechazarlo | Aprobado |
| PU-02 | Registrar medicamento próximo a vencer | El sistema debe rechazarlo | Aprobado |
| PU-03 | Registrar medicamento válido | El sistema debe guardarlo | Aprobado |
| PI-01 | Donante registra medicamento | El medicamento queda publicado | Aprobado |
| PI-02 | Receptor solicita medicamento | La solicitud queda pendiente | Aprobado |
| PI-03 | Validador aprueba solicitud | La solicitud queda aprobada | Aprobado |
| PI-04 | Validador rechaza solicitud | La solicitud queda rechazada | Aprobado |
| PI-05 | Receptor visualiza QR | Se muestra QR de entrega | Aprobado |
| PI-06 | Validador escanea QR | La solicitud queda entregada | Aprobado |
| PS-01 | Validador pendiente intenta aprobar | No puede aprobar | Aprobado |
| PS-02 | Validador pendiente intenta escanear QR | Se muestra acceso no autorizado | Aprobado |
| PS-03 | Receptor intenta marcar entregado | No tiene opción manual | Aprobado |
| PA-01 | Admin autoriza validador | Cambia a autorizado | Aprobado |
| PA-02 | Admin rechaza validador | Cambia a rechazado | Aprobado |
| PA-03 | Admin genera PDF | Se genera reporte correctamente | Aprobado |
| PG-01 | Usuario guarda ubicación | Se guardan coordenadas | Aprobado |
| PC-01 | Escaneo de código de barras | Código se coloca en formulario | Aprobado |
| PC-02 | Foto de perfil | Se guarda y visualiza correctamente | Aprobado |

---

## Estado actual del proyecto

Actualmente el proyecto cuenta con:

- autenticación funcional
- roles diferenciados
- perfil de usuario
- foto de perfil
- edición de perfil
- registro de medicamentos
- edición y eliminación de medicamentos
- scanner de código de barras
- cámara para fotografía
- calendario para fecha de vencimiento
- ubicación GPS
- cálculo de distancia aproximada
- solicitudes de donación
- aprobación y rechazo por validador autorizado
- QR de entrega
- escaneo de QR
- módulo administrativo
- autorización y rechazo de validadores
- reportes PDF
- reglas de seguridad en Firestore
- informe de pruebas QA
- diseño visual mejorado
- ordenamiento de registros recientes

---

## Pendientes o mejoras futuras

- Generar APK final.
- Probar en dispositivo Android instalado como APK.
- Probar compatibilidad en iOS mediante Expo Go.
- Agregar notificaciones push reales.
- Mejorar historial detallado de trazabilidad.
- Agregar mapas visuales.
- Agregar más reportes administrativos.
- Agregar dashboard con gráficas.
- Preparar documentación final con diagramas UML.
- Subir versión final a GitHub.

---

## Compatibilidad

La aplicación fue desarrollada con React Native y Expo, por lo que puede ejecutarse en:

- Android
- iOS mediante Expo Go
- Emuladores Android
- Dispositivos físicos

Para generar APK se recomienda utilizar Expo Application Services.

---

## Comandos útiles

Ejecutar la app:

```bash
npx expo start
```

Ejecutar limpiando caché:

```bash
npx expo start --clear
```

Ejecutar con túnel:

```bash
npx expo start --tunnel
```

Instalar dependencias:

```bash
npm install
```

Revisar dependencias vulnerables:

```bash
npm audit
```

---

## Capturas sugeridas para documentación

Se recomienda agregar capturas de:

- Pantalla de inicio de sesión.
- Pantalla de registro.
- Selección de rol.
- Dashboard por rol.
- Perfil de usuario.
- Registro de medicamento.
- Scanner de código de barras.
- Catálogo de medicamentos.
- Solicitud de medicamento.
- Panel de solicitudes.
- QR de entrega.
- Escáner QR.
- Panel administrativo.
- Reportes PDF.
- Autorización de validadores.

---

## Créditos

Proyecto desarrollado por:

```txt
Nombre 1
Nombre 2
Nombre 3
```

Curso:

```txt
Proyecto de desarrollo móvil / Ingeniería de software
```

---

## Nombre del proyecto

**MediConnect - App de Trazabilidad y Donación Segura de Medicamentos**