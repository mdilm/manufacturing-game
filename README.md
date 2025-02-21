# Guitar Factory Simulation Game

A web-based factory simulation game where players manage a guitar manufacturing facility. Balance resources, staffing, and logistics to maximize profit.

## Game Features

### Production Process
- Four-stage manufacturing: Body Making, Neck Making, Painting, and Assembly
- Variable processing times with realistic distributions
- Quality control at each stage with different pass rates
- Worker attendance system (5% daily sick rate)

### Resource Management
- Wood and electronic parts inventory tracking
- Dynamic material ordering based on staffing levels
- Configurable dispatch threshold system
- Storage capacity limits for all production stages

### Financial System
- Revenue: $800 per guitar
- Material Costs:
  - Wood: $50 per unit
  - Electronics: $100 per unit
  - Dispatch Cost: $500 per pickup
- Labor Costs:
  - Body/Neck Makers: $25/hour
  - Painters: $30/hour
  - Assemblers: $28/hour
  - 1.5× overtime rate over 40 hours/week
- Fixed daily operating costs: $2,000
- Idle time tracking (shown as opportunity cost)

### Quality Control
- Body & Neck Making: 92% pass rate
- Painting: 85% pass rate (failed items can be reworked)
- Assembly: 98% pass rate
- Failed items impact material costs

### Customizable Parameters
- Working hours per day
- Number of working days
- Staffing levels for each role
- Dispatch threshold for finished goods

### User Interface
- Dark/Light mode toggle
- Responsive design for all screen sizes
- Real-time production metrics
- Detailed financial reporting
- Production log viewer
- Interactive charts and statistics

## Strategic Elements
- Balance worker numbers to prevent bottlenecks
- Optimize dispatch threshold for cost efficiency
- Manage inventory levels and storage capacity
- Plan for worker absences and quality control failures
- Trade-off between overtime and additional hiring

## Technical Details
- Frontend: React with Recharts for data visualization
- Backend: Python with SimPy for discrete event simulation
- RESTful API for simulation execution
- Responsive design for mobile and desktop use

## Getting Started
1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd guitar-factory-frontend
   npm install

   # Backend
   cd ../game-engine
   pip install -r requirements.txt
   ```
3. Start the development servers:
   ```bash
   # Frontend
   npm start

   # Backend
   python api.py
   ```

## Future Enhancements
- Additional guitar models with different complexities
- Equipment upgrades and maintenance
- Worker skill development system
- Market demand fluctuations
- Seasonal events and challenges

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
