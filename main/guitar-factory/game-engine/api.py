from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from simulation import run_factory_simulation

class SimulationParams(BaseModel):
    hours: int = 8
    days: int = 23
    num_body: int = 2
    num_neck: int = 1
    num_paint: int = 3
    num_ensam: int = 2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/simulate")
async def simulate(params: SimulationParams):
    try:
        result = run_factory_simulation(params.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
