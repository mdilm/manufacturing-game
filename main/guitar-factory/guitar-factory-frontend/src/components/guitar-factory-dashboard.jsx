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
        
        <div className="intro-section">
          <h2>How It Works</h2>
          <p>
            You're in charge of a guitar manufacturing facility. Your goal is to maximize profits 
            by optimizing the production line while managing labor and material costs.
          </p>
        </div>

        <div className="intro-section">
          <h2>Production Process</h2>
          
          <div className="process-diagram">
            <svg width="900" height="400" viewBox="0 0 900 400">
              {/* Suppliers */}
              <rect x="50" y="300" width="100" height="40" className="box" />
              <text x="100" y="325" className="label">Supplier 1</text>
              
              <rect x="50" y="350" width="100" height="40" className="box" />
              <text x="100" y="375" className="label">Supplier 2</text>

              {/* Storage triangles */}
              <path d="M 200,100 L 240,130 L 200,160 Z" className="triangle" />
              <text x="220" y="140" className="label">Wood</text>
              
              <path d="M 200,50 L 240,80 L 200,110 Z" className="triangle" />
              <text x="220" y="90" className="label">Electronic</text>

              {/* Production boxes */}
              <rect x="300" y="100" width="80" height="40" className="box" />
              <text x="340" y="125" className="label">Body</text>
              
              <rect x="300" y="200" width="80" height="40" className="box" />
              <text x="340" y="225" className="label">Neck</text>

              {/* Storage triangles */}
              <path d="M 420,100 L 460,130 L 420,160 Z" className="triangle" />
              <text x="440" y="140" className="label">Body storage</text>
              
              <path d="M 420,200 L 460,230 L 420,260 Z" className="triangle" />
              <text x="440" y="240" className="label">Neck storage</text>

              {/* Paint station */}
              <rect x="500" y="150" width="80" height="40" className="box" />
              <text x="540" y="175" className="label">Paint</text>

              {/* Post-paint storage */}
              <path d="M 620,100 L 660,130 L 620,160 Z" className="triangle" />
              <text x="640" y="140" className="label">Body storage 2</text>
              
              <path d="M 620,200 L 660,230 L 620,260 Z" className="triangle" />
              <text x="640" y="240" className="label">Neck storage 2</text>

              {/* Assembly and dispatch */}
              <rect x="700" y="150" width="80" height="40" className="box" />
              <text x="740" y="175" className="label">Assembler</text>

              <path d="M 800,150 L 840,180 L 800,210 Z" className="triangle" />
              <text x="820" y="190" className="label">Dispatch</text>

              <rect x="800" y="250" width="80" height="40" className="box" />
              <text x="840" y="275" className="label">Shop</text>

              {/* Connecting arrows */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#000"/>
                </marker>
              </defs>

              {/* Add connecting lines with arrows */}
              <g className="arrows">
                <line x1="240" y1="115" x2="300" y2="120" markerEnd="url(#arrowhead)" />
                <line x1="240" y1="65" x2="700" y2="170" markerEnd="url(#arrowhead)" />
                <line x1="380" y1="120" x2="420" y2="130" markerEnd="url(#arrowhead)" />
                <line x1="380" y1="220" x2="420" y2="230" markerEnd="url(#arrowhead)" />
                <line x1="460" y1="145" x2="500" y2="170" markerEnd="url(#arrowhead)" />
                <line x1="460" y1="245" x2="500" y2="170" markerEnd="url(#arrowhead)" />
                <line x1="580" y1="170" x2="620" y2="130" markerEnd="url(#arrowhead)" />
                <line x1="580" y1="170" x2="620" y2="230" markerEnd="url(#arrowhead)" />
                <line x1="660" y1="145" x2="700" y2="170" markerEnd="url(#arrowhead)" />
                <line x1="660" y1="245" x2="700" y2="170" markerEnd="url(#arrowhead)" />
                <line x1="780" y1="170" x2="800" y2="180" markerEnd="url(#arrowhead)" />
                <line x1="840" y1="195" x2="840" y2="250" markerEnd="url(#arrowhead)" />
              </g>
            </svg>
          </div>

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

        .process-diagram {
          margin: 20px 0;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow-x: auto;
        }

        .process-diagram svg {
          max-width: 100%;
        }

        .process-diagram .box {
          fill: white;
          stroke: #2563eb;
          stroke-width: 2;
        }

        .process-diagram .triangle {
          fill: white;
          stroke: #2563eb;
          stroke-width: 2;
        }

        .process-diagram .label {
          text-anchor: middle;
          font-size: 12px;
          fill: #1f2937;
        }

        .process-diagram .arrows line {
          stroke: #2563eb;
          stroke-width: 2;
        }
      `}</style>
    </div>
  );
};

export default GuitarFactoryDashboard; 