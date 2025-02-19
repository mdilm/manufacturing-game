import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from simulation import run_factory_simulation
import traceback  # Add this import

class SimulationParams(BaseModel):
    hours: int = 8
    days: int = 23
    num_body: int = 2
    num_neck: int = 1
    num_paint: int = 3
    num_ensam: int = 2

app = FastAPI()

# Get CORS origins from environment variable, fallback to localhost for development
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/simulate")
async def simulate(params: SimulationParams):
    try:
        print(f"Received parameters: {params.dict()}")  # Debug print
        result = run_factory_simulation(params.dict())
        print(f"Simulation completed successfully")  # Debug print
        return result
    except Exception as e:
        print(f"Error in simulation: {str(e)}")  # Debug print
        print(traceback.format_exc())  # This will print the full error traceback
        raise HTTPException(status_code=500, detail=str(e))
    