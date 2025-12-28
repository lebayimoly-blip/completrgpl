# app/routers/zones.py

from fastapi import APIRouter, Request, Depends, Query, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import pandas as pd

from app import database, models
from app.routers.auth import get_current_user

templates = Jinja2Templates(directory="app/templates")

# --- Router pour les pages HTML ---
router_html = APIRouter(tags=["zones"])

@router_html.get("/zone-travail", response_class=HTMLResponse)
def definir_zone(request: Request, current_user: models.Utilisateur = Depends(get_current_user)):
    return templates.TemplateResponse("zone_travail.html", {"request": request, "current_user": current_user})

@router_html.get("/api/recherche-utilisateur", response_class=JSONResponse)
def rechercher_utilisateur(q: str = Query(..., min_length=1), db: Session = Depends(database.get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    utilisateurs = db.query(models.Utilisateur).filter(models.Utilisateur.username.ilike(f"%{q}%")).all()
    return [{"id": u.id, "nom": u.username, "role": u.role or "rôle non défini"} for u in utilisateurs]

@router_html.get("/zones-attribuees", response_class=HTMLResponse)
def afficher_zones_attribuees(request: Request, utilisateur_id: int = None, db: Session = Depends(database.get_db), current_user: models.Utilisateur = Depends(get_current_user)):
    query = db.query(models.Zone).join(models.Utilisateur)
    if utilisateur_id:
        query = query.filter(models.Zone.utilisateur_id == utilisateur_id)
    zones = query.all()
    utilisateurs = db.query(models.Utilisateur).order_by(models.Utilisateur.username).all()
    return templates.TemplateResponse("zones_attribuees.html", {"request": request, "zones": zones, "utilisateurs": utilisateurs, "utilisateur_id": utilisateur_id, "current_user": current_user})

# --- Router pour l’API d’import ---
router_api = APIRouter(prefix="/api", tags=["zones"])

@router_api.post("/import-zones")
async def import_zones(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if file.filename.endswith(".csv"):
        df = pd.read_csv(file.file)
    else:
        df = pd.read_excel(file.file)

    zones = []
    for _, row in df.iterrows():
        zone = models.Zone(utilisateur_id=row["utilisateur_id"], geojson=row["geojson"], is_synced=False)
        db.add(zone)
        zones.append({"utilisateur_id": row["utilisateur_id"], "geojson": row["geojson"]})

    db.commit()
    return {"message": f"{len(zones)} zones importées ✅", "zones": zones}
