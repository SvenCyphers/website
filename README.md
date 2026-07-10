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

## Veiligheidscheck voor wijzigingen

Voer voor commits of pushes deze check uit:

```powershell
./scripts/security-check.ps1
```

De check controleert onder andere op mogelijke secrets, riskante JavaScript-patronen, admin-API's zonder auth, ontbrekende hardening en whitespace-fouten. GitHub draait dezelfde check automatisch bij pushes naar `main` en bij pull requests.
