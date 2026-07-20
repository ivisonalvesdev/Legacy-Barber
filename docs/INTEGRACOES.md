# Integrações externas — Legacy Barber

Guia central das APIs do projeto: o que já funciona, o que falta configurar e onde pegar cada chave.

> **Regra de segurança**
> - `VITE_*` → vão para o navegador. Só coisas **públicas** (URL de webhook, App ID, chave de Maps restrita por domínio).
> - Sem `VITE_` → **segredos**. Ficam no **n8n** (Credentials) ou em **Supabase Edge Functions**. Nunca no `.env` do front nem no código do browser.

Toda a lógica client-safe está centralizada em [`src/lib/integrations.ts`](../src/lib/integrations.ts).

---

## ✅ Já funcionam (nada a configurar)

### ViaCEP — endereço pelo CEP
- **Onde:** cadastro da barbearia (Painel Admin → Minha Barbearia).
- **Como:** o dono digita o CEP e rua/bairro/cidade/UF se preenchem sozinhos. Os campos ficam bloqueados até o CEP ser informado.
- API pública e gratuita, sem chave. Função `lookupCep()`.

### BrasilAPI — dados da empresa pelo CNPJ
- **Onde:** cadastro da barbearia, campo **CNPJ** (opcional).
- **Como:** ao digitar o CNPJ, puxa razão social, nome fantasia, telefone e endereço completo de uma vez.
- API pública e gratuita, sem chave. Função `lookupCnpj()`.
- Requer as colunas `cnpj` e `legal_name` na tabela `barbershops` — já incluídas em [`supabase/setup_final.sql`](../supabase/setup_final.sql). **Rode o script no SQL Editor** para criá-las.

---

## 🔧 A configurar depois

Para cada uma: crie a conta, pegue a chave e cole no `.env` (as `VITE_*`) ou nas Credentials do n8n (os segredos).

### 1. n8n — automação (a espinha dorsal) ⭐ *prioridade*
O app **já dispara** o evento `booking.created` toda vez que um agendamento é criado (pelo cliente ou walk-in do admin) — ver `fireEvent()` em `integrations.ts`. Falta só o destino:

1. Suba um n8n (n8n.cloud ou self-host).
2. Crie um workflow com um nó **Webhook** (método POST).
3. Copie a **Production URL** e cole em `VITE_N8N_WEBHOOK_URL` no `.env`.
4. No n8n, ramifique o fluxo: enviar WhatsApp, e-mail, push, etc.

**Payload recebido:**
```json
{
  "event": "booking.created",
  "at": "2026-07-18T14:00:00.000Z",
  "data": {
    "source": "client",
    "barbershop": { "id": "...", "name": "Limabarber", "phone": "(11) ..." },
    "client":  { "id": "...", "name": "Pedro", "phone": "11988880000" },
    "barber":  { "id": "...", "name": "Carlos" },
    "service": { "name": "Corte + Barba", "price": 80 },
    "date": "2026-07-20", "time": "14:00"
  }
}
```
Eventos já previstos no código: `booking.created`, `booking.cancelled`, `barbershop.published`.

### 2. WhatsApp Business API — confirmação e lembrete
Reduz o no-show (a dor mais cara da barbearia). **Roda dentro do n8n**, reagindo ao `booking.created`.
- **Twilio** (twilio.com) — `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, número aprovado. Precisa de template aprovado pela Meta.
- **Z-API / Evolution API** (zapi.io) — mais simples para o Brasil — `ZAPI_INSTANCE`, `ZAPI_TOKEN`.
- Chaves ficam nas **Credentials do n8n**, nunca no front.

### 3. Pagamentos — sinal no agendamento / assinatura do SaaS
- **Mercado Pago** (mercadopago.com.br) — `MERCADOPAGO_ACCESS_TOKEN`. Melhor cobertura no Brasil (Pix).
- **Stripe** (stripe.com) — `STRIPE_SECRET_KEY` + `VITE_STRIPE_PUBLISHABLE_KEY` (essa é pública).
- Criação de cobrança **sempre no servidor** (n8n ou Edge Function). Só a publishable key pode ir ao browser.

### 4. Google Maps / Places — autocomplete rico + "perto de mim"
- console.cloud.google.com → ative **Places API** e **Maps JavaScript API**.
- Chave em `VITE_GOOGLE_MAPS_API_KEY`. **Restrinja por domínio** no console (ela é pública).
- Tem cota grátis mensal, mas exige cartão cadastrado no Google Cloud.

### 5. Web Push — aviso instantâneo de novo agendamento ✅ integrado
- **OneSignal** (onesignal.com) → New App → Web. SDK já instalado (`react-onesignal`) e inicializado em `src/lib/onesignal.ts`, chamado a partir de `src/App.tsx` (identifica o usuário logado no login, desloga no logout).
- App ID (público) em `VITE_ONESIGNAL_APP_ID` — já preenchido no `.env`.
- Falta: pedir permissão de notificação na UI (prompt do OneSignal) e, quando o n8n estiver ligado, disparar o push de fato a partir do evento `booking.created` via **REST API Key** (secreta, fica no n8n — nunca no navegador).

### 6. E-mail transacional (produção)
- O Supabase já envia o e-mail de **confirmação de cadastro** (suficiente para começar).
- Para volume/marketing: **Resend** (`RESEND_API_KEY`) ou **SendGrid** (`SENDGRID_API_KEY`) — no n8n.

### 7. Instagram Graph API — fotos na vitrine (nice-to-have)
- Puxa as fotos do @ da barbearia para a página dela. `INSTAGRAM_ACCESS_TOKEN`.
- Exige a barbearia conectar a conta (atrito) — baixa prioridade.

---

## Ordem sugerida
1. **n8n + WhatsApp** — maior impacto (menos faltas).
2. **Pagamentos** — se for cobrar sinal ou assinatura.
3. **Push / Google Maps / E-mail** — refinamento.
4. **Instagram** — quando sobrar fôlego.
