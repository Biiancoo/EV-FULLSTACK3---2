# SmartLogix — Informe de Implementación Full Stack

**Repositorio:** https://github.com/Biiancoo/EV-FULLSTACK3---2.git

---

## Índice

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Arquitectura por Capas del Frontend](#2-arquitectura-por-capas-del-frontend)
3. [Estructura de Archivos](#3-estructura-de-archivos)
4. [Endpoints del Backend consumidos](#4-endpoints-del-backend-consumidos)
5. [CRUD implementado en el Frontend](#5-crud-implementado-en-el-frontend)
6. [Patrones y Estrategias utilizados](#6-patrones-y-estrategias-utilizados)
7. [Docker — Frontend y Backend](#7-docker--frontend-y-backend)
8. [Ramas de GitHub](#8-ramas-de-github)
9. [Cómo levantar el proyecto](#9-cómo-levantar-el-proyecto)

---

## 1. Descripción del Proyecto

SmartLogix es una plataforma de logística basada en **microservicios**. El backend está desarrollado en **Spring Boot con Maven** y expone cuatro dominios principales: autenticación, inventario, órdenes y envíos. El frontend está desarrollado en **React + Vite** y consume todos los endpoints del backend a través del API Gateway.

### Arquitectura general

```
Navegador (React)  →  Docker puerto 3000
        │
        │ HTTP → localhost:8080
        ▼
   API Gateway (Spring Cloud Gateway)
        │ Valida JWT + enruta
   ┌────┼─────────────┬─────────────┐
   │    │             │             │
auth  inventory   order   shipment  chatbot
```

---

## 2. Arquitectura por Capas del Frontend

La arquitectura implementada sigue el esquema **básico** indicado por el profesor: `Components → Service → API`.

```
src/
├── pages/          ← Componentes de vista (Pages / Components)
│   ├── Login.jsx
│   ├── Shipments.jsx
│   ├── Inventory.jsx
│   ├── Order.jsx
│   └── ChatbotWidget.jsx  ← Widget flotante (visible globalmente)
├── service/        ← Capa de lógica de negocio (Service)
│   ├── authService.js
│   ├── shipmentService.js
│   ├── inventoryService.js
│   ├── orderService.js
│   └── chatbotService.js
└── api/            ← Capa HTTP pura (API)
    ├── httpClient.js     ← Cliente centralizado
    ├── authApi.js
    ├── shipmentApi.js
    ├── inventoryApi.js
    ├── orderApi.js
    └── chatbotApi.js
```

### Descripción de cada capa

**Capa `api/`** — Solo conoce las rutas HTTP y cómo enviar los datos. No tiene lógica de negocio ni validaciones. Toda comunicación HTTP pasa por `httpClient.js`, que centraliza la URL base, los headers por defecto y el parseo del JSON.

**Capa `service/`** — Aplica reglas de negocio antes de llamar al API: validaciones de formulario, obtención del token de sesión, formateo de datos. Los componentes nunca llaman a `api/` directamente.

**Capa `pages/`** — Componentes React que renderizan la interfaz. Solo llaman funciones de `service/`. No saben nada de HTTP, fetch ni tokens. `ChatbotWidget.jsx` es un componente especial de tipo **widget flotante** que se monta en `App.jsx` y está disponible globalmente en todas las rutas privadas.

---

## 3. Estructura de Archivos

```
SmartLogix/                     ← Backend Spring Boot
├── api-gateway/
├── auth-service/
├── chatbot-service/              ← Nuevo: Chatbot con IA
├── discovery-service/
├── inventory-service/
├── order-service/
├── shipment-service/
└── docker-compose.yml

front/
└── fron_smart_logix/           ← Frontend React + Vite
    ├── src/
    │   ├── api/                ← Capa HTTP
    │   │   ├── httpClient.js
    │   │   ├── authApi.js
    │   │   ├── inventoryApi.js
    │   │   ├── orderApi.js
    │   │   ├── shipmentApi.js
    │   │   └── chatbotApi.js
    │   ├── service/            ← Capa de negocio
    │   │   ├── authService.js
    │   │   ├── inventoryService.js
    │   │   ├── orderService.js
    │   │   ├── shipmentService.js
    │   │   └── chatbotService.js
    │   ├── pages/              ← Vistas
    │   │   ├── Login.jsx
    │   │   ├── Shipments.jsx
    │   │   ├── Inventory.jsx
    │   │   ├── Order.jsx
    │   │   └── ChatbotWidget.jsx
    │   ├── App.jsx             ← Router + layout + widget flotante
    │   └── App.css             ← Estilos
    ├── Dockerfile
    └── nginx.conf

run-Docker.ps1                  ← Script para levantar el frontend
README.md                       ← Este documento
```

---

## 4. Endpoints del Backend consumidos

Todos los controladores del backend son consumidos por el frontend. El API Gateway escucha en `http://localhost:8080` y enruta al microservicio correspondiente.

### Auth Service — `/api/auth`

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registra nuevo usuario |
| POST | `/api/auth/login` | Login, retorna JWT |

**Respuesta de login:**
```json
{ "token": "...", "tokenType": "Bearer", "username": "admin", "role": "ADMIN", "expiresInMs": 86400000 }
```

### Inventory Service — `/api/inventory`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/inventory/items` | Listar todos los ítems |
| POST | `/api/inventory/items` | Crear ítem |
| GET | `/api/inventory/items/{sku}/availability?quantity=N` | Verificar disponibilidad |
| POST | `/api/inventory/items/{sku}/reserve?quantity=N` | Reservar unidades |
| POST | `/api/inventory/items/{sku}/release?quantity=N` | Liberar unidades |
| POST | `/api/inventory/items/{sku}/dispatch?quantity=N` | Despachar unidades |

### Order Service — `/api/orders`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/orders` | Listar todas las órdenes |
| POST | `/api/orders` | Crear orden con líneas |
| GET | `/api/orders/{orderNumber}` | Buscar por número |

### Shipment Service — `/api/shipments`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/shipments` | Listar todos los envíos |
| POST | `/api/shipments` | Crear envío |
| GET | `/api/shipments/{trackingCode}` | Buscar por tracking |
| PATCH | `/api/shipments/{trackingCode}/status?value=STATUS` | Cambiar estado |

### Chatbot Service — `/api/chat`

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/chat/ask` | Enviar pregunta al chatbot IA. Recibe `{question: "..."}` y devuelve `{answer: "...", source: "GEMINI/RULES"}` |

---

## 5. CRUD implementado en el Frontend

### Envíos (Shipments)
- **Create:** Formulario para crear envío (número de orden, dirección, unidades)
- **Read:** Tabla con todos los envíos del sistema
- **Read one:** Búsqueda por tracking code
- **Update:** Cambio de estado directamente desde la tabla (select desplegable)

### Inventario
- **Create:** Formulario para crear ítem (SKU, nombre, bodega, cantidad inicial, nivel de reorden)
- **Read:** Tabla con todos los ítems del inventario
- **Operaciones:** Verificar disponibilidad, Reservar, Liberar, Despachar unidades

### Órdenes
- **Create:** Formulario con soporte para múltiples líneas de orden (SKU, cantidad, precio unitario)
- **Read:** Tabla con todas las órdenes
- **Read one:** Búsqueda por número de orden

### Autenticación
- **Login:** Acceso con usuario o email + contraseña
- **Register:** Creación de cuenta nueva
- **Logout:** Limpieza de sesión y retorno al login

### Chatbot de Soporte con IA
- **Widget flotante:** Botón circular fijo en la esquina inferior derecha, visible en todas las páginas después del login
- **Consulta en tiempo real:** El usuario escribe preguntas sobre inventario, órdenes o envíos
- **Respuesta inteligente:** El backend consulta los microservicios en vivo, arma un contexto con los datos actuales y envía el prompt a Google Gemini para generar una respuesta natural
- **Fallback:** Si Gemini no está disponible, responde con reglas locales predefinidas
- **Indicador de fuente:** Muestra "IA Gemini" (azul) o "Reglas locales" (gris) en cada respuesta

---

## 6. Patrones y Estrategias utilizados

### Backend

#### Strategy Pattern — `auth-service`
El servicio de autenticación utiliza el patrón **Strategy** para permitir múltiples métodos de login sin modificar la lógica central. `AuthStrategyResolver` selecciona en tiempo de ejecución la estrategia correcta:
- `LocalEmailAuthStrategy` → autenticación por email
- `LocalUsernameAuthStrategy` → autenticación por nombre de usuario

**Ventaja:** Se pueden agregar nuevas estrategias (OAuth, LDAP) sin tocar el flujo principal de login.

#### Factory Pattern — `shipment-service`
El servicio de envíos usa el patrón **Factory** para crear planes de despacho según la región geográfica del destino:
- `CentralShipmentPlanFactory`
- `NorthernShipmentPlanFactory`
- `SouthernShipmentPlanFactory`

`ShipmentPlanFactoryResolver` decide qué fábrica instanciar según la dirección del pedido.

#### Gateway Pattern — `api-gateway`
El API Gateway actúa como único punto de entrada al sistema. Centraliza:
- **Autenticación JWT:** valida el token en cada request antes de enrutar
- **Enrutamiento:** distribuye cada path al microservicio correcto
- **CORS:** configuración global para todos los orígenes

#### Service Discovery — Eureka
Todos los microservicios se registran automáticamente en el servidor Eureka. El Gateway usa `lb://nombre-servicio` para balanceo de carga sin necesidad de IPs hardcodeadas.

#### LLM Integration Pattern — `chatbot-service`
El chatbot integra un modelo de lenguaje (LLM) de Google Gemini como asistente de soporte. El patrón sigue estos pasos:
1. **Consulta de contexto:** el servicio obtiene datos en tiempo real de los otros microservicios (inventario, órdenes, envíos) vía el API Gateway
2. **Prompt engineering:** arma un prompt estructurado con los datos JSON actuales + la pregunta del usuario
3. **LLM inference:** envía el prompt a Gemini y recibe una respuesta en lenguaje natural
4. **Fallback:** si Gemini no responde, usa reglas locales predefinidas

**Ventaja:** El asistente responde con información **real y actualizada** del sistema, no con datos estáticos o inventados.

---

### Frontend

#### Arquitectura en Capas (Components → Service → API)
La separación en tres capas garantiza que cada parte del código tiene una única responsabilidad:
- Los **componentes** solo renderizan y capturan eventos
- Los **services** aplican lógica de negocio y validaciones
- Los **APIs** solo envían y reciben datos del backend

#### HTTP Client centralizado — `httpClient.js`
Todas las llamadas HTTP se hacen a través de una sola función `httpRequest`. Si cambia la URL base, los headers globales o el manejo de errores, solo hay que modificar este archivo.

#### Controlled Components — React
Todos los formularios usan el patrón de componentes controlados: cada campo tiene su propio estado (`useState`) y se actualiza en tiempo real. Esto garantiza que el estado de React es siempre la fuente de verdad para los datos del formulario.

#### Hash Router — navegación SPA
La navegación entre páginas usa el hash de la URL (`#/shipment`, `#/order`, `#/inventory`). Esto permite que React gestione la navegación del lado del cliente sin necesitar un servidor que conozca las rutas.

#### Session Token Pattern — localStorage
El JWT se almacena en `localStorage` con funciones helper centralizadas. Cuando el usuario abre la aplicación, `App.jsx` verifica si existe un token válido y decide si mostrar el login o el dashboard.

#### Floating Widget Pattern — Chatbot
El chatbot se implementa como un **widget flotante** (`position: fixed`) independiente del layout principal. Esto garantiza:
- **Disponibilidad global:** visible en todas las páginas sin importar la ruta
- **Sin interferencia:** no modifica el DOM ni el estado de las páginas existentes
- **Toggle control:** el usuario abre/cierra con un botón circular

---

## 7. Docker — Frontend y Backend

### Frontend — Dockerfile (Multi-stage Build)

```dockerfile
# Stage 1: Build con Node
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Servir con Nginx (imagen final liviana)
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**¿Por qué multi-stage?** La imagen final no incluye Node.js ni las dependencias de desarrollo, reduciendo el tamaño de ~400 MB a ~25 MB.

### nginx.conf — SPA fallback

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Cualquier ruta que no exista como archivo estático sirve `index.html`. Esto permite que el hash router de React funcione correctamente después de un reload de página.

### Backend — docker-compose.yml

El backend completo se orquesta con `docker-compose`. El orden de arranque respeta las dependencias con `condition: service_healthy`:

```
discovery-service
    → auth-service, inventory-service, shipment-service, chatbot-service
        → order-service
            → api-gateway (expone puerto 8080)
```

---

## 8. Ramas de GitHub

El repositorio utiliza **3 ramas** con roles bien definidos:

### `main` — Rama de producción
Contiene únicamente código estable y probado. Solo recibe merges desde `testing` cuando una versión está lista para entrega. Nadie trabaja directamente en esta rama.

### `develop` — Rama de desarrollo
Rama de trabajo principal. Aquí se integran los features nuevos. Se hacen merges frecuentes desde ramas de features individuales. Puede tener código incompleto.

### `testing` — Rama de pruebas
Recibe merges desde `develop` cuando un conjunto de cambios está listo para validar. Se verifica que el frontend funcione correctamente con el backend antes de fusionar a `main`. Sirve como "puerta de calidad" antes de producción.

### Flujo de trabajo

```
develop  →  testing  →  main
   ↑
 (trabajo diario, commits, features)
```

### Comandos para configurar el repositorio

```bash
# 1. Clonar el repositorio
git clone https://github.com/Biiancoo/EV-FULLSTACK3---2.git
cd EV-FULLSTACK3---2

# 2. Copiar el contenido del proyecto aquí
#    (carpetas SmartLogix/ y front/ + run-Docker.ps1 + README.md)

# 3. Crear y subir rama develop
git checkout -b develop
git add .
git commit -m "feat: proyecto completo SmartLogix - backend microservicios + frontend React"
git push origin develop

# 4. Crear rama testing desde develop
git checkout -b testing
git push origin testing

# 5. Fusionar a main cuando esté listo
git checkout main
git merge testing
git push origin main
```

---

## 9. Cómo levantar el proyecto

### Paso 1 — Levantar el backend

```bash
cd SmartLogix
```

**Opcional — activar la IA (Gemini):**
```powershell
$env:GEMINI_API_KEY="AIzaSy..."
```

```bash
docker-compose up --build -d
```

Esperar ~2 minutos. Verificar en http://localhost:8761 (Eureka) que todos los servicios estén registrados (auth, inventory, order, shipment, chatbot).

### Paso 2 — Levantar el frontend

**Con el script PowerShell (Windows):**
```powershell
.\run-Docker.ps1
```

**Sin Docker (desarrollo local):**
```bash
cd front/fron_smart_logix
npm install
npm run dev
# http://localhost:5173
```

### Paso 3 — Acceder

- **Frontend:** http://localhost:3000 (Docker) o http://localhost:5173 (dev)
- **API Gateway:** http://localhost:8080
- **Eureka:** http://localhost:8761
- **Chatbot (directo):** http://localhost:8085

**Usuarios de prueba (seeded automáticamente por el backend):**

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `user1` | `user123` | USER |

---

*Evaluación Full Stack 3 — SmartLogix | Instituto*
