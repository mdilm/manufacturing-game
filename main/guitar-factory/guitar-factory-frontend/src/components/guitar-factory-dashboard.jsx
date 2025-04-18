import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const GuitarFactoryDashboard = () => {
  const initialGameState = {
    currentWeek: 1,
    totalDemand: 200,
    remainingDemand: 200,
    weeklyResults: [],
    isGameComplete: false
  };

  const initialParams = {
    hours: 8,
    days: 5,
    num_body: 2,
    num_neck: 1,
    num_paint: 3,
    num_ensam: 2,
    dispatch_threshold: 50,
    total_demand: 200,
    current_week: 1
  };

  const [gameState, setGameState] = useState(initialGameState);
  const [params, setParams] = useState(initialParams);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showFinalModal, setShowFinalModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (gameState.isGameComplete) {
      setShowFinalModal(true);
    }
  }, [gameState.isGameComplete]);

  const resetGame = () => {
    setGameState(initialGameState);
    setParams(initialParams);
    setResults(null);
  };

  const runWeek = async () => {
    setLoading(true);
    try {
      console.log('Attempting to connect to:', `${API_BASE_URL}/api/simulate_week`);
      console.log('Sending params:', {
        ...params,
        current_week: gameState.currentWeek
      });

      const response = await fetch(`${API_BASE_URL}/api/simulate_week`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...params,
          current_week: gameState.currentWeek
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const weekResult = await response.json();
      console.log('Received result:', weekResult);
      
      setGameState(prev => ({
        ...prev,
        currentWeek: weekResult.week_number + 1,
        remainingDemand: weekResult.remaining_demand,
        weeklyResults: [...prev.weeklyResults, weekResult],
        isGameComplete: weekResult.week_number >= 4
      }));
      
      setResults(weekResult);
    } catch (error) {
      console.error('Week simulation failed:', error);
      // Add user-visible error message
      alert(`Failed to run simulation: ${error.message}. Check console for details.`);
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

  const formatMetricsForChart = (finalState) => {
    return [
      { name: 'Wood Stock', units: finalState.wood_level },
      { name: 'Electronic Parts', units: finalState.electronic_level },
      { name: 'Body Pre-Paint', units: finalState.body_pre_paint },
      { name: 'Neck Pre-Paint', units: finalState.neck_pre_paint },
      { name: 'Body Post-Paint', units: finalState.body_post_paint },
      { name: 'Neck Post-Paint', units: finalState.neck_post_paint },
      { name: 'Ready for Dispatch', units: finalState.dispatch }
    ];
  };

  const calculateTotalResults = () => {
    const totals = {
      guitars_made: 0,
      total_revenue: 0,
      labor_costs: 0,
      material_costs: 0,
      fixed_costs: 0,
      idle_costs: 0,
      demand_penalty: 0
    };

    gameState.weeklyResults.forEach(week => {
      totals.guitars_made += week.guitars_made;
      totals.total_revenue += week.financial_results.total_revenue;
      totals.labor_costs += week.financial_results.labor_costs;
      totals.material_costs += week.financial_results.material_costs;
      totals.fixed_costs += week.financial_results.fixed_costs;
      totals.idle_costs += week.financial_results.idle_costs;
      totals.demand_penalty += week.demand_penalty;
    });

    return totals;
  };

  const handlePlayAgain = () => {
    setShowFinalModal(false);  // Close modal
    resetGame();  // Reset game state
  };

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="content-wrapper">
        <div className="header-row">
          <h1>Guitar Factory Simulation</h1>
          <div className="header-controls">
            <button 
              className="reset-button"
              onClick={resetGame}
            >
              Reset Game
            </button>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
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
              <h2>Game Mechanics</h2>
              <div className="mechanics-grid">
                <div className="mechanics-step">
                  <h3>Weekly Gameplay</h3>
                  <ul>
                    <li>The game runs for 4 weeks</li>
                    <li>Each week is 5 working days</li>
                    <li>Production continues from previous week's state</li>
                    <li>Between weeks you can adjust:</li>
                    <ul>
                      <li>Number of workers in each role</li>
                      <li>Dispatch threshold for shipping</li>
                    </ul>
                    <li>Inventory levels carry over between weeks</li>
                  </ul>
                </div>
                <div className="mechanics-step">
                  <h3>Production Goals</h3>
                  <ul>
                    <li>Monthly target: 200 guitars</li>
                    <li>Weekly target: 50 guitars</li>
                    <li>Guitars only count as produced when dispatched</li>
                    <li>Revenue is earned only after dispatch</li>
                    <li>Penalty applies if monthly target is missed</li>
                  </ul>
                </div>
                <div className="mechanics-step">
                  <h3>Strategy Tips</h3>
                  <ul>
                    <li>Balance worker numbers to avoid bottlenecks</li>
                    <li>Set dispatch threshold to optimize deliveries</li>
                    <li>Monitor inventory levels between stages</li>
                    <li>Watch for worker idle time and storage capacity</li>
                    <li>Adjust strategy based on weekly performance</li>
                  </ul>
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
                    <li>Each guitar sells for: $800</li>
                    <li>Guitars are picked up when reaching dispatch threshold</li>
                    <li>Each dispatch costs $500 regardless of batch size</li>
                    <li>Higher threshold means fewer dispatches but more storage used</li>
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
                  <p>Each Maker has a wage of $25/hour</p>
                </div>
                <div className="process-step">
                  <h3>Painting</h3>
                  <p>85% average pass rate</p>
                  <p>Failed parts are repainted</p>
                  <p>Additional time and labor cost</p>
                  <p>Each Maker has a wage of $23/hour</p>
                </div>
                <div className="process-step">
                  <h3>Assembly</h3>
                  <p>98% average pass rate</p>
                  <p>Failed assemblies are scrapped</p>
                  <p>All materials lost on failure</p>
                  <p>Each Maker has a wage of $30/hour</p>
                </div>
              </div>
            </div>

            <div className="intro-section">
              <h2>Strategy Tips</h2>
              <ul className="tips-list">
                <li>Balance worker numbers to avoid bottlenecks</li>
                <li>Consider overtime costs vs hiring more workers</li>
                <li>Monitor material usage and storage levels</li>
                <li>Optimize dispatch threshold: lower means frequent small batches, higher means fewer large batches</li>
                <li>Watch for production bottlenecks in the logs</li>
                <li>Plan for occasional worker absences (5% daily sick rate)</li>
                <li>Account for quality control failures in production planning</li>
                <li>Consider extra capacity for paint rework</li>
              </ul>
            </div>
          </>
        )}

        <div className="game-status">
          <h2>Game Progress</h2>
          <div className="status-grid">
            <div>
              <label>Current Week:</label>
              <p>{gameState.currentWeek}/4</p>
            </div>
            <div>
              <label>Total Demand:</label>
              <p>{gameState.totalDemand} guitars</p>
            </div>
            <div>
              <label>Remaining Demand:</label>
              <p>{gameState.remainingDemand} guitars</p>
            </div>
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
            onClick={runWeek}
            disabled={loading || gameState.isGameComplete}
          >
            {loading ? 'Running Week...' : 
             gameState.isGameComplete ? 'Game Complete' : 
             `Run Week ${gameState.currentWeek}`}
          </button>
        </div>

        {results && results.financial_results && (
          <div className="results">
            <h2>Week {results.week_number} Results</h2>
            
            <div className="weekly-summary">
              <p>Weekly Demand: {gameState.totalDemand / 4} guitars</p>
              <p>Guitars Produced: {results.guitars_made}</p>
              <p>Overproduction: {results.overproduction}</p>
              {results.demand_penalty > 0 && (
                <p className="penalty">Demand Penalty: ${results.demand_penalty.toLocaleString()}</p>
              )}
            </div>

            <div className="total-guitars">
              <p>Total Guitars Produced: {results.guitars_made}</p>
            </div>

            <div className="financial-results">
              <h3>Financial Summary</h3>
              <div className="financial-grid">
                <div className="weekly-section">
                  <h4>Week {results.week_number} Results</h4>
                  <div>
                    <label>Weekly Revenue:</label>
                    <p>${results.financial_results.total_revenue?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label>Weekly Labor Costs:</label>
                    <p>${results.financial_results.labor_costs?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label>Weekly Material Costs:</label>
                    <p>${results.financial_results.material_costs?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label>Weekly Fixed Costs:</label>
                    <p>${results.financial_results.fixed_costs?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label>Weekly Employee Idle Costs:</label>
                    <p>${results.financial_results.idle_costs?.toLocaleString()}</p>
                    <p className="cost-note">(Opportunity cost - not included in profit)</p>
                  </div>
                  <div>
                    <label>Weekly Net Profit:</label>
                    {(() => {
                      const profit = results.financial_results.total_revenue - 
                                   results.financial_results.labor_costs - 
                                   results.financial_results.material_costs - 
                                   results.financial_results.fixed_costs;
                      return (
                        <p style={{color: profit >= 0 ? 'green' : 'red'}}>
                          ${profit.toLocaleString()}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div className="cumulative-section">
                  <h4>Cumulative Results</h4>
                  {(() => {
                    const totals = calculateTotalResults();
                    return (
                      <>
                        <div>
                          <label>Total Revenue:</label>
                          <p>${totals.total_revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <label>Total Labor Costs:</label>
                          <p>${totals.labor_costs.toLocaleString()}</p>
                        </div>
                        <div>
                          <label>Total Material Costs:</label>
                          <p>${totals.material_costs.toLocaleString()}</p>
                        </div>
                        <div>
                          <label>Total Fixed Costs:</label>
                          <p>${totals.fixed_costs.toLocaleString()}</p>
                        </div>
                        <div>
                          <label>Total Employee Idle Costs:</label>
                          <p>${totals.idle_costs.toLocaleString()}</p>
                          <p className="cost-note">(Opportunity cost - not included in profit)</p>
                        </div>
                        <div>
                          <label>Total Net Profit:</label>
                          {(() => {
                            const totalProfit = totals.total_revenue - 
                                              totals.labor_costs - 
                                              totals.material_costs - 
                                              totals.fixed_costs;
                            return (
                              <p style={{color: totalProfit >= 0 ? 'green' : 'red'}}>
                                ${totalProfit.toLocaleString()}
                              </p>
                            );
                          })()}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="chart-container">
              {windowWidth > 768 ? (
                <BarChart
                  width={Math.min(1000, windowWidth - 40)}
                  height={500}
                  data={formatMetricsForChart(results.final_state)}
                  margin={{ top: 20, right: 20, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="units" fill="#3b82f6" name="Units" />
                </BarChart>
              ) : (
                <>
                  <h3>Station Metrics</h3>
                  <div className="mobile-metrics">
                    {formatMetricsForChart(results.final_state).map((station, index) => (
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

        {gameState.weeklyResults.length > 0 && (
          <div className="historical-results">
            <h2>Previous Weeks</h2>
            {gameState.weeklyResults.map((week, index) => (
              <div key={index} className="week-summary">
                <h3>Week {week.week_number} Summary</h3>
                <div className="historical-grid">
                  <div className="production-metrics">
                    <p>Guitars Produced: {week.guitars_made}</p>
                    <p>Weekly Target: {gameState.totalDemand / 4}</p>
                    {week.overproduction > 0 && (
                      <p>Overproduction: {week.overproduction}</p>
                    )}
                    {week.logs && (
                      <div className="sick-days-summary">
                        <h4>Employee Attendance</h4>
                        {(() => {
                          const sickDays = week.logs.filter(log => log.includes('called in sick'));
                          if (sickDays.length > 0) {
                            return (
                              <>
                                <p className="sick-days-count">{sickDays.length} employees called in sick</p>
                                <div className="sick-days-details">
                                  {sickDays.map((log, idx) => (
                                    <p key={idx} className="sick-day-entry">{log}</p>
                                  ))}
                                </div>
                              </>
                            );
                          } else {
                            return <p className="no-sick-days">No employees called in sick this week</p>;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="financial-metrics">
                    <div className="historical-financial-grid">
                      <div>
                        <label>Revenue:</label>
                        <p>${week.financial_results.total_revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <label>Labor Costs:</label>
                        <p>${week.financial_results.labor_costs.toLocaleString()}</p>
                      </div>
                      <div>
                        <label>Material Costs:</label>
                        <p>${week.financial_results.material_costs.toLocaleString()}</p>
                      </div>
                      <div>
                        <label>Fixed Costs:</label>
                        <p>${week.financial_results.fixed_costs.toLocaleString()}</p>
                      </div>
                      {week.demand_penalty > 0 && (
                        <div>
                          <label>Demand Penalty:</label>
                          <p className="penalty">${week.demand_penalty.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <label>Week Profit:</label>
                        {(() => {
                          const profit = week.financial_results.total_revenue - 
                                       week.financial_results.labor_costs - 
                                       week.financial_results.material_costs - 
                                       week.financial_results.fixed_costs;
                          return (
                            <p style={{color: profit >= 0 ? 'green' : 'red', fontWeight: 'bold'}}>
                              ${profit.toLocaleString()}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showFinalModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Month End Results</h2>
                <button className="close-button" onClick={() => setShowFinalModal(false)}>×</button>
              </div>
              {(() => {
                const totals = calculateTotalResults();
                const finalProfit = totals.total_revenue - totals.labor_costs - 
                                  totals.material_costs - totals.fixed_costs - 
                                  totals.demand_penalty;
                return (
                  <>
                    <div className="modal-body">
                      <div className="production-summary">
                        <h3>Production Achievement</h3>
                        <div className="achievement-stats">
                          <div className="stat-item">
                            <label>Total Production:</label>
                            <p>{totals.guitars_made} guitars</p>
                          </div>
                          <div className="stat-item">
                            <label>Monthly Target:</label>
                            <p>{gameState.totalDemand} guitars</p>
                          </div>
                          <div className="stat-item">
                            <label>Achievement Rate:</label>
                            <p>{((totals.guitars_made / gameState.totalDemand) * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="financial-summary">
                        <h3>Financial Results</h3>
                        <div className="financial-stats">
                          <div className="stat-row">
                            <label>Total Revenue:</label>
                            <p className="positive">+${totals.total_revenue.toLocaleString()}</p>
                          </div>
                          <div className="stat-row">
                            <label>Labor Costs:</label>
                            <p className="negative">-${totals.labor_costs.toLocaleString()}</p>
                          </div>
                          <div className="stat-row">
                            <label>Material Costs:</label>
                            <p className="negative">-${totals.material_costs.toLocaleString()}</p>
                          </div>
                          <div className="stat-row">
                            <label>Fixed Costs:</label>
                            <p className="negative">-${totals.fixed_costs.toLocaleString()}</p>
                          </div>
                          {totals.demand_penalty > 0 && (
                            <div className="stat-row">
                              <label>Demand Penalty:</label>
                              <p className="negative">-${totals.demand_penalty.toLocaleString()}</p>
                            </div>
                          )}
                          <div className="stat-row total">
                            <label>Final Profit:</label>
                            <p className={finalProfit >= 0 ? 'positive' : 'negative'}>
                              ${finalProfit.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        className="close-button-secondary" 
                        onClick={() => setShowFinalModal(false)}
                      >
                        Close
                      </button>
                      <button 
                        className="play-again-button"
                        onClick={handlePlayAgain}
                      >
                        Play Again
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        :global(html), :global(body), :global(#root) {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          width: 100vw;
          background-color: ${darkMode ? '#1a1a1a' : '#ffffff'};
          transition: background-color 0.3s ease;
        }

        .container {
          min-height: 100vh;
          width: 100vw;
          padding: 20px;
          box-sizing: border-box;
          background-color: ${darkMode ? '#1a1a1a' : '#ffffff'};
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        .introduction {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          gap: 20px;
          margin: 16px 0;
          padding: 16px;
          background: ${darkMode ? '#2d2d2d' : '#f8f9fa'};
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
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 20px 0;
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

        .game-status {
          margin: 20px 0;
          padding: 20px;
          background: ${darkMode ? '#2d2d2d' : '#f3f4f6'};
          border-radius: 8px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .penalty {
          color: #dc2626;
          font-weight: bold;
        }

        .header-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .reset-button {
          padding: 8px 16px;
          background-color: ${darkMode ? '#444' : '#e0e0e0'};
          color: ${darkMode ? '#fff' : '#000'};
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .reset-button:hover {
          background-color: ${darkMode ? '#555' : '#d0d0d0'};
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

        .final-results {
          margin-top: 40px;
          padding: 30px;
          background: ${darkMode ? '#2d2d2d' : '#fff'};
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .monthly-summary {
          margin: 20px 0;
          padding: 20px;
          background: ${darkMode ? '#222' : '#f8f9fa'};
          border-radius: 8px;
        }

        .monthly-summary h3 {
          margin-bottom: 15px;
          color: ${darkMode ? '#e5e5e5' : '#2563eb'};
        }

        .historical-results {
          margin-top: 30px;
          padding: 20px;
          background: ${darkMode ? '#2d2d2d' : '#fff'};
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .week-summary {
          margin: 15px 0;
          padding: 15px;
          background: ${darkMode ? '#222' : '#f8f9fa'};
          border-radius: 6px;
        }

        .historical-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
          margin-top: 10px;
        }

        .historical-financial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .production-metrics p {
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .historical-grid {
            grid-template-columns: 1fr;
          }
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: ${darkMode ? '#2d2d2d' : '#ffffff'};
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: ${darkMode ? '#fff' : '#333'};
        }

        .achievement-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .financial-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 20px 0;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid ${darkMode ? '#444' : '#eee'};
        }

        .stat-row.total {
          border-top: 2px solid ${darkMode ? '#444' : '#ddd'};
          font-weight: bold;
          font-size: 1.2em;
          margin-top: 12px;
          padding-top: 12px;
        }

        .positive { color: #22c55e; }
        .negative { color: #ef4444; }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-footer button {
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .close-button-secondary {
          background-color: ${darkMode ? '#444' : '#e0e0e0'};
          color: ${darkMode ? '#fff' : '#000'};
        }

        .play-again-button {
          background-color: #3b82f6;
          color: white;
        }

        .modal-footer button {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .mechanics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }

        .mechanics-step {
          background: ${darkMode ? '#2d2d2d' : 'white'};
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .mechanics-step h3 {
          color: #2563eb;
          margin-bottom: 15px;
        }

        .mechanics-step ul {
          list-style-type: disc;
          padding-left: 20px;
        }

        .mechanics-step ul ul {
          list-style-type: circle;
          margin-left: 20px;
        }

        .mechanics-step li {
          margin: 8px 0;
        }

        .weekly-section, .cumulative-section {
          background: ${darkMode ? '#222' : '#f8f9fa'};
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .weekly-section h4, .cumulative-section h4 {
          color: ${darkMode ? '#e5e5e5' : '#2563eb'};
          margin-bottom: 15px;
          border-bottom: 1px solid ${darkMode ? '#444' : '#ddd'};
          padding-bottom: 8px;
        }

        .financial-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 16px 0;
          padding: 16px;
          background: ${darkMode ? '#2d2d2d' : '#f8f9fa'};
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .financial-grid {
            grid-template-columns: 1fr;
          }
        }

        .sick-days-summary {
          margin-top: 15px;
          padding: 10px;
          background: ${darkMode ? '#333' : '#f0f0f0'};
          border-radius: 6px;
        }

        .sick-days-summary h4 {
          color: ${darkMode ? '#e5e5e5' : '#2563eb'};
          margin-bottom: 10px;
        }

        .sick-days-count {
          font-weight: bold;
          color: ${darkMode ? '#ff6b6b' : '#dc2626'};
        }

        .sick-days-details {
          margin-top: 8px;
          font-size: 0.9em;
        }

        .sick-day-entry {
          margin: 4px 0;
          padding-left: 15px;
          position: relative;
        }

        .sick-day-entry:before {
          content: "🤒";
          position: absolute;
          left: 0;
        }

        .no-sick-days {
          color: ${darkMode ? '#4ade80' : '#16a34a'};
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default GuitarFactoryDashboard; 