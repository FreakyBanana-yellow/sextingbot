# SextingBot-as-a-Service

Telegram-Bot-System für erotische AI-Zwillinge.  
Ermöglicht Usern, mit einem sexy „digitalen Model“ zu chatten – inkl. GPT-4 und Medienintegration.

## Struktur
- `index.js`: Startet alle aktiven Bots
- `bots/`: Bot-Instanzen pro Model
- `handlers/`: User/Model-Nachrichten
- `utils/`: GPT + Medien-Logik
- `supabase/`: DB-Verbindung

## Deployment
→ via Railway mit Umgebungsvariablen:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
