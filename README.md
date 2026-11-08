# Biblioteca · API y sitio web

API REST y aplicación web de la biblioteca, construidas con **Next.js 16 (App Router)** sobre **Firebase Auth + Firestore**.

- **Producción:** https://library-api-seven-bice.vercel.app
- **Documentación interactiva:** https://library-api-seven-bice.vercel.app/api/docs
- **OpenAPI 3:** https://library-api-seven-bice.vercel.app/api/openapi.json

## Stack

| Pieza | Versión |
|---|---|
| Next.js | 16.4 (App Router, Route Handlers) |
| React | 19.3 |
| TypeScript | strict |
| Firebase Admin SDK | 13 |
| Validación | Zod 4 |
| Estilos | Tailwind CSS 4 |
| Pruebas | Vitest 5 |

## Requisitos

- Node 22.5 o superior (probado con 22.23)
- pnpm 10 o superior
- Un proyecto de Firebase con **Authentication (correo/contraseña)** y **Firestore**

## Puesta en marcha

```bash
pnpm install
cp .env.example .env      # completa las credenciales de Firebase
pnpm seed                 # carga los 10 libros del catálogo
pnpm dev                  # http://localhost:3000
```

Para probar desde un teléfono en la misma red:

```bash
pnpm dev:lan              # escucha en 0.0.0.0
```

## Variables de entorno

Ninguna de estas variables debe subirse al repositorio.

| Variable | Dónde se obtiene |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Configuración del proyecto |
| `FIREBASE_CLIENT_EMAIL` | Cuentas de servicio → generar clave privada |
| `FIREBASE_PRIVATE_KEY` | Igual que la anterior (con `\n` escapados y entre comillas) |
| `FIREBASE_WEB_API_KEY` | Configuración del proyecto → General → Clave de API web |

En Vercel se configuran en *Settings → Environment Variables* y luego se hace **Redeploy**.

## Comandos

```bash
pnpm dev            # servidor de desarrollo
pnpm dev:lan        # accesible desde la red local
pnpm build          # build de producción
pnpm typecheck      # next typegen + tsc --noEmit
pnpm test           # Vitest (36 pruebas)
pnpm lint           # ESLint
pnpm smoke          # 41 comprobaciones contra la API en marcha
```

### Scripts de administración

Todos usan el service account del `.env`.

```bash
pnpm seed                                            # catálogo inicial
pnpm create-user -- correo "Clave123" "Nombre" librarian   # crea/actualiza con rol
pnpm set-role -- correo librarian                    # cambia el rol de un usuario
pnpm reset-demo                                      # borra préstamos y portadas, restaura libros
```

`create-user` crea el usuario en Firebase Auth, asigna el claim `role`, lo guarda en Firestore y **verifica iniciando sesión** para comprobar que el rol viaja en el token.

Los usuarios nuevos que se registran desde `/register` o desde la app nacen como `student`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | público | Registro de estudiante |
| POST | `/api/auth/login` | público | Login; devuelve tokens y usuario |
| POST | `/api/auth/refresh` | público | Renueva el idToken |
| GET | `/api/auth/me` | Bearer | Usuario de la sesión |
| GET | `/api/books` | Bearer | Catálogo; `?q=` y `?updatedSince=` |
| GET | `/api/books/[id]` | Bearer | Detalle de un libro |
| PUT | `/api/books/[id]/cover` | librarian | Sube la portada (base64) |
| GET | `/api/loans` | Bearer | Estudiante: los suyos · Bibliotecario: todos |
| POST | `/api/loans` | student | Solicita un préstamo (idempotente por `clientRequestId`) |
| PATCH | `/api/loans/[id]` | librarian | `approve` · `reject` · `return` |
| GET | `/api/health` | público | Estado del servicio |
| GET | `/api/docs` | público | Documentación interactiva |

Los errores siguen un formato estable: `{ "error": { "code": "...", "message": "..." } }`, con códigos como `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `ALREADY_ACTIVE`, `NO_COPIES`, `INVALID_STATE` o `RATE_LIMITED`.

## Estructura

```
app/
├── (auth)/login, register        # páginas públicas
├── (app)/books, loans            # páginas protegidas
├── api/                          # Route Handlers
└── page.tsx                      # redirección según sesión
lib/
├── data/                         # acceso a Firestore
├── domain/loan-rules.ts          # reglas de préstamo (stock, estados)
├── services/auth.ts              # login, registro, refresh
├── schemas.ts                    # validación Zod
├── guard.ts                      # autenticación y roles
├── http.ts, errors.ts            # respuestas y errores tipados
├── image.ts                      # validación de portadas
├── openapi.ts                    # especificación OpenAPI
└── web/session.ts                # cookie httpOnly para la web
scripts/                          # seed, usuarios, smoke, reset-demo
```

## Seguridad

- Autenticación por **Bearer token** en la API; la web usa una **cookie httpOnly**.
- Roles por *custom claims* (`student` / `librarian`), verificados en el servidor.
- Validación de entrada con Zod y consultas parametrizadas en Firestore.
- Reglas de Firestore en `allow read, write: if false`: solo el Admin SDK accede a los datos.
- Límite de tamaño y tipo en la subida de portadas.

## Pruebas

```bash
pnpm test     # 36 pruebas en 6 archivos
pnpm smoke    # requiere la API en marcha y credenciales en .env
```

`smoke` recorre el flujo completo contra la API real: salud, catálogo, login, permisos por rol, préstamo, aprobación, devolución, conflictos y portadas.

## Despliegue

El proyecto está desplegado en Vercel. Para publicar cambios:

1. Configura las 4 variables de entorno en Vercel (la private key **sin comillas**).
2. `git push` a `main` (Vercel construye y despliega automáticamente), o **Redeploy** si solo cambiaste variables.
