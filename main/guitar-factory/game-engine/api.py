import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from simulation import GuitarFactorySimulation
import traceback

class SimulationParams(BaseModel):
    hours: int = 8
    days: int = 23
    num_body: int = 2
    num_neck: int = 1
    num_paint: int = 3
    num_ensam: int = 2
    dispatch_threshold: int = 50

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

# Store simulation instance
current_simulation = None

@app.post("/api/simulate_week")
async def simulate_week(params: dict):
    global current_simulation
    
    if current_simulation is None or params.get('current_week') == 1:
        # Create new simulation for first week
        current_simulation = GuitarFactorySimulation(**params)
    else:
        # Update parameters for existing simulation
        current_simulation.current_week = params.get('current_week')
        current_simulation.update_params(params)
    
    return current_simulation.run_weekly_simulation()

if __name__ == '__main__':
    app.run(debug=True)
    