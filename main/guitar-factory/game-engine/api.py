import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from simulation import GuitarFactorySimulation
import traceback

class SimulationRequest(BaseModel):
    hours: int = 8
    days: int = 5
    num_body: int = 2
    num_neck: int = 1
    num_paint: int = 3
    num_ensam: int = 2
    dispatch_threshold: int = 50
    total_demand: int = 200
    current_week: int = 1

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mdilm.github.io",     # Your GitHub Pages domain
        "https://manufacturing-game.onrender.com",  # Your Render backend
        "http://localhost:3000"         # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store simulation instance
current_simulation = None

@app.post("/api/simulate_week")
async def simulate_week(request: SimulationRequest):
    try:
        print(f"Received request with params: {request}")
        
        # Create new simulation for this week
        simulation = GuitarFactorySimulation(
            hours=request.hours,
            days=request.days,
            num_body=request.num_body,
            num_neck=request.num_neck,
            num_paint=request.num_paint,
            num_ensam=request.num_ensam,
            dispatch_threshold=request.dispatch_threshold,
            total_demand=request.total_demand,
            current_week=request.current_week
        )
        
        result = simulation.run_weekly_simulation()
        print(f"Returning result: {result}")
        
        return result
    except Exception as e:
        print(f"Error in simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    app.run(debug=True)
    