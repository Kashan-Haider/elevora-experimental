from fastapi import APIRouter, Depends, Header, HTTPException, Query
from models import User, Project,Page, Audit
from schemas.project import ProjectCreate, ProjectOut
from sqlalchemy.orm import Session
from db.session import get_session
from jose import JWTError
from uuid import uuid4
from utils.user.getUserByToken import getUserByToken
from typing import List
from pydantic import BaseModel, Field
from utils.audit.audit_site import auditSite


router = APIRouter()
class SiteAuditRequest(BaseModel):
    project_id:str = Field(...)
    url: str = Field(...)
    max_urls_per_domain: int = 3
    max_pages: int = 2


@router.post("/create-project", response_model=ProjectOut)
def create_project(
    payload: ProjectCreate,
    authorization: str = Header(...),
    session: Session = Depends(get_session)
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    user = getUserByToken(token, session)
    try:
        if not user.id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token verification failed")

    # Step 2: Check if user exists
    user = session.query(User).filter(User.id == user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Step 3: Create and store the project
    new_project = Project(
        id=uuid4(),
        user_id=user.id,
        name=payload.name,
        domain=payload.domain
    )
    session.add(new_project)
    session.commit()
    session.refresh(new_project)

    return new_project


@router.get('/get-all-projects', response_model=List[ProjectOut])
def get_projects(user_id: str = Query(...), session: Session = Depends(get_session)):
    projects = session.query(Project).filter(Project.user_id == user_id).all()
    if not projects:
        raise HTTPException(status_code=404, detail="No projects found for this user.")
    return projects

    
    
    



@router.post("/audit")
async def audit_site(request: SiteAuditRequest, session:Session = Depends(get_session), authorization: str = Header(...),):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    user = getUserByToken(token, session)
    try:
        audit = auditSite(
            session= session,
            project_id = request.project_id,
            url=request.url,
            depth=request.max_urls_per_domain,
            max_pages=request.max_pages,
        )
        return {"message": audit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Site audit failed: {e}")
    
    
    
    
@router.get('/get-audit-data')
async def get_audit_data(project_id: str, session: Session = Depends(get_session)):
    # Ensure project exists
    project = session.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all pages under the project
    pages = session.query(Page).filter(Page.project_id == project_id).all()
    if not pages:
        return []

    page_ids = [page.id for page in pages]

    # Get audits for all pages
    audits = session.query(Audit).filter(Audit.page_id.in_(page_ids)).all()

    # Serialize audit data
    audit_data = [
        {
            "id": audit.id,
            "page_id": audit.page_id,
            "audit_type": audit.audit_type,
            "score": audit.score,
            "issues": audit.issues,
            "recommendations": audit.recommendations,
            "created_at": audit.created_at,
        }
        for audit in audits
    ]

    return audit_data