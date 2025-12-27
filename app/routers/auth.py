from fastapi import APIRouter, Request, Form, Depends, Response, Cookie, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from passlib.context import CryptContext
from functools import wraps
from typing import Callable

from app import models, schemas, database, crud
from app.database import get_db

# 🔐 Variables d'environnement
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# 🔐 Hash des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# 📦 Router et templates
router = APIRouter(tags=["auth"])
templates = Jinja2Templates(directory="app/templates")

# 🔐 Création du token JWT (inclut le rôle)
def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=30)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print("✅ Token généré :", encoded_jwt)
    return encoded_jwt

# 🔐 Récupération de l'utilisateur courant via cookie
def get_current_user(
    token: str = Cookie(None, alias="access_token"),
    db: Session = Depends(database.get_db)
) -> models.Utilisateur:
    print("🔐 Cookie reçu :", token)

    if not token:
        print("❌ Aucun token trouvé dans le cookie.")
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role_in_token: str = payload.get("role")
        print("📦 Payload décodé :", payload)
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as e:
        print("❌ Erreur de décodage JWT :", str(e))
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.Utilisateur).filter(models.Utilisateur.username == username).first()
    if user is None:
        print("❌ Utilisateur introuvable :", username)
        raise HTTPException(status_code=401, detail="User not found")

    # ⚠️ Alerte si rôle du token ≠ rôle en base (utile pour debug)
    if role_in_token and user.role != role_in_token:
        print(f"⚠️ Rôle en base ({user.role}) différent du token ({role_in_token})")

    print("✅ Utilisateur authentifié :", user.username, "– rôle :", user.role)
    return user

# 🔐 Page de connexion
@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

# 🔐 Action de connexion (pose le cookie JWT avec rôle)
@router.post("/login", response_class=HTMLResponse)
def login_action(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = crud.authenticate_user(db, username, password)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request, "error": "Identifiants incorrects"})

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    response = RedirectResponse(url="/home", status_code=303)

    # 🔎 Lecture des variables d'environnement pour les cookies
    COOKIE_SECURE = os.getenv("COOKIE_SECURE", "False").lower() == "true"
    COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
    COOKIE_PATH = os.getenv("COOKIE_PATH", "/")

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path=COOKIE_PATH
    )
    return response

# 🔒 Décorateur pour restreindre par rôles
def require_roles(*allowed_roles: str):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, current_user: models.Utilisateur = Depends(get_current_user), **kwargs):
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="⛔ Accès refusé. Rôle non autorisé."
                )
            return func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# 🔓 Déconnexion (supprime le cookie)
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return RedirectResponse(url="/login", status_code=303)
