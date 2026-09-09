"""
SQLAlchemy ORM Models for Scientific Audit and Experiment Storage.
Directly implements the PostgreSQL audit schema specified in Section 26.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship as orm_relationship
from app.validation.db.database import Base


class ExperimentDB(Base):
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, index=True)
    seed = Column(Integer, nullable=False, default=42)
    locus_count = Column(Integer, nullable=False, default=50)
    status = Column(String, nullable=False, default="CREATED")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    parental_genomes = orm_relationship("ParentalGenomeDB", back_populates="experiment", cascade="all, delete-orphan")
    crossovers = orm_relationship("CrossoverDB", back_populates="experiment", cascade="all, delete-orphan")
    gametes = orm_relationship("GameteDB", back_populates="experiment", cascade="all, delete-orphan")
    offspring_genomes = orm_relationship("OffspringGenomeDB", back_populates="experiment", cascade="all, delete-orphan")
    phenotype_results = orm_relationship("PhenotypeResultDB", back_populates="experiment", cascade="all, delete-orphan")
    candidates = orm_relationship("CandidateDB", back_populates="experiment", cascade="all, delete-orphan")
    counterfactual_results = orm_relationship("CounterfactualResultDB", back_populates="experiment", cascade="all, delete-orphan")
    evidence_edges = orm_relationship("EvidenceEdgeDB", back_populates="experiment", cascade="all, delete-orphan")


class ParentalGenomeDB(Base):
    __tablename__ = "parental_genomes"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    parent_id = Column(String, nullable=False)
    homolog_1 = Column(Text, nullable=False)
    homolog_2 = Column(Text, nullable=False)

    experiment = orm_relationship("ExperimentDB", back_populates="parental_genomes")


class CrossoverDB(Base):
    __tablename__ = "crossovers"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    parent_id = Column(String, nullable=False)
    breakpoint = Column(Integer, nullable=False)
    source_homolog_before = Column(String, nullable=False)
    source_homolog_after = Column(String, nullable=False)

    experiment = orm_relationship("ExperimentDB", back_populates="crossovers")


class GameteDB(Base):
    __tablename__ = "gametes"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    parent_id = Column(String, nullable=False)
    genotype = Column(Text, nullable=False)
    ancestry_json = Column(Text, nullable=False)

    experiment = orm_relationship("ExperimentDB", back_populates="gametes")


class OffspringGenomeDB(Base):
    __tablename__ = "offspring_genomes"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    genotype = Column(Text, nullable=False)
    provenance_json = Column(Text, nullable=False)

    experiment = orm_relationship("ExperimentDB", back_populates="offspring_genomes")


class PhenotypeResultDB(Base):
    __tablename__ = "phenotype_results"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    entity = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    model_version = Column(String, nullable=False, default="1.0.0")

    experiment = orm_relationship("ExperimentDB", back_populates="phenotype_results")


class CandidateDB(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    candidate_type = Column(String, nullable=False)
    candidate_json = Column(Text, nullable=False)
    rank = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)

    experiment = orm_relationship("ExperimentDB", back_populates="candidates")


class CounterfactualResultDB(Base):
    __tablename__ = "counterfactual_results"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    candidate_id = Column(String, nullable=False)
    intervention = Column(String, nullable=False)
    original_value = Column(Float, nullable=False)
    counterfactual_value = Column(Float, nullable=False)
    delta = Column(Float, nullable=False)

    experiment = orm_relationship("ExperimentDB", back_populates="counterfactual_results")


class EvidenceEdgeDB(Base):
    __tablename__ = "evidence_edges"

    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    source_node = Column(String, nullable=False)
    target_node = Column(String, nullable=False)
    relationship_type = Column("relationship", String, nullable=False)

    experiment = orm_relationship("ExperimentDB", back_populates="evidence_edges")
