from app.database import SessionLocal
from app.models import Province

def seed_provinces():
    db = SessionLocal()
    noms = [
        "Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga",
        "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"
    ]
    for nom in noms:
        if not db.query(Province).filter_by(nom=nom).first():
            db.add(Province(nom=nom))
    db.commit()
    db.close()

# Appelle cette fonction une seule fois
seed_provinces()
