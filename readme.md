# Purchases Orders Microservice (`purchases-orders-microservice`)

## 1. Overview

This project implements an Orders Microservice using **NestJS**, named `purchases-orders-microservice` as per `package.json`. It is architected using **Clean Architecture (Hexagonal Architecture)** principles and the **Command Query Responsibility Segregation (CQRS)** pattern. Its core responsibility is to manage the lifecycle of customer orders within a larger e-commerce or purchasing system.

Key functionalities include:

* Creating new orders based on product items.
* Retrieving order details (individual and paginated lists).
* Updating the status of an order (e.g., PENDING, PAID, DELIVERED, CANCELLED).
* Handling payment success events to mark orders as paid.
* Interacting with Product and Payment microservices via NATS for validation and processing.

The microservice communicates via **NATS** messaging, utilizes **Prisma** with SQLite for data persistence, and relies on external services for product information and payment processing. The architecture prioritizes **maintainability, testability, scalability, and clear separation of concerns**.

---

## 2. Architectural Approach

The service leverages a combination of **Clean Architecture (Hexagonal)** and **CQRS**.

### 2.1. Clean Architecture / Hexagonal Architecture

This ensures the core business logic is independent of external factors like frameworks or databases.

* **Domain Layer (`src/orders/domain`):** Contains core entities (`Order`, `OrderItem`, `OrderReceipt`), value objects (`OrderStatus` enum), and Port interfaces (`OrderRepositoryPort`, `ProductServicePort`, `PaymentServicePort`) defining contracts for infrastructure.
* **Application Layer (`src/orders/application`):** Orchestrates use cases via Commands, Queries, and their Handlers. It uses DTOs for data transfer and validation. Depends only on the Domain layer.
* **Infrastructure Layer (`src/orders/infrastructure`, `src/shared/infrastructure`, `src/config`, `src/transports`):** Provides concrete implementations and deals with external concerns. Includes Adapters (`PrismaOrderRepository`, `NatsProductServiceAdapter`, `NatsPaymentServiceAdapter`), Controllers (`OrdersController` for NATS), NestJS modules, configuration, database connection, and shared filters/interceptors.

**Benefits:** High testability, maintainability, and flexibility in swapping infrastructure components.

### 2.2. CQRS (Command Query Responsibility Segregation)

Implemented via `@nestjs/cqrs`, this pattern separates write (Command) and read (Query) operations.

* **Commands:** Create Order, Change Order Status, Mark Order As Paid.
* **Queries:** Find All Orders (paginated/filtered), Find One Order.
* **Handlers:** Contain the logic for each command/query, interacting with domain entities and ports.

**Benefits:** Clearer code intent, potential for independent read/write scaling, focused handler logic.

### 2.3. Inter-Service Communication

This microservice interacts with external services via defined Ports and NATS-based Adapters:

* **Product Service:** Used via `ProductServicePort` / `NatsProductServiceAdapter` to validate product IDs, check availability, and retrieve prices during order creation.
* **Payment Service:** Used via `PaymentServicePort` / `NatsPaymentServiceAdapter` to initiate a payment session after an order is created.
* **Payment Events:** Listens for events like `payment.succeeded` via `@EventPattern` to update order status.

---

## 3. Project Structure

```
src/
├── orders/                   # Main Feature Module: Orders
│   ├── application/          # Use Cases, CQRS, DTOs
│   │   ├── commands/         # Write Operations (Create, ChangeStatus, MarkPaid)
│   │   ├── queries/          # Read Operations (FindAll, FindOne)
│   │   └── dto/              # Data Transfer Objects
│   ├── domain/                 # Core Business Logic & Abstractions
│   │   ├── enums/            # --> OrderStatus Enum
│   │   ├── model/            # --> Order, OrderItem, OrderReceipt Entities
│   │   └── ports/            # --> Repository, External Service Ports
│   └── infrastructure/         # Implementation Details
│       ├── adapters/         # --> PrismaOrderRepository, NatsProductServiceAdapter, NatsPaymentServiceAdapter
│       └── controllers/      # --> OrdersController (NATS)
├── common/                   # Common DTOs (e.g., PaginationDto)
├── config/                   # Configuration (envs.ts, services.ts)
├── shared/                   # Shared Infrastructure (Prisma, Filters, Interceptors)
│   └── infrastructure/
├── transports/               # Transport client configuration (NatsModule)
├── app.module.ts             # Root Application Module
└── main.ts                   # Application Bootstrap
```

---

## 4. Key Technologies & Dependencies

* **Node.js:** Runtime environment.
* **TypeScript:** Primary language.
* **NestJS (`@nestjs/*`):** Core framework.
* **Prisma (`@prisma/client`, `prisma`):** ORM for database interactions.
* **NATS (`nats`, `@nestjs/microservices`):** Messaging system for microservice transport and inter-service communication.
* **CQRS (`@nestjs/cqrs`):** Facilitates Command Query Responsibility Segregation pattern.
* **Class Validator / Class Transformer:** For DTO validation and transformation.
* **Dotenv / Joi:** Environment variable management and validation.

---

## 5. Setup and Running

### 5.1. Prerequisites

* Node.js (v16.13 or later recommended)
* NPM or Yarn
* NATS Server instance running.
* Access to dependent services (Product MS, Payment MS) via NATS.
* A database compatible with the Prisma schema (default: SQLite).

### 5.2. Installation

```bash
npm install
# or
yarn install
```

### 5.3. Environment Configuration

Create a `.env` file in the project root. Required variables are defined in `src/config/envs.ts`:

```dotenv
# .env example
PORT=3002 # Optional port, not directly used by NATS listener

# NATS Configuration
NATS_SERVERS=nats://localhost:4222 # Comma-separated list

# Database Connection URL (for Prisma)
DATABASE_URL="file:./dev.db"
```

### 5.4. Database Migrations (Prisma)

Apply schema changes and generate the Prisma client:

```bash
# Apply migrations & generate client
npx prisma migrate dev --name init

# Or just generate client if schema is unchanged
npx prisma generate
```
*(The `docker:start` script combines these).*

### 5.5. Running the Service

* **Development (with hot-reloading):**
    ```bash
    # Ensure NATS server and dependent MS are running
    npm run start:dev
    ```
* **Production:**
    ```bash
    npm run build
    npm run start:prod
    ```

The service connects to NATS and listens for messages/events.

---

## 6. API (NATS Message/Event Patterns)

The `OrdersController` handles the following patterns:

* **`createOrder` (Message Pattern):**
    * **Payload:** `CreateOrderDto`
    * **Response:** `CreateOrderResponseDto` (includes Order and PaymentSession details) or `RpcException`.
* **`findAllOrders` (Message Pattern):**
    * **Payload:** `OrderPaginationDto`
    * **Response:** `PaginatedOrderResult` or `RpcException`.
* **`findOneOrder` (Message Pattern):**
    * **Payload:** `{ id: string }`
    * **Response:** `Order` (with enriched item names) or `RpcException` (e.g., 404).
* **`changeOrderStatus` (Message Pattern):**
    * **Payload:** `ChangeOrderStatusDto`
    * **Response:** Updated `Order` or `RpcException`.
* **`payment.succeeded` (Event Pattern):**
    * **Payload:** `PaidOrderDto`
    * **Response:** None (event handler). Triggers `MarkOrderAsPaidCommand`.

---

## 7. Error Handling

* **Standardized RPC Errors:** Uses `RpcException` for request/response patterns.
* **Global Exception Filter:** `AllExceptionsFilter` catches and formats all errors consistently for RPC responses.
* **Input Validation:** Global `ValidationPipe` ensures DTO constraints are met.
* **Inter-Service Errors:** Errors from Product or Payment services (received via NATS adapters) are caught and typically re-thrown as `RpcException`.

---

## 8. Best Practices Employed

* **Dependency Injection:** Core to NestJS and used throughout.
* **Separation of Concerns:** Clean Architecture layers & CQRS.
* **Interface-Based Design (Ports & Adapters):** For infrastructure abstraction.
* **Configuration Management:** Centralized and validated environment variables.
* **Type Safety:** Via TypeScript and Prisma.
* **DTOs & Validation:** Clear data contracts and boundary validation.
* **Asynchronous Programming:** `async/await` for I/O operations.
* **Transactional Operations:** Order creation and marking as paid involve multiple database operations, handled transactionally within the Prisma adapter where appropriate. *([Self-correction]: Added mention of transactional operations, specifically for `markAsPaid`)*.
* **Inter-Service Communication:** Uses dedicated adapters (`NatsProductServiceAdapter`, `NatsPaymentServiceAdapter`) for external service interaction.