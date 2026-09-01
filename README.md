# curriculum-api

PostgreSQL-backed curriculum data with a localhost read-only API and XLSX export.

## Run locally

PowerShell, from the repository root:

```powershell
docker compose up -d db
npm install
python -m pip install -r requirements.txt

$env:DATABASE_URL = "postgresql://curriculum:curriculum@127.0.0.1:5433/curriculum"
$env:DB_URL = "postgresql://curriculum_readonly:curriculum_readonly_pw@127.0.0.1:5433/curriculum"

npm run db:migrate
npm run db:load
npm run check
npm run export
npm run dev
```

The API listens on `http://127.0.0.1:3000`:

- `GET /health`
- `GET /api/curriculum?grade=&subject=&limit=&offset=`
- `GET /api/songs?limit=&offset=`
- `GET /api/songs/:id`
- `GET /api/activities?limit=&offset=`
- `GET /api/search?q=`

`npm run export` writes `data/curriculum-export.xlsx` with Curriculum, Songs, Activities, Song Actions, and Metadata sheets. `npm run audit` writes a local JSON audit report without posting GitHub issues.
