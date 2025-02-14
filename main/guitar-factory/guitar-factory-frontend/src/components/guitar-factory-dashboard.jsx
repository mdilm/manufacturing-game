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
      <div className="controls">
        <h1>Guitar Factory Simulation</h1>
        
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
      `}</style>
    </div>
  );
};

export default GuitarFactoryDashboard; 