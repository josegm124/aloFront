# aloFront

Frontend for the CertifAI MVP.

Safe branch for the local MVP flow:
- `feature/RBSai`

Do not push unfinished local-only changes to `master`, because `master` is tied to Vercel deployment.

## Local run

```bash
cd /home/jose-guerrero/Desktop/aloFront
ALOCHAT_LOCAL_MODE=true npm run start -- --hostname 127.0.0.1 --port 3000
```

Open:
- `http://127.0.0.1:3000`

## Local backend expectation

The frontend local mode expects these backend services:
- assessment: `http://localhost:8080`
- document: `http://localhost:8082`
- report: `http://localhost:8086`
- notification: `http://localhost:8087`

## Current local MVP flow

The current local UI path supports:
- create assessment
- upload PDF
- receive document analysis
- generate final report
- open the web report
- download the PDF
- generate a notification payload without real email
