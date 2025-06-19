# Microservicio de Órdenes de Compra (`purchases-orders-microservice`)

> **🌍 English Documentation:** If you prefer to read this documentation in English, see [readme.md](./readme.md)

## 1. Descripción General

Este proyecto implementa un Microservicio de Órdenes usando **NestJS**. Está diseñado usando principios de **Arquitectura Limpia (Arquitectura Hexagonal)** y el patrón **Command Query Responsibility Segregation (CQRS)**. Su responsabilidad principal es gestionar el ciclo de vida de las órdenes de clientes dentro de un sistema más amplio de e-commerce o compras.

Las funcionalidades clave incluyen:

* Crear nuevas órdenes basadas en artículos de productos.
* Recuperar detalles de órdenes (individuales y listas paginadas).
* Actualizar el estado de una orden (ej., PENDIENTE, PAGADA, ENTREGADA, CANCELADA).
* Manejar eventos de éxito de pago para marcar órdenes como pagadas.
* Interactuar con microservicios de Productos y Pagos vía NATS para validación y procesamiento.

El microservicio se comunica vía mensajería **NATS**, utiliza **Prisma** con PostgreSQL para persistencia de datos, y depende de servicios externos para información de productos y procesamiento de pagos. La arquitectura prioriza **mantenibilidad, capacidad de prueba, escalabilidad y clara separación de responsabilidades**.

---

## 2. Enfoque Arquitectónico

El servicio aprovecha una combinación de **Arquitectura Limpia (Hexagonal)** y **CQRS**.

### 2.1. Arquitectura Limpia / Arquitectura Hexagonal

Esto asegura que la lógica de negocio central sea independiente de factores externos como frameworks o bases de datos.

* **Capa de Dominio (`src/orders/domain`):** Contiene entidades centrales (`Order`, `OrderItem`, `OrderReceipt`), objetos de valor (enum `OrderStatus`), e interfaces de Puerto (`OrderRepositoryPort`, `ProductServicePort`, `PaymentServicePort`) definiendo contratos para infraestructura.
* **Capa de Aplicación (`src/orders/application`):** Orquesta casos de uso vía Comandos, Consultas y sus Manejadores. Usa DTOs para transferencia y validación de datos. Depende solo de la capa de Dominio.
* **Capa de Infraestructura (`src/orders/infrastructure`, `src/shared/infrastructure`, `src/config`, `src/transports`):** Proporciona implementaciones concretas y se ocupa de preocupaciones externas. Incluye Adaptadores (`PrismaOrderRepository`, `NatsProductServiceAdapter`, `NatsPaymentServiceAdapter`), Controladores (`OrdersController` para NATS), módulos NestJS, configuración, conexión de base de datos, y filtros/interceptores compartidos.

**Beneficios:** Alta capacidad de prueba, mantenibilidad y flexibilidad en intercambiar componentes de infraestructura.

### 2.2. CQRS (Command Query Responsibility Segregation)

Implementado vía `@nestjs/cqrs`, este patrón separa operaciones de escritura (Comando) y lectura (Consulta).

* **Comandos:** Crear Orden, Cambiar Estado de Orden, Marcar Orden Como Pagada.
* **Consultas:** Buscar Todas las Órdenes (paginadas/filtradas), Buscar Una Orden.
* **Manejadores:** Contienen la lógica para cada comando/consulta, interactuando con entidades de dominio y puertos.

**Beneficios:** Intención de código más clara, potencial para escalado independiente de lectura/escritura, lógica de manejador enfocada.

### 2.3. Comunicación Inter-Servicios

Este microservicio interactúa con servicios externos vía Puertos definidos y Adaptadores basados en NATS:

* **Servicio de Productos:** Usado vía `ProductServicePort` / `NatsProductServiceAdapter` para validar IDs de productos, verificar disponibilidad y recuperar precios durante la creación de órdenes.
* **Servicio de Pagos:** Usado vía `PaymentServicePort` / `NatsPaymentServiceAdapter` para iniciar una sesión de pago después de que se crea una orden.
* **Eventos de Pago:** Escucha eventos como `payment.succeeded` vía `@EventPattern` para actualizar el estado de la orden.

---

## 3. Estructura del Proyecto

```
src/
├── orders/                   # Módulo Principal de Característica: Órdenes
│   ├── application/          # Casos de Uso, CQRS, DTOs
│   │   ├── commands/         # Operaciones de Escritura (Create, ChangeStatus, MarkPaid)
│   │   ├── queries/          # Operaciones de Lectura (FindAll, FindOne)
│   │   └── dto/              # Objetos de Transferencia de Datos
│   ├── domain/                 # Lógica de Negocio Central y Abstracciones
│   │   ├── enums/            # --> Enum OrderStatus
│   │   ├── model/            # --> Entidades Order, OrderItem, OrderReceipt
│   │   └── ports/            # --> Puertos de Repositorio, Servicios Externos
│   └── infrastructure/         # Detalles de Implementación
│       ├── adapters/         # --> PrismaOrderRepository, NatsProductServiceAdapter, NatsPaymentServiceAdapter
│       └── controllers/      # --> OrdersController (NATS)
├── common/                   # DTOs Comunes (ej., PaginationDto)
├── config/                   # Configuración (envs.ts, services.ts)
├── shared/                   # Infraestructura Compartida (Prisma, Filtros, Interceptores)
│   └── infrastructure/
├── transports/               # Configuración del cliente de transporte (NatsModule)
├── app.module.ts             # Módulo Raíz de la Aplicación
└── main.ts                   # Bootstrap de la Aplicación
```

---

## 4. Tecnologías y Dependencias Clave

* **Node.js:** Entorno de ejecución.
* **TypeScript:** Lenguaje principal.
* **NestJS (`@nestjs/*`):** Framework central.
* **Prisma (`@prisma/client`, `prisma`):** ORM para interacciones con la base de datos.
* **NATS (`nats`, `@nestjs/microservices`):** Sistema de mensajería para transporte de microservicios y comunicación inter-servicios.
* **CQRS (`@nestjs/cqrs`):** Facilita el patrón Command Query Responsibility Segregation.
* **Class Validator / Class Transformer:** Para validación y transformación de DTOs.
* **Dotenv / Joi:** Gestión y validación de variables de entorno.

---

## 5. Configuración y Ejecución

### 5.1. Prerrequisitos

* Node.js (v16.13 o posterior recomendado)
* NPM o Yarn
* Instancia de servidor NATS ejecutándose.
* Acceso a servicios dependientes (MS de Productos, MS de Pagos) vía NATS.
* Servidor de base de datos PostgreSQL ejecutándose y accesible.

### 5.2. Instalación

```bash
npm install
# o
yarn install
```

### 5.3. Configuración del Entorno

Crea un archivo `.env` en la raíz del proyecto. Las variables requeridas están definidas en `src/config/envs.ts`:

```dotenv
# Ejemplo de .env
PORT=3002 # Puerto opcional, no usado directamente por el listener NATS

# Configuración NATS
NATS_SERVERS=nats://localhost:4222 # Lista separada por comas

# URL de Conexión a la Base de Datos (para Prisma)
DATABASE_URL="postgresql://orders_user:orders_password@orders-db:5432/orders_db?schema=public"
```

### 5.4. Migraciones de Base de Datos (Prisma)

Aplicar cambios de esquema y generar el cliente Prisma:

```bash
# Aplicar migraciones y generar cliente
npx prisma migrate dev --name init

# O solo generar cliente si el esquema no ha cambiado
npx prisma generate
```
*(El script `docker:start` combina estos).*

### 5.5. Ejecutar el Servicio

* **Desarrollo (con recarga en caliente):**
    ```bash
    # Asegurar que el servidor NATS y MS dependientes estén ejecutándose
    npm run start:dev
    ```
* **Producción:**
    ```bash
    npm run build
    npm run start:prod
    ```

El servicio se conecta a NATS y escucha mensajes/eventos.

---

## 6. API (Patrones de Mensaje/Evento NATS)

El `OrdersController` maneja los siguientes patrones:

* **`createOrder` (Patrón de Mensaje):**
    * **Payload:** `CreateOrderDto`
    * **Respuesta:** `CreateOrderResponseDto` (incluye detalles de Orden y Sesión de Pago) o `RpcException`.
* **`findAllOrders` (Patrón de Mensaje):**
    * **Payload:** `OrderPaginationDto`
    * **Respuesta:** `PaginatedOrderResult` o `RpcException`.
* **`findOneOrder` (Patrón de Mensaje):**
    * **Payload:** `{ id: string }`
    * **Respuesta:** `Order` (con nombres de artículos enriquecidos) o `RpcException` (ej., 404).
* **`changeOrderStatus` (Patrón de Mensaje):**
    * **Payload:** `ChangeOrderStatusDto`
    * **Respuesta:** `Order` actualizada o `RpcException`.
* **`payment.succeeded` (Patrón de Evento):**
    * **Payload:** `PaidOrderDto`
    * **Respuesta:** Ninguna (manejador de eventos). Dispara `MarkOrderAsPaidCommand`.

---

## 7. Manejo de Errores

* **Errores RPC Estandarizados:** Usa `RpcException` para patrones de solicitud/respuesta.
* **Filtro de Excepciones Global:** `AllExceptionsFilter` captura y formatea todos los errores de manera consistente para respuestas RPC.
* **Validación de Entrada:** `ValidationPipe` global asegura que se cumplan las restricciones de DTOs.
* **Errores Inter-Servicios:** Errores de servicios de Productos o Pagos (recibidos vía adaptadores NATS) se capturan y típicamente se re-lanzan como `RpcException`.

---

## 8. Mejores Prácticas Empleadas

* **Inyección de Dependencias:** Central a NestJS y usado en todo el sistema.
* **Separación de Responsabilidades:** Capas de Arquitectura Limpia y CQRS.
* **Diseño Basado en Interfaces (Puertos y Adaptadores):** Para abstracción de infraestructura.
* **Gestión de Configuración:** Variables de entorno centralizadas y validadas.
* **Seguridad de Tipos:** Vía TypeScript y Prisma.
* **DTOs y Validación:** Contratos de datos claros y validación de límites.
* **Programación Asíncrona:** `async/await` para operaciones I/O.
* **Operaciones Transaccionales:** La creación de órdenes y marcado como pagadas involucran múltiples operaciones de base de datos, manejadas transaccionalmente dentro del adaptador Prisma donde es apropiado.
* **Comunicación Inter-Servicios:** Usa adaptadores dedicados (`NatsProductServiceAdapter`, `NatsPaymentServiceAdapter`) para interacción con servicios externos. 
