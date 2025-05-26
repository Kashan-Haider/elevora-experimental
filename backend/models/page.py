from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base, default_uuid, now

class Page(Base):
    __tablename__ = "pages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    last_audited = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now)
    
    # Relationships
    project = relationship("Project", back_populates="pages")
    audit_details = relationship("AuditDetail", back_populates="page", cascade="all, delete-orphan")
    content_suggestions = relationship("ContentSuggestion", back_populates="page", cascade="all, delete-orphan")
