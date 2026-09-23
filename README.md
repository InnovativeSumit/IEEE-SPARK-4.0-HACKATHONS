# JALRAKSHA AI
### From Satellite Pixels to WASH Action

Built for **SPARK 4.0 EO Hackathon 2026** — *"From Pixels to DRR: Harnessing Earth
Observation for Nepal's Flash-Flood Response and Resilience"*
**Problem Statement 05 — After the Flood: Water, Sanitation and Hygiene (WASH)**

> How can EO and geospatial technologies identify disruptions to WASH services and
> help prioritise communities most in need after the 2026 flood?

JALRAKSHA AI is a decision-support platform, not just a flood map. It carries the
chain all the way through: **flood → WASH infrastructure exposure → service
disruption risk → community impact → priority ranking → explanation →
recommended action.**

---

## 1. What's in this repo

```
jalraksha-ai/
├── backend/     FastAPI + XGBoost + SHAP, Python 3.11+
├── frontend/    React + TypeScript + Vite + Tailwind, Leaflet map
└── README.md    (this file)
```

**Runs in DEMO MODE out of the box** — no satellite downloads, no database, no API
keys. A synthetic-but-physically-plausible Terai-belt dataset (140 communities,
~1,250 WASH facilities) is generated at startup and clearly labelled
"Demo / Research Dataset" everywhere it appears. The architecture is built so real
Sentinel-1/2, DEM, population and OSM data can be swapped in later — see
`backend/.env.example` and `docs/data_sources.md` (below) for the extension points.

---

## 2. Run it locally (VS Code terminal)

You'll use **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Backend (FastAPI)

```bash
cd jalraksha-ai/backend
python -m venv venv

# macOS / Linux
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

Backend is now running at **http://localhost:8000** — open **http://localhost:8000/docs**
for the interactive API reference (Swagger UI).

### Terminal 2 — Frontend (React + Vite)

```bash
cd jalraksha-ai/frontend
npm install
cp .env.example .env

npm run dev
```

Frontend is now running at **http://localhost:5173**.

Open that URL, click **"Launch Disaster Dashboard"**, and everything — the map,
priority rankings, WASH risk model, AI Analyst — is live against the FastAPI backend.

### Optional — Docker

```bash
docker compose up --build
```

This builds and runs both services together (frontend on `:5173`, backend on `:8000`).

---

## 3. Demo flow (3–5 min judging walkthrough)

1. **Landing page** → "Launch Disaster Dashboard"
2. **Overview** — affected population, flooded area, at-risk WASH facilities, critical
   communities
3. **Live Map** — toggle Flood Extent / Community Priority / WASH Facilities; click a
   red critical marker to open the community panel
4. Panel shows the **priority score, the six scoring components, and "Why this score?"**
5. **Infrastructure** page → click a facility → see its **SHAP-style feature
   contribution bars** (real XGBoost + SHAP output)
6. **AI Analyst** → ask *"Which communities should receive emergency water support
   first?"* — the answer is generated from the same backend numbers, never invented
7. **Reports** → "Generate WASH Situation Report" → export CSV or print to PDF
8. **Methodology** → the exact weighted formula, in full, with no hidden logic

---

## 4. How the WASH Priority Score works

```
priority = 0.30 × flood_exposure
         + 0.25 × wash_disruption_risk      (XGBoost + SHAP)
         + 0.20 × population_exposure
         + 0.10 × accessibility_risk
         + 0.10 × vulnerability_score
         + 0.05 × isolation
```

All six inputs and the final score are normalised 0–100. Weights live in
`backend/app/config.py` and are exposed (not hidden) at `GET /api/priority/weights`.

| Score | Category |
|---|---|
| 90–100 | CRITICAL |
| 75–89 | VERY HIGH |
| 60–74 | HIGH |
| 40–59 | MODERATE |
| 0–39 | LOW |

## 5. AI/ML pipeline

- **Flood extent** — demo synthetic polygons in this build; the pipeline is designed
  for a U-Net/CNN segmentation model over Sentinel-1 SAR + Sentinel-2 optical
  (`backend/ml/`, extend `train_wash_model.py`'s pattern for a flood model).
- **WASH disruption risk** — a real XGBoost classifier trained on engineered
  geospatial features (flood exposure, distance to river, elevation, road
  accessibility), explained per-prediction with SHAP TreeExplainer
  (`backend/app/services/ml_service.py`). Retrain standalone with:
  ```bash
  cd backend
  python ml/train_wash_model.py
  ```
- **Community vulnerability** — a second, independently trained XGBoost
  **regressor** (not a formula) over accessibility, remoteness from the river
  corridor, elevation, rainfall and WASH density, also SHAP-explained
  (`backend/app/services/vulnerability_model.py`).
- **WASH priority score** — the six model/feature outputs above are combined with a
  transparent, fully-disclosed weighted formula (`backend/app/services/scoring_service.py`).
- **Response zone clustering** — unsupervised **KMeans** groups communities by risk
  signature into operational response zones for logistics planning
  (`backend/app/services/cluster_service.py`).
- **Agentic RAG AI Assistant** — see section 6.

## 6. Agentic AI Assistant (RAG + vector search + tool-calling)

The AI Analyst is a small but genuine agent pipeline, built to run **fully offline**
(no external LLM API, no internet download of embedding weights) so the hackathon
demo has zero external dependencies, while still being real trained ML rather than
regex string-matching:

```
question
   │
   ▼
[1] Intent classifier  — TF-IDF + Nearest-Centroid, trained on curated example
                          questions per intent (backend/app/services/intent_classifier.py)
   │
   ▼
[2] Tool dispatch       — the classified intent selects one of 10 tools that query
                          the live scoring/cluster/model data directly — no numbers
                          are ever generated by a language model
                          (backend/app/services/agent_service.py)
   │
   ▼
[3] RAG retrieval       — a TF-IDF vector store, indexed over ~1,500 text chunks
                          generated from the platform's own community, district,
                          facility-type, response-zone and model-metric data, is
                          queried for the most relevant supporting context
                          (backend/app/services/vector_store.py,
                           backend/app/services/knowledge_base.py)
   │
   ▼
[4] Response + trace    — the answer, plus a full agent_trace (intent, tool used,
                          retrieved source IDs and relevance scores) is returned so
                          every answer is auditable in the UI ("agent trace" on
                          each AI Analyst reply)
```

If `ANTHROPIC_API_KEY` is set in `backend/.env`, this same pipeline is the natural
place to add a final LLM call that *phrases* the answer more fluidly — the retrieved
numbers and trace would stay identical either way, so answers are never allowed to
drift from what the models actually computed.

Inspect the live pipeline yourself: `GET /api/models/rag-index` and
`GET /api/models/performance`, or the **System Status** page in the UI.

## 7. API reference (selected)

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Service status |
| `GET /api/analytics/overview` | Dashboard stat cards |
| `GET /api/communities/ranking` | Prioritised community list |
| `GET /api/communities/{id}` | Single community, full breakdown |
| `GET /api/wash/facilities` | WASH facility table |
| `GET /api/wash/risk` | Disruption risk by facility type |
| `GET /api/flood/geojson` | Flood extent polygons |
| `GET /api/priority/map` | Priority points for the map layer |
| `GET /api/priority/weights` | The scoring formula, in full |
| `POST /api/ai/query` | AI Analyst — `{ "question": "..." }` |
| `GET /api/reports/summary` | Situation report JSON |
| `GET /api/reports/communities.csv` | Priority list, CSV export |
| `POST /api/analysis/run` | Re-run analysis for a region |

Full interactive docs: `http://localhost:8000/docs`.

## 8. Extending to real Nepal EO data

1. Set `APP_MODE=production` in `backend/.env` and point `SATELLITE_DATA_PATH`,
   `DEM_DATA_PATH`, `POPULATION_DATA_PATH`, `OSM_DATA_PATH` at real files.
2. Replace `backend/app/data/demo_data.py` with a loader that reads real Sentinel-1/2
   rasters (Rasterio/GDAL), OSM WASH facilities (GeoPandas), a DEM, and a population
   raster, producing the same record shape consumed by `scoring_service.py`.
3. Swap the synthetic label in `ml_service.py` / `ml/train_wash_model.py` for real
   field-verified disruption outcomes once available (the Field Verification actions
   in the Infrastructure page are designed to become that training set).
4. Wire a Postgres + PostGIS instance if you need persistence/spatial queries at
   scale — `docker-compose.yml` includes a commented-out `postgis` service to start
   from.

## 9. Data provenance & model safety

- Every number in the UI is labelled `DEMO MODE — Simulated / Research Data`.
- The platform never claims *"water is contaminated"* or *"facility destroyed"* —
  only *"potential disruption risk"* / *"requires field verification"*, consistent
  with how a real disaster-management deployment should communicate.
- The AI Analyst always retrieves numbers from the backend before answering; it does
  not generate figures from a language model.

## 10. Limitations (be upfront about these when judged)

- Flood extent is a synthetic demo layer, not a real segmentation-model output over
  actual 2026 Sentinel imagery — the segmentation architecture is documented but not
  trained on real labelled flood masks in this build.
- Demographic and infrastructure data are synthetic proxies, not the real Nepal
  census/OSM extract.
- No persistent database is wired up in demo mode — all data is regenerated (with a
  fixed random seed, so it's stable) each time the backend starts.

## 11. Future improvements

- Real U-Net flood segmentation over Sentinel-1/2 with before/after change detection
- PostGIS-backed persistence + tile-served vector layers for large regions
- Configurable scoring weights from an admin UI (the formula is already externalised)
- Human-verification feedback loop feeding retraining, end to end
