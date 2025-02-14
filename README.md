# Guitar Factory Simulation Game

A web-based factory simulation game where players optimize a guitar manufacturing production line. Players balance staffing levels, manage resources, and optimize production flow to maximize profits.

## Overview

The Guitar Factory Simulation is an educational game that demonstrates principles of:
- Manufacturing process optimization
- Resource allocation
- Supply chain management
- Financial decision-making
- Production line balancing

## How It Works

Players manage a guitar factory with four main production stages:
1. Body Making (1 hour, uses 2 wood units)
2. Neck Making (1 hour, uses 1 wood unit)
3. Painting (2 hours, handles both body and neck)
4. Assembly (1 hour, uses 1 electronic unit)

### Key Features
- Adjustable staffing levels for each production stage
- Configurable working hours and days
- Real-time production metrics
- Financial reporting including revenue, labor costs, and material costs
- Production logs showing bottlenecks and issues
- Storage management between production stages

### Game Parameters

**Materials:**
- Wood: $50 per unit
- Electronics: $100 per unit

**Labor:**
- Body/Neck Makers: $25/hour
- Painters: $30/hour
- Assemblers: $28/hour
- Overtime (>40hrs/week): 1.5× regular rate

**Revenue:**
- Each guitar sells for $1,000
- Guitars are shipped in batches of 50

## Technical Architecture

### Backend (Python)
The simulation engine is built using:
- SimPy for discrete event simulation
- FastAPI for the REST API
- Python's dataclasses for structured data management

The simulation engine models:
- Worker availability and scheduling
- Material flow through production stages
- Storage buffers between stages
- Production timing and dependencies
- Resource constraints and bottlenecks

### Frontend (React)
Built with:
- React for UI components
- Recharts for data visualization
- CSS modules for styling
- Fetch API for backend communication

Features:
- Interactive control panel for simulation parameters
- Real-time production metrics display
- Collapsible instructions section
- Financial results dashboard
- Production logs viewer

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd game-engine
   pip install -r requirements.txt

   # Frontend
   cd ../guitar-factory-frontend
   npm install
   ```

3. Start the development servers:
   ```bash
   # Backend
   cd game-engine
   uvicorn api:app --reload

   # Frontend
   cd ../guitar-factory-frontend
   npm start
   ```

4. Open http://localhost:3000 in your browser

## Strategy Tips

- Balance worker numbers across stages to prevent bottlenecks
- Consider overtime costs versus hiring additional workers
- Monitor material usage and storage levels
- Watch production logs for bottleneck identification
- Optimize batch sizes for efficient production flow

## Future Enhancements

- Additional guitar models with different requirements
- Quality control mechanics
- Machine maintenance and reliability
- Worker skill levels and training
- Market demand fluctuations
- Seasonal variations in production

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
