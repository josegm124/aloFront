# aloFront

Frontend Next.js para desplegar en Vercel y conversar con `aloChat`.

## Variables de entorno
Crear `.env.local` con:

```bash
ALOCHAT_API_BASE_URL=https://tu-api-gateway.execute-api.us-east-1.amazonaws.com
ALOCHAT_WEB_TENANT_ID=acme
ALOCHAT_WEB_SIGNING_SECRET=reemplazar_con_hmac_real
```

## Flujo
- el navegador habla con rutas internas de Next
- Next firma el request con HMAC en el servidor
- Next envia `POST /api/v1/inbound/web` al backend
- luego hace polling de `GET /api/v1/web/messages/{messageId}`

## Desarrollo
```bash
npm install
npm run dev
```

## Rutas internas
- `POST /api/chat`
- `GET /api/chat/:messageId`
