# CRM-CareFlow Data Flow Architecture

This document provides comprehensive data flow diagrams showing how data moves through all layers of the CRM-CareFlow system.

---

## 1. System Overview

High-level architecture showing all services and their interactions.

```mermaid
flowchart TB
    subgraph External["External Services"]
        LM["LoRaWAN Manager<br/>:3002"]
        CS["ChirpStack<br/>LoRaWAN NS"]
        WA["WhatsApp<br/>Cloud API"]
    end

    subgraph Browser["Client Browser"]
        UI["Next.js Frontend<br/>:3005"]
    end

    subgraph API["Backend Services"]
        BE["NestJS Backend<br/>:3004"]
        Prisma["Prisma Client"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL<br/>:5432")]
    end

    UI -->|"HTTPS JSON<br/>(JWT Auth)"| BE
    BE --> Prisma
    Prisma --> PG

    BE -->|"POST /webhooks<br/>(API Key)"| LM
    LM -->|"gRPC"| CS
    BE -->|"Graph API<br/>(Bearer Token)"| WA

    style UI fill:#61dafb
    style BE fill:#e0234e
    style PG fill:#336791
    style LM fill:#00b894
    style CS fill:#00b894
    style WA fill:#25d366
```

### Service Responsibilities

| Service | Port | Purpose |
|---------|------|---------|
| **Next.js Frontend** | 3005 | React UI, role-based dashboards, form handling |
| **NestJS Backend** | 3004 | REST API, business logic, auth, integrations |
| **PostgreSQL** | 5432 | Primary data store (via Prisma ORM) |
| **LoRaWAN Manager** | 3002 | Device provisioning orchestration |
| **ChirpStack** | - | LoRaWAN Network Server (external) |
| **WhatsApp Cloud API** | - | Customer notifications |

---

## 2. Authentication Flow

Sequence diagram showing the complete login flow from user action to authenticated session.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant LF as Login Form
    participant AX as Axios Client
    participant AC as AuthController
    participant AS as AuthService
    participant LAS as LocalAuthService
    participant JWT as JwtService
    participant ZS as Zustand Store
    participant LS as localStorage

    U->>LF: Enter email/password
    LF->>AX: POST /auth/login {email, password}
    AX->>AC: HTTP Request
    AC->>AS: login(email, password)
    AS->>LAS: validateUser(email, password)
    LAS->>LAS: bcrypt.compare(password, hash)

    alt Invalid Credentials
        LAS-->>AS: null
        AS-->>AC: UnauthorizedException
        AC-->>AX: 401 Unauthorized
        AX-->>LF: Error response
        LF-->>U: "Invalid credentials"
    else Valid Credentials
        LAS-->>AS: User object
        AS->>JWT: sign({sub: user.id})
        JWT-->>AS: access_token
        AS-->>AC: {access_token, user}
        AC-->>AX: 200 OK + payload
        AX->>ZS: setAuth({token, user})
        ZS->>LS: persist state
        ZS-->>LF: Auth state updated
        LF-->>U: Redirect to dashboard
    end
```

### Token Structure

```typescript
// JWT Payload
{
  sub: string;     // user.id
  iat: number;     // issued at
  exp: number;     // expiration (1h default)
}

// Auth Response
{
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: {
      id: string;
      name: "ADMIN" | "SALES" | "IMPLEMENTATION_LEAD" | "HARDWARE_ENGINEER";
      permissions: Record<string, boolean>;
    }
  }
}
```

---

## 3. Frontend Data Flow

Flowchart showing how data flows through the React application.

```mermaid
flowchart TB
    subgraph UserInteraction["User Interaction"]
        UA[User Action]
        EV[Event Handler]
    end

    subgraph StateManagement["State Management"]
        ZS["Zustand Store<br/>(Auth, Permissions)"]
        TQ["TanStack Query<br/>(Server State)"]
    end

    subgraph NetworkLayer["Network Layer"]
        AX["Axios Client"]
        INT["Interceptors"]
    end

    subgraph Backend["Backend API"]
        API["NestJS :3004"]
    end

    subgraph UIUpdate["UI Update"]
        RC["React Component"]
        RR["Re-render"]
    end

    UA --> EV
    EV -->|"useQuery / useMutation"| TQ
    TQ -->|"API call"| AX
    AX --> INT
    INT -->|"Add JWT Header"| API

    API -->|"Response"| INT
    INT -->|"401? Clear Auth"| ZS
    INT -->|"Success"| TQ
    TQ -->|"Cache Update<br/>(staleTime: 10min)"| RC
    RC --> RR
    RR --> UA

    ZS -->|"Persist"| LS["localStorage"]

    style TQ fill:#ff4154
    style ZS fill:#593d88
    style AX fill:#5a29e4
```

### Axios Interceptor Flow

```mermaid
flowchart LR
    subgraph Request["Request Interceptor"]
        R1["Get token from<br/>useAuthStore"]
        R2["Add Authorization<br/>Bearer header"]
    end

    subgraph Response["Response Interceptor"]
        S1{"Status 401?"}
        S2["clearAuth()"]
        S3["redirect('/login')"]
        S4["Return response"]
    end

    R1 --> R2
    R2 -->|"Send"| API["Backend"]
    API -->|"Response"| S1
    S1 -->|"Yes"| S2
    S2 --> S3
    S1 -->|"No"| S4
```

---

## 4. Backend Request Pipeline

Flowchart showing how requests flow through NestJS guards and handlers.

```mermaid
flowchart TB
    subgraph Incoming["Incoming Request"]
        REQ["HTTP Request"]
        HEAD["Headers:<br/>Authorization: Bearer {jwt}"]
    end

    subgraph Guards["Guard Chain"]
        JWT["JwtAuthGuard<br/>(Passport)"]
        ROLE["RolesGuard<br/>(@Roles decorator)"]
        PERM["PermissionsGuard<br/>(optional)"]
    end

    subgraph Processing["Request Processing"]
        CTRL["Controller<br/>(route handler)"]
        SVC["Service<br/>(business logic)"]
        PRISMA["PrismaService<br/>(DB queries)"]
    end

    subgraph Response["Response"]
        TRANS["Response<br/>Transformation"]
        RES["HTTP Response"]
    end

    subgraph Errors["Error Handling"]
        EXC["AllExceptionsFilter"]
        VAL["ValidationExceptionFilter"]
    end

    REQ --> HEAD
    HEAD --> JWT

    JWT -->|"Valid Token"| ROLE
    JWT -->|"Invalid/Expired"| EXC

    ROLE -->|"Role Allowed"| PERM
    ROLE -->|"Role Forbidden"| EXC

    PERM -->|"Pass"| CTRL
    CTRL --> SVC
    SVC --> PRISMA
    PRISMA -->|"Query Result"| SVC
    SVC -->|"Return Data"| TRANS
    TRANS --> RES

    EXC --> VAL
    VAL -->|"Formatted Error"| RES

    style JWT fill:#f39c12
    style ROLE fill:#e74c3c
    style PRISMA fill:#336791
```

### Guard Execution Order

```mermaid
sequenceDiagram
    participant R as Request
    participant J as JwtAuthGuard
    participant JS as JwtStrategy
    participant RG as RolesGuard
    participant RF as Reflector
    participant C as Controller

    R->>J: canActivate()
    J->>JS: validate(payload)
    JS->>JS: Extract user from DB
    JS-->>J: user object
    J->>J: Attach user to request
    J-->>R: true

    R->>RG: canActivate()
    RG->>RF: get('roles', handler)
    RF-->>RG: ['ADMIN', 'SALES']
    RG->>RG: Check user.role.name

    alt Role matches
        RG-->>R: true
        R->>C: Execute handler
    else Role forbidden
        RG-->>R: ForbiddenException
    end
```

---

## 5. Workflow State Machine

State diagram showing the OnboardingTask lifecycle with role-based transition guards.

```mermaid
stateDiagram-v2
    [*] --> INITIALIZATION: Task Created

    INITIALIZATION --> SCHEDULED_VISIT: IMPL_LEAD<br/>set_schedule
    note right of INITIALIZATION: Initial state<br/>Task just created

    SCHEDULED_VISIT --> REQUIREMENTS_COMPLETE: IMPL_LEAD<br/>submit_technical_report
    note right of SCHEDULED_VISIT: Site visit scheduled<br/>Date set

    REQUIREMENTS_COMPLETE --> HARDWARE_PROCUREMENT_COMPLETE: HW_ENGINEER<br/>submit_hardware_list
    note right of REQUIREMENTS_COMPLETE: Technical report<br/>submitted

    HARDWARE_PROCUREMENT_COMPLETE --> HARDWARE_PREPARED_COMPLETE: HW_ENGINEER
    note right of HARDWARE_PROCUREMENT_COMPLETE: Hardware list<br/>finalized

    HARDWARE_PREPARED_COMPLETE --> READY_FOR_INSTALLATION: HW_ENGINEER<br/>generate_qr
    note right of HARDWARE_PREPARED_COMPLETE: Devices provisioned<br/>QR codes generated

    READY_FOR_INSTALLATION --> [*]: Installation Complete
    note right of READY_FOR_INSTALLATION: LoRaWAN webhook sent<br/>Ready for field work

    %% Admin reverse transitions (dashed)
    SCHEDULED_VISIT --> INITIALIZATION: ADMIN only
    REQUIREMENTS_COMPLETE --> SCHEDULED_VISIT: ADMIN only
    HARDWARE_PROCUREMENT_COMPLETE --> REQUIREMENTS_COMPLETE: ADMIN only
    HARDWARE_PREPARED_COMPLETE --> HARDWARE_PROCUREMENT_COMPLETE: ADMIN only
    READY_FOR_INSTALLATION --> HARDWARE_PREPARED_COMPLETE: ADMIN only
```

### Transition Rules

```mermaid
flowchart TB
    subgraph Input["Transition Request"]
        REQ["updateStatus(taskId, newStatus)"]
        USER["Current User"]
    end

    subgraph Validation["StatusTransitionService"]
        V1{"Current status<br/>exists?"}
        V2{"Transition<br/>allowed?"}
        V3{"User has<br/>required role?"}
        V4{"Required action<br/>completed?"}
    end

    subgraph Actions["Conditional Actions"]
        A1["Generate QR Codes"]
        A2["Send LoRaWAN Webhook"]
        A3["Send WhatsApp Notification"]
    end

    subgraph Result["Result"]
        OK["Status Updated"]
        ERR["ForbiddenException"]
    end

    REQ --> V1
    USER --> V3

    V1 -->|"Yes"| V2
    V1 -->|"No"| ERR

    V2 -->|"Yes"| V3
    V2 -->|"No"| ERR

    V3 -->|"Yes"| V4
    V3 -->|"No"| ERR

    V4 -->|"Yes"| OK
    V4 -->|"No"| ERR

    OK -->|"READY_FOR_INSTALLATION"| A1
    A1 --> A2
    A2 --> A3

    style V1 fill:#3498db
    style V2 fill:#3498db
    style V3 fill:#e74c3c
    style V4 fill:#f39c12
```

---

## 6. LoRaWAN Integration Flow

Sequence diagram showing the device provisioning webhook flow.

```mermaid
sequenceDiagram
    autonumber
    participant WS as WorkflowService
    participant QR as QrCodeService
    participant LWH as LorawanWebhookService
    participant DB as PrismaService
    participant LM as LoRaWAN Manager<br/>:3002
    participant CS as ChirpStack

    WS->>WS: updateStatus(READY_FOR_INSTALLATION)
    WS->>QR: generateQrCodes(deviceProvisionings)
    QR-->>WS: QR codes generated

    WS->>LWH: sendProvisioningWebhook(taskId)

    LWH->>DB: Query task with relations
    DB-->>LWH: Task + Product + Devices + Client

    LWH->>LWH: buildProvisioningPayload()

    LWH->>DB: Create WebhookLog (PENDING)

    loop Retry Logic (max 3 attempts)
        LWH->>LM: POST /webhooks/crm-careflow/provision
        Note over LWH,LM: Headers: x-api-key, x-request-id

        alt Success (2xx)
            LM->>CS: gRPC: Create Tenant
            LM->>CS: gRPC: Create DeviceProfile
            LM->>CS: gRPC: Create Application
            LM->>CS: gRPC: Create Devices
            CS-->>LM: Success
            LM-->>LWH: 202 Accepted
            LWH->>DB: Update WebhookLog (SUCCESS)
            LWH->>DB: Update DeviceProvisioning (COMPLETED)
        else Failure (4xx/5xx/timeout)
            LM-->>LWH: Error response
            LWH->>LWH: Wait (1s, 5s, 15s backoff)
            LWH->>DB: Update WebhookLog (RETRYING)
        end
    end

    alt All retries failed
        LWH->>DB: Update WebhookLog (FAILED)
        LWH->>DB: Update DeviceProvisioning (FAILED)
        LWH-->>WS: Log error (async, non-blocking)
    end
```

### Webhook Payload Structure

```mermaid
flowchart LR
    subgraph Payload["Provisioning Payload"]
        direction TB
        M["Meta"]
        C["Client Info"]
        P["Product Info"]
        D["Devices[]"]
        G["Gateway (optional)"]
        L["Location"]
    end

    M --> |eventType| T1["task.ready_for_provisioning"]
    M --> |taskId| T2["cuid"]

    C --> |clientName| C1["string"]
    C --> |clientAddress| C2["string"]
    C --> |contactEmail| C3["string"]
    C --> |contactPhone| C4["string"]

    P --> |productName| P1["string"]
    P --> |productCode| P2["string"]
    P --> |region| P3["AS923/EU868/US915"]

    D --> |deviceSerial| D1["string (unique)"]
    D --> |devEui| D2["16-char hex"]
    D --> |appKey| D3["32-char hex"]
    D --> |deviceType| D4["string"]

    L --> |latitude| L1["float"]
    L --> |longitude| L2["float"]
```

---

## 7. Device Provisioning Lifecycle

Flowchart showing the complete device provisioning process from hardware selection to ChirpStack registration.

```mermaid
flowchart TB
    subgraph Phase1["1. Hardware Selection"]
        HP["HardwareProcurement<br/>Created"]
        HW["Select Hardware<br/>from Catalog"]
        QTY["Set Quantity"]
    end

    subgraph Phase2["2. Device Assignment"]
        DP["DeviceProvisioning<br/>Records Created"]
        SER["Assign Device Serials<br/>(unique)"]
        FW["Set Firmware Version"]
    end

    subgraph Phase3["3. LoRaWAN Keys"]
        DEV["Generate/Assign<br/>DevEUI (16 hex)"]
        APP["Generate/Assign<br/>AppKey (32 hex)"]
        STAT["Status: PENDING"]
    end

    subgraph Phase4["4. QR Generation"]
        QR["Generate QR Codes<br/>for each device"]
        STORE["Store QR data<br/>in DeviceProvisioning"]
    end

    subgraph Phase5["5. Webhook Dispatch"]
        WH["Send to LoRaWAN Manager"]
        STAT2["Status: IN_PROGRESS"]
    end

    subgraph Phase6["6. ChirpStack Registration"]
        CS["LoRaWAN Manager<br/>creates in ChirpStack"]
        STAT3{"Result?"}
        SUCC["Status: COMPLETED"]
        FAIL["Status: FAILED"]
    end

    HP --> HW --> QTY
    QTY --> DP
    DP --> SER --> FW
    FW --> DEV --> APP --> STAT
    STAT --> QR --> STORE
    STORE --> WH --> STAT2
    STAT2 --> CS --> STAT3
    STAT3 -->|"Success"| SUCC
    STAT3 -->|"Error"| FAIL

    style HP fill:#3498db
    style DP fill:#9b59b6
    style QR fill:#f39c12
    style CS fill:#00b894
    style SUCC fill:#27ae60
    style FAIL fill:#e74c3c
```

### Device States

```mermaid
stateDiagram-v2
    [*] --> PENDING: DeviceProvisioning created
    PENDING --> IN_PROGRESS: Webhook sent
    IN_PROGRESS --> COMPLETED: ChirpStack success
    IN_PROGRESS --> FAILED: ChirpStack error
    FAILED --> IN_PROGRESS: Retry
    COMPLETED --> [*]

    note right of PENDING: DevEUI/AppKey assigned
    note right of IN_PROGRESS: Waiting for ChirpStack
    note right of COMPLETED: Device active in network
    note right of FAILED: Error logged, retry possible
```

---

## 8. Database Entity Relationships

ER diagram showing the key database models and their relationships.

```mermaid
erDiagram
    User ||--o{ OnboardingTask : "assignedTo"
    User ||--o{ TechnicalReport : "submittedBy"
    User ||--o{ DeviceProvisioning : "provisionedBy"
    User }o--|| Role : "hasRole"

    Role {
        string id PK
        string name UK "ADMIN|SALES|IMPL_LEAD|HW_ENGINEER"
        json permissions
    }

    User {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string roleId FK
        boolean isActive
    }

    Client ||--o{ OnboardingTask : "has"
    Client {
        string id PK
        string name UK
        string address
        string notes
        boolean isActive
    }

    Product ||--o{ OnboardingTask : "for"
    Product ||--o| SOPTemplate : "has"
    Product ||--o| ReportSchema : "has"
    Product ||--o{ ProductHardwareConfig : "configures"
    Product {
        string id PK
        string name
        string code UK
        string description
        boolean isActive
        boolean isLorawanProduct
        string lorawanRegion
    }

    OnboardingTask ||--o{ DeviceProvisioning : "provisions"
    OnboardingTask ||--o{ HardwareProcurement : "requires"
    OnboardingTask ||--o{ TechnicalReport : "generates"
    OnboardingTask ||--o{ WebhookLog : "logs"
    OnboardingTask {
        string id PK
        string clientId FK
        string productId FK
        string assignedUserId FK
        enum currentStatus "TaskStatus"
        json sopSnapshot
        datetime scheduledDate
        float latitude
        float longitude
        string clientName
        string clientEmail
        string clientPhone
        string clientAddress
        string contactPerson
    }

    HardwareCategory ||--o{ Hardware : "contains"
    HardwareCategory {
        string id PK
        string name UK
        string description
        string icon
        boolean isActive
    }

    Hardware ||--o{ ProductHardwareConfig : "usedIn"
    Hardware ||--o{ HardwareProcurement : "procured"
    Hardware ||--o{ DeviceProvisioning : "provisioned"
    Hardware {
        string id PK
        string name
        string code UK
        string description
        string categoryId FK
        string manufacturer
        boolean isActive
    }

    ProductHardwareConfig {
        string productId FK
        string hardwareId FK
        string firmwareVersion
        string firmwareUrl
        boolean isDefault
        string notes
    }

    HardwareProcurement {
        string id PK
        string taskId FK
        string hardwareId FK
        int quantity
        string notes
    }

    DeviceProvisioning {
        string id PK
        string taskId FK
        string hardwareId FK
        string deviceSerial UK
        string deviceType
        string firmwareVersion
        string qrCode
        string provisionedById FK
        string devEui
        string appKey
        enum lorawanProvisioningStatus
        string lorawanProvisioningError
        datetime provisionedAt
    }

    TechnicalReport {
        string id PK
        string taskId FK
        string submittedById FK
        json submissionData
        datetime submittedAt
    }

    SOPTemplate {
        string id PK
        string productId FK UK
        json steps
        int version
    }

    ReportSchema {
        string id PK
        string productId FK UK
        json formStructure
        int version
    }

    WebhookLog {
        string id PK
        string taskId FK
        string webhookType
        string endpoint
        json payload
        enum status "PENDING|SUCCESS|FAILED|RETRYING"
        int statusCode
        json response
        string errorMessage
        int attempts
        datetime lastAttempt
    }
```

---

## 9. Notification Flow

Flowchart showing the WhatsApp notification triggers and flow.

```mermaid
flowchart TB
    subgraph Triggers["Notification Triggers"]
        T1["Task Created"]
        T2["Report Submitted"]
        T3["Device Provisioned"]
        T4["Task Completed"]
    end

    subgraph Service["NotificationsService"]
        NS["sendWhatsAppNotification()"]
        TPL["Select Template"]
        BUILD["Build Message"]
    end

    subgraph Templates["Message Templates"]
        M1["taskCreated<br/>New task assigned"]
        M2["reportSubmitted<br/>Report ready for review"]
        M3["deviceProvisioned<br/>Device ready"]
        M4["taskCompleted<br/>Installation complete"]
    end

    subgraph API["WhatsApp Cloud API"]
        WA["POST /messages<br/>graph.facebook.com/v18.0"]
        RETRY["Retry Logic<br/>(3 attempts, 1s delay)"]
    end

    subgraph Delivery["Delivery"]
        USER["User's WhatsApp"]
    end

    T1 --> NS
    T2 --> NS
    T3 --> NS
    T4 --> NS

    NS --> TPL
    TPL --> M1 & M2 & M3 & M4
    M1 & M2 & M3 & M4 --> BUILD
    BUILD --> WA
    WA --> RETRY
    RETRY --> USER

    style WA fill:#25d366
    style USER fill:#25d366
```

---

## 10. Complete Request Flow Example

End-to-end example: Creating a new task and progressing to installation-ready.

```mermaid
sequenceDiagram
    autonumber
    participant Sales as Sales User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant LM as LoRaWAN Manager
    participant WA as WhatsApp API

    Note over Sales,WA: Phase 1: Task Creation
    Sales->>FE: Fill task form
    FE->>BE: POST /tasks {client, product, ...}
    BE->>DB: Create OnboardingTask (INITIALIZATION)
    BE->>DB: Snapshot SOP template
    BE->>WA: Send taskCreated notification
    WA-->>BE: 200 OK
    BE-->>FE: Task created
    FE-->>Sales: Redirect to task detail

    Note over Sales,WA: Phase 2: Schedule Visit
    Sales->>FE: Set scheduled date
    FE->>BE: PATCH /tasks/{id}/status {SCHEDULED_VISIT}
    BE->>BE: Validate: IMPL_LEAD role required
    BE->>DB: Update status
    BE-->>FE: Status updated

    Note over Sales,WA: Phase 3: Submit Report
    Sales->>FE: Fill technical report
    FE->>BE: POST /tasks/{id}/reports
    BE->>DB: Create TechnicalReport
    FE->>BE: PATCH /tasks/{id}/status {REQUIREMENTS_COMPLETE}
    BE->>DB: Update status
    BE->>WA: Send reportSubmitted notification

    Note over Sales,WA: Phase 4: Hardware Procurement
    Sales->>FE: Select hardware items
    FE->>BE: POST /tasks/{id}/hardware-procurement
    BE->>DB: Create HardwareProcurement records
    FE->>BE: PATCH /tasks/{id}/status {HARDWARE_PROCUREMENT_COMPLETE}
    BE->>DB: Update status

    Note over Sales,WA: Phase 5: Device Provisioning
    Sales->>FE: Assign device serials & keys
    FE->>BE: POST /tasks/{id}/device-provisioning
    BE->>DB: Create DeviceProvisioning records
    FE->>BE: PATCH /tasks/{id}/status {HARDWARE_PREPARED_COMPLETE}
    BE->>DB: Update status

    Note over Sales,WA: Phase 6: Ready for Installation
    Sales->>FE: Mark ready
    FE->>BE: PATCH /tasks/{id}/status {READY_FOR_INSTALLATION}
    BE->>BE: Generate QR codes
    BE->>DB: Update DeviceProvisioning with QR data
    BE->>DB: Update status

    BE->>LM: POST /webhooks/crm-careflow/provision
    activate LM
    LM-->>BE: 202 Accepted
    deactivate LM
    BE->>DB: Log webhook (WebhookLog)
    BE->>WA: Send deviceProvisioned notification

    BE-->>FE: Status updated + QR codes
    FE-->>Sales: Display installation package
```

---

## Appendix: Key File References

### Backend

| Component | File Path |
|-----------|-----------|
| Auth Module | `backend/src/auth/` |
| JWT Strategy | `backend/src/auth/jwt.strategy.ts` |
| Roles Guard | `backend/src/auth/guards/roles.guard.ts` |
| Workflow Service | `backend/src/workflow/workflow.service.ts` |
| Status Transitions | `backend/src/workflow/status-transition.service.ts` |
| LoRaWAN Webhook | `backend/src/integrations/lorawan/lorawan-webhook.service.ts` |
| Notifications | `backend/src/notifications/notifications.service.ts` |
| Prisma Schema | `backend/prisma/schema.prisma` |

### Frontend

| Component | File Path |
|-----------|-----------|
| Auth Store | `frontend/lib/zustand-store/store.ts` |
| API Client | `frontend/services/api.ts` |
| Auth Hooks | `frontend/hooks/useAuth.ts` |
| TanStack Setup | `frontend/TanStackQuery.Providers.tsx` |
| Login Page | `frontend/app/login/page.tsx` |

---

*Last updated: January 2025*
