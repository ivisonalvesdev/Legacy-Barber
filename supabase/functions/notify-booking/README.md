# Edge Function: notify-booking

Dispara push (OneSignal) para o **barbeiro** e o **dono** da barbearia quando um
novo agendamento é criado. Roda no servidor do Supabase, então guarda o segredo
`ONESIGNAL_REST_API_KEY` com segurança — ele nunca vai para o navegador. Não
depende do n8n.

O app chama esta função em `notifyBooking(bookingId)` (`src/lib/integrations.ts`),
logo após inserir o agendamento (cliente e walk-in do admin).

## Deploy (uma vez) — precisa do Supabase CLI

```bash
# 1. Login no Supabase (abre o navegador)
npx supabase login

# 2. Linkar este repositório ao projeto (pega o ref no dashboard → Settings → General)
npx supabase link --project-ref SEU_PROJECT_REF

# 3. Configurar os segredos (a REST API Key é secreta — dashboard OneSignal →
#    Settings → Keys & IDs → REST API Key)
npx supabase secrets set ONESIGNAL_APP_ID=408d6269-50ff-4f84-9361-998768c1bd8d
npx supabase secrets set ONESIGNAL_REST_API_KEY=COLE_AQUI_A_REST_API_KEY
npx supabase secrets set APP_URL=https://legacy-barber-sigma.vercel.app

# 4. Publicar a função
npx supabase functions deploy notify-booking
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados automaticamente
pelo ambiente — não precisa setá-los.

## Testar

Faça um agendamento no app (com o barbeiro/dono logado em outro dispositivo ou
aba). O push deve chegar. Para depurar, veja os logs:

```bash
npx supabase functions logs notify-booking
```
