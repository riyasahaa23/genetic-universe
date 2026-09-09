"""
FastAPI Main Application
Genetic Universe -> Offspring Universe
Interactive Computational Attribution Framework
"""
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.validation.config import settings
from app.validation.db.database import database_backend, init_db
from app.validation.services.experiment_session import experiment_manager

# API Routers
from app.validation.api.experiments import router as experiments_router
from app.validation.api.genomes import router as genomes_router
from app.validation.api.simulations import router as simulations_router
from app.validation.api.phenotype import router as phenotype_router
from app.validation.api.counterfactual import router as counterfactual_router
from app.validation.api.evidence import router as evidence_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("genetic_universe")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Genetic Universe database schema...")
    try:
        init_db()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization warning: {e}")
    yield
    # Shutdown
    logger.info("Shutting down Genetic Universe service.")


app = FastAPI(
    title="Genetic Universe -> Offspring Universe API",
    description="Interactive computational framework for attributing offspring phenotypic novelty to recombination-generated configurations and epistatic interactions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured error handling (Section 41)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": detail},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "API_ERROR",
                "message": str(detail),
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
            }
        },
    )


# Health check endpoint
@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "ok",
        "service": "genetic-universe-api",
        "version": "1.0.0",
        "environment": settings.app_env,
        "database": "connected",
        "database_backend": database_backend,
        "timestamp": time.time(),
    }


# Include Routers
app.include_router(experiments_router)
app.include_router(genomes_router)
app.include_router(simulations_router)
app.include_router(phenotype_router)
app.include_router(counterfactual_router)
app.include_router(evidence_router)


# WebSocket endpoint for real-time animated meiotic & novelty stream (Section 25)
@app.websocket("/ws/experiments/{experiment_id}")
async def experiment_websocket(websocket: WebSocket, experiment_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected to experiment [{experiment_id}]")

    if experiment_id not in experiment_manager.ws_subscribers:
        experiment_manager.ws_subscribers[experiment_id] = set()

    async def send_json_message(data):
        await websocket.send_json(data)

    experiment_manager.ws_subscribers[experiment_id].add(send_json_message)

    try:
        # Acknowledge connection
        await websocket.send_json({
            "event": "connected",
            "experiment_id": experiment_id,
            "timestamp": time.time(),
        })

        while True:
            # Keep connection open for incoming client pings/messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from experiment [{experiment_id}]")
    finally:
        experiment_manager.ws_subscribers[experiment_id].discard(send_json_message)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.validation.main:app", host="0.0.0.0", port=8000, reload=True)
