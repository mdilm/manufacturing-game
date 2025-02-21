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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store simulation instance
current_simulation = None

@app.post("/api/simulate_week")
async def simulate_week(request: Request):
    try:
        params = await request.json()
        print(f"Received request with params: {params}")  # Debug logging
        
        simulation = GuitarFactorySimulation(**params)
        result = simulation.run_weekly_simulation()
        
        print(f"Returning result: {result}")  # Debug logging
        return result
        
    except Exception as e:
        print(f"Error in simulation: {str(e)}")  # Debug logging
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    app.run(debug=True)
    