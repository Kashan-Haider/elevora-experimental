from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

Base = declarative_base()

class AuditDetail(Base):
    """Stores detailed metrics from SEO audits for data visualization"""
    __tablename__ = 'audit_details'
    
    id = Column(String, primary_key=True)
    audit_id = Column(String, ForeignKey('audit.id'), nullable=False)
    category = Column(String, nullable=False)  # metadata, content, media, technical, links, international
    subcategory = Column(String, nullable=False)  # title, meta_description, headings, etc.
    metric_name = Column(String, nullable=False)
    metric_value = Column(Float, nullable=True)
    text_value = Column(Text, nullable=True)
    boolean_value = Column(Boolean, nullable=True)
    json_value = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to parent audit
    audit = relationship("Audit", back_populates="details")
    
    def __init__(self, audit_id, category, subcategory, metric_name, 
                 metric_value=None, text_value=None, boolean_value=None, json_value=None):
        self.id = str(uuid4())
        self.audit_id = audit_id
        self.category = category
        self.subcategory = subcategory
        self.metric_name = metric_name
        self.metric_value = metric_value
        self.text_value = text_value
        self.boolean_value = boolean_value
        self.json_value = json_value
        self.created_at = datetime.utcnow()