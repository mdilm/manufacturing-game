import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
from simulation import GuitarFactorySimulation, Guitar_Factory
import traceback
import json

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

app = FastAPI(title="Guitar Factory API")

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

# Store simulation instances by session
simulations = {}

class WorkerStatus(BaseModel):
    name: str
    is_sick: bool

class FactoryStatus(BaseModel):
    available_workers: int
    total_workers: int
    daily_production: int
    weekly_production: int
    weekly_revenue: float
    weekly_costs: float
    weekly_profit: float
    inventory: dict

@app.get("/")
async def root():
    return {"message": "Welcome to the Guitar Factory API"}

@app.get("/status", response_model=FactoryStatus)
async def get_status():
    """Get current factory status"""
    # Get the latest simulation if it exists
    if not simulations:
        return {
            "available_workers": 0,
            "total_workers": 0,
            "daily_production": 0,
            "weekly_production": 0,
            "weekly_revenue": 0,
            "weekly_costs": 0,
            "weekly_profit": 0,
            "inventory": {}
        }
    
    latest_sim = list(simulations.values())[-1]
    factory = latest_sim.guitar_factory
    
    return {
        "available_workers": sum(len(workers) for workers in factory.available_workers.values()),
        "total_workers": sum(factory.total_workers.values()),
        "daily_production": factory.guitars_made,
        "weekly_production": factory.guitars_made,
        "weekly_revenue": factory.finances['total_revenue'],
        "weekly_costs": factory.finances['labor_costs'] + factory.finances['material_costs'] + factory.finances['fixed_costs'],
        "weekly_profit": factory.finances['total_revenue'] - (factory.finances['labor_costs'] + factory.finances['material_costs'] + factory.finances['fixed_costs']),
        "inventory": {
            'wood': factory.wood.level,
            'electronic': factory.electronic.level,
            'body_pre_paint': factory.body_pre_paint.level,
            'neck_pre_paint': factory.neck_pre_paint.level,
            'body_post_paint': factory.body_post_paint.level,
            'neck_post_paint': factory.neck_post_paint.level,
            'dispatch': factory.dispatch.level
        }
    }

@app.post("/workers/sick")
async def set_worker_sick(worker_status: WorkerStatus):
    """Set a worker's sick status"""
    try:
        factory.set_worker_sick(worker_status.name, worker_status.is_sick)
        return {"message": f"Worker {worker_status.name} sick status updated to {worker_status.is_sick}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/simulate/day")
async def simulate_day():
    """Simulate one day of production"""
    factory.simulate_day()
    return {"message": "Day simulated successfully"}

@app.post("/simulate/week")
async def simulate_week():
    """Simulate one week of production"""
    factory.simulate_week()
    return {"message": "Week simulated successfully"}

@app.get("/workers", response_model=List[WorkerStatus])
async def get_workers():
    """Get list of all workers and their sick status"""
    workers = []
    for worker in factory.workers:
        workers.append(WorkerStatus(name=worker.name, is_sick=worker.is_sick))
    return workers

@app.post("/api/simulate_week")
async def simulate_week_api(request: SimulationRequest):
    try:
        print(f"Received request with params: {request}")
        
        # Create or get simulation instance
        if request.current_week == 1:
            # Start new simulation
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
        else:
            # Update existing simulation parameters
            simulation = simulations.get(request.current_week - 1)
            if not simulation:
                raise HTTPException(status_code=400, detail="Previous week simulation not found")
            
            simulation.update_params({
                'num_body': request.num_body,
                'num_neck': request.num_neck,
                'num_paint': request.num_paint,
                'num_ensam': request.num_ensam,
                'dispatch_threshold': request.dispatch_threshold,
                'hours': request.hours,
                'days': request.days
            })
            simulation.current_week = request.current_week
        
        # Run simulation and store result
        result = simulation.run_weekly_simulation()
        simulations[request.current_week] = simulation
        
        print(f"Returning result: {result}")
        return result
        
    except Exception as e:
        print(f"Error in simulation: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    