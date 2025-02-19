import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const GuitarFactoryDashboard = () => {
  const [params, setParams] = useState({
    hours: 8,
    days: 23,
    num_body: 2,
    num_neck: 1,
    num_paint: 3,
    num_ensam: 2,
    dispatch_threshold: 50,
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="introduction">
        <div className="header-row">
          <h1>Guitar Factory Simulation</h1>
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
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
                  <p>Average time: 1 hour</p>
                  <p>(Actual time varies)</p>
                  <p>Uses 2 wood units</p>
                  <p>Worker wage: $25/hour</p>
                </div>
                <div className="process-step">
                  <h3>2. Neck Making</h3>
                  <p>Average time: 1 hour</p>
                  <p>(Actual time varies)</p>
                  <p>Uses 1 wood unit</p>
                  <p>Worker wage: $25/hour</p>
                </div>
                <div className="process-step">
                  <h3>3. Painting</h3>
                  <p>Average time: 2 hours</p>
                  <p>(Actual time varies)</p>
                  <p>Paints both body and neck</p>
                  <p>Worker wage: $30/hour</p>
                </div>
                <div className="process-step">
                  <h3>4. Assembly</h3>
                  <p>Average time: 1 hour</p>
                  <p>(Actual time varies)</p>
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
                  <h3>Fixed Costs</h3>
                  <ul>
                    <li>Daily factory operation: $2,000</li>
                    <li>Includes utilities, maintenance, etc.</li>
                  </ul>
                </div>
                <div className="cost-item">
                  <h3>Revenue</h3>
                  <ul>
                    <li>Each guitar sells for: $600</li>
                    <li>Guitars are picked up in batches of 50</li>
                  </ul>
                </div>
                <div className="cost-item">
                  <h3>Dispatch</h3>
                  <ul>
                    <li>Dispatch cost: $500 per pickup</li>
                    <li>Configurable threshold</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="intro-section">
              <h2>Quality Control</h2>
              <div className="process-grid">
                <div className="process-step">
                  <h3>Body & Neck Making</h3>
                  <p>92% average pass rate</p>
                  <p>Failed parts are scrapped</p>
                  <p>Materials cost lost on failure</p>
                </div>
                <div className="process-step">
                  <h3>Painting</h3>
                  <p>85% average pass rate</p>
                  <p>Failed parts are repainted</p>
                  <p>Additional time and labor cost</p>
                </div>
                <div className="process-step">
                  <h3>Assembly</h3>
                  <p>98% average pass rate</p>
                  <p>Failed assemblies are scrapped</p>
                  <p>All materials lost on failure</p>
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
                <li>Plan for occasional worker absences (5% daily sick rate)</li>
                <li>Account for quality control failures in production planning</li>
                <li>Consider extra capacity for paint rework</li>
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

        <div className="input-group">
          <h3>Dispatch Settings</h3>
          <div>
            <label>Dispatch Threshold</label>
            <input
              type="number"
              name="dispatch_threshold"
              value={params.dispatch_threshold}
              onChange={handleInputChange}
              min="1"
              max="500"
            />
            <p className="input-help">Minimum guitars needed to trigger dispatch</p>
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
                <label>Fixed Costs:</label>
                <p>${results.financial_results.fixed_costs.toLocaleString()}</p>
              </div>
              <div>
                <label>Employee Idle Costs:</label>
                <p>${results.financial_results.idle_costs.toLocaleString()}</p>
              </div>
              <div>
                <label>Net Profit:</label>
                <p style={{color: results.financial_results.profit >= 0 ? 'green' : 'red'}}>
                  ${(results.financial_results.total_revenue - 
                     results.financial_results.labor_costs - 
                     results.financial_results.material_costs - 
                     results.financial_results.fixed_costs).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="chart-container">
            {windowWidth > 768 ? (
              <BarChart
                width={Math.min(800, windowWidth - 40)}
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
            ) : (
              <>
                <h3>Station Metrics</h3>
                <div className="mobile-metrics">
                  {results.stationMetrics.map((station, index) => (
                    <div key={index} className="metric-card">
                      <h4>{station.name}</h4>
                      <p className="metric-value">{station.units} units</p>
                    </div>
                  ))}
                </div>
              </>
            )}
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
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .introduction {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .toggle-button {
          margin: 10px 0;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .intro-section {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .process-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }
        
        .process-step {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .process-step h3 {
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .costs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }
        
        .cost-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .cost-item h3 {
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .cost-item ul {
          list-style-type: none;
          padding: 0;
        }
        
        .cost-item li {
          margin: 8px 0;
          padding-left: 20px;
          position: relative;
        }
        
        .cost-item li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #2563eb;
        }
        
        .tips-list {
          list-style-type: none;
          padding: 0;
        }
        
        .tips-list li {
          margin: 10px 0;
          padding-left: 24px;
          position: relative;
        }
        
        .tips-list li:before {
          content: "💡";
          position: absolute;
          left: 0;
        }
        
        .controls {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .input-group {
          margin-bottom: 20px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        input {
          width: 100%;
          padding: 8px;
          margin: 4px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        button {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:disabled {
          background: #93c5fd;
        }

        .results {
          margin-top: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .log-container {
          height: 200px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
        }

        .log-entry {
          margin-bottom: 4px;
          font-size: 14px;
        }

        .financial-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 16px 0;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .financial-grid label {
          font-weight: bold;
          color: #666;
        }
        
        .financial-grid p {
          font-size: 1.2em;
          margin: 4px 0;
        }

        .dark-mode {
          background-color: #1a1a1a;
          color: #e5e5e5;
        }

        .dark-mode .introduction,
        .dark-mode .controls,
        .dark-mode .results,
        .dark-mode .process-step,
        .dark-mode .cost-item {
          background: #2d2d2d;
          color: #e5e5e5;
        }

        .dark-mode .intro-section {
          background: #222;
        }

        .dark-mode input {
          background: #333;
          color: #e5e5e5;
          border-color: #444;
        }

        .dark-mode .financial-grid {
          background: #222;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .theme-toggle {
          padding: 8px 12px;
          font-size: 1.2em;
          background: transparent;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dark-mode .theme-toggle {
          border-color: #444;
        }

        .dark-mode .log-container {
          background: #333;
          border-color: #444;
        }

        .dark-mode .toggle-button:not(:hover) {
          background: #444;
        }

        .chart-container {
          width: 100%;
          overflow-x: auto;
          margin: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .mobile-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          width: 100%;
          padding: 10px;
        }

        .metric-card {
          background: ${darkMode ? '#2d2d2d' : 'white'};
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          text-align: center;
        }

        .metric-card h4 {
          margin: 0 0 10px 0;
          font-size: 0.9em;
          color: ${darkMode ? '#e5e5e5' : '#4b5563'};
        }

        .metric-value {
          font-size: 1.2em;
          font-weight: bold;
          color: #3b82f6;
          margin: 0;
        }

        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }

          .process-grid, 
          .costs-grid {
            grid-template-columns: 1fr;
          }

          .financial-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          input {
            font-size: 16px; /* Prevents zoom on mobile */
          }
        }

        .input-help {
          font-size: 0.9em;
          color: ${darkMode ? '#999' : '#666'};
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default GuitarFactoryDashboard; 