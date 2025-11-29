from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, JSON, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    
    # File info
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(50), nullable=False)  # csv, json, etc.
    size_bytes = Column(BigInteger, nullable=False)
    
    # Data info
    row_count = Column(Integer, nullable=True)
    columns = Column(JSON, nullable=True)  # List of column names/types
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="datasets")

    def __repr__(self):
        return f"<Dataset {self.name} ({self.file_type})>"
