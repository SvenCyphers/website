# website
website_cyphers.nl

## Cloudflare Pages instellingen

- Build command: `exit 0`
- Build output directory: `/`
- Root directory: leeg

## D1 en beheer

Maak een D1 database en voer `schema.sql` uit. Koppel daarna de database aan Pages:

- Binding type: D1 database
- Variable name: `DB`

Voeg ook deze Pages environment variables toe:

- `ADMIN_PASSWORD`: wachtwoord voor `/beheer/`
- `AUTH_SECRET`: lange willekeurige tekenreeks voor admin-sessies

Daarna kun je beheren via `/beheer/`.
