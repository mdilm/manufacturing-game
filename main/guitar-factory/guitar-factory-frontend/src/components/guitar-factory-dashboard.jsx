import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const GuitarFactoryDashboard = () => {
  const [params, setParams] = useState({
    hours: 8,
    days: 23,
    num_body: 2,
    num_neck: 1,
    num_paint: 3,
    num_ensam: 2,
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const API_URL = 'https://manufacturing-game.onrender.com/api/simulate';
      console.log('Sending request to:', API_URL);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.final_state) {
        throw new Error('Invalid response format from API');
      }

      setResults({
        totalGuitars: data.guitars_made,
        logs: data.logs,
        stationMetrics: [
          { name: 'Body Pre-Paint', units: data.final_state.body_pre_paint },
          { name: 'Neck Pre-Paint', units: data.final_state.neck_pre_paint },
          { name: 'Body Post-Paint', units: data.final_state.body_post_paint },
          { name: 'Neck Post-Paint', units: data.final_state.neck_post_paint },
          { name: 'Ready for Dispatch', units: data.final_state.dispatch },
        ],
        financial_results: data.financial_results
      });
    } catch (error) {
      console.error('Simulation failed:', error);
      console.log('Full error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  return (
    <div className="container">
      <div className="introduction">
        <h1>Guitar Factory Simulation</h1>
        
        <button 
          className="toggle-button"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
        </button>

        {showInstructions && (
          <>
            <div className="intro-section">
              <h2>Production Process</h2>
              <div className="process-grid">
                <div className="process-step">
                  <h3>1. Body Making</h3>
                  <p>Takes 1 hour</p>
                  <p>Uses 2 wood units</p>
                  <p>Worker wage: $25/hour</p>
                </div>
                <div className="process-step">
                  <h3>2. Neck Making</h3>
                  <p>Takes 1 hour</p>
                  <p>Uses 1 wood unit</p>
                  <p>Worker wage: $25/hour</p>
                </div>
                <div className="process-step">
                  <h3>3. Painting</h3>
                  <p>Takes 2 hours</p>
                  <p>Paints both body and neck</p>
                  <p>Worker wage: $30/hour</p>
                </div>
                <div className="process-step">
                  <h3>4. Assembly</h3>
                  <p>Takes 1 hour</p>
                  <p>Uses 1 electronic unit</p>
                  <p>Worker wage: $28/hour</p>
                </div>
              </div>
            </div>

            <div className="intro-section">
              <h2>Costs & Revenue</h2>
              <div className="costs-grid">
                <div className="cost-item">
                  <h3>Materials</h3>
                  <ul>
                    <li>Wood: $50 per unit</li>
                    <li>Electronics: $100 per unit</li>
                  </ul>
                </div>
                <div className="cost-item">
                  <h3>Labor</h3>
                  <ul>
                    <li>Regular hours: Listed hourly rate</li>
                    <li>Overtime ({'>'}40hrs/week): 1.5× regular rate</li>
                  </ul>
                </div>
                <div className="cost-item">
                  <h3>Revenue</h3>
                  <ul>
                    <li>Each guitar sells for: $1,000</li>
                    <li>Guitars are picked up in batches of 50</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="intro-section">
              <h2>Strategy Tips</h2>
              <ul className="tips-list">
                <li>Balance worker numbers to avoid bottlenecks</li>
                <li>Consider overtime costs vs hiring more workers</li>
                <li>Monitor material usage and storage levels</li>
                <li>Watch for production bottlenecks in the logs</li>
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="controls">
        <h2>Simulation Controls</h2>
        <div className="input-group">
          <h3>Time Parameters</h3>
          <div>
            <label>Working Hours per Day</label>
            <input
              type="number"
              name="hours"
              value={params.hours}
              onChange={handleInputChange}
              min="1"
              max="24"
            />
          </div>
          <div>
            <label>Working Days</label>
            <input
              type="number"
              name="days"
              value={params.days}
              onChange={handleInputChange}
              min="1"
            />
          </div>
        </div>

        <div className="input-group">
          <h3>Staffing Levels</h3>
          <div className="grid">
            <div>
              <label>Body Makers</label>
              <input
                type="number"
                name="num_body"
                value={params.num_body}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            <div>
              <label>Neck Makers</label>
              <input
                type="number"
                name="num_neck"
                value={params.num_neck}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            <div>
              <label>Painters</label>
              <input
                type="number"
                name="num_paint"
                value={params.num_paint}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            <div>
              <label>Assemblers</label>
              <input
                type="number"
                name="num_ensam"
                value={params.num_ensam}
                onChange={handleInputChange}
                min="1"
              />
            </div>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
        >
          {loading ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </div>

      {results && (
        <div className="results">
          <h2>Results</h2>
          
          <div className="total-guitars">
            <p>Total Guitars Produced: {results.totalGuitars}</p>
          </div>

          <div className="financial-results">
            <h3>Financial Summary</h3>
            <div className="financial-grid">
              <div>
                <label>Total Revenue:</label>
                <p>${results.financial_results.total_revenue.toLocaleString()}</p>
              </div>
              <div>
                <label>Labor Costs:</label>
                <p>${results.financial_results.labor_costs.toLocaleString()}</p>
              </div>
              <div>
                <label>Material Costs:</label>
                <p>${results.financial_results.material_costs.toLocaleString()}</p>
              </div>
              <div>
                <label>Net Profit:</label>
                <p style={{color: results.financial_results.profit >= 0 ? 'green' : 'red'}}>
                  ${results.financial_results.profit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="chart">
            <BarChart
              width={800}
              height={400}
              data={results.stationMetrics}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="units" fill="#3b82f6" name="Units" />
            </BarChart>
          </div>

          <div className="logs">
            <h3>Simulation Logs</h3>
            <div className="log-container">
              {results.logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuitarFactoryDashboard; 