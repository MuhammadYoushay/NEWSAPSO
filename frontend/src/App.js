import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 
import Modal from 'react-modal';
import Chart from 'chart.js/auto'; // Import Chart.js library

Modal.setAppElement('#root');

function App() {
    const [tickers, setTickers] = useState(['MSFT', 'AAPL', 'NVDA', 'AMZN', 'META', 'GOOGL', 'LLY', 'AVGO', 'JPM', 'NFLX'])
    const [selectedTickers, setSelectedTickers] = useState([]);
    const [inputTicker, setInputTicker] = useState('');
    const [startDate, setStartDate] = useState('2022-01-01');
    const [endDate, setEndDate] = useState('2024-01-01');
    const [riskFreeRate, setRiskFreeRate] = useState(0.02);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [goal, setGoal] = useState('1')
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [showSummary, setShowSummary] = useState(false); // State to manage summary visibility
    const [pieChart, setPieChart] = useState(null); // State to hold the pie chart instance
    const [lineChart, setLineChart] = useState(null);
    const [returnsChart, setReturnsChart] = useState(null);
    const [volatilityChart, setVolatilityChart] = useState(null);
    const [CombinedChart, setCombinedChart] = useState(null);
    const [error, setError] = useState(null);

    const getChartLabel = (goal) => {
        switch (goal) {
            case '1':
                return 'Maximize Sharpe Ratio';
            case '2':
                return 'Minimize Volatility';
            case '3':
                return 'Maximize Returns';
            case '4':
                return 'Maximize Sortino Ratio';
            case '5':
                return 'MOPSO (Max Returns - Min Risk)';
            default:
                return 'Optimization Metric'; // Default label if goal is undefined or outside expected range
        }
    };
    

    useEffect(() => {
        if (result && result.results.sorted_ticker_weights) {
            renderPieChart(result.results.sorted_ticker_weights);
        }
        if (result && result.best_values) {
            if (goal === '5') {  // Assuming '5' is the goal that returns dual metricsy
                renderCombinedChart(result.best_values);
                if (lineChart) lineChart.destroy();
            }
            else{
                renderLineChart(result.best_values);
                if (returnsChart) returnsChart.destroy();
            if (CombinedChart) CombinedChart.destroy();
            }
        }
    }, [result, goal]);
    
    

    const renderPieChart = (data) => {
        const ctx = document.getElementById('pieChart');
        if (ctx) {
            if (pieChart) {
                pieChart.destroy(); // Destroy existing chart instance
            }
            setPieChart(new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.map(item => item[0]),
                    datasets: [{
                        label: 'Allocations',
                        data: data.map(item => item[1] * 100), // Convert to percentage
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 152, 215, 0.7)',    
                            'rgba(255, 206, 86, 0.7)',   
                            'rgba(75, 180, 190, 0.9)',   
                            'rgba(153, 102, 255, 0.7)',  
                            'rgba(255, 159, 64, 0.7)',   
                            'rgba(155, 99, 132, 0.9)',   
                            'rgba(54, 162, 235, 0.7)',   
                            'rgba(255, 106, 56, 0.7)',    
                            'rgba(75, 192, 192, 0.7)'    
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }));
        }
    };
    const renderLineChart = (data) => {
        const ctx = document.getElementById('lineChart');
        if (ctx) {
            if (lineChart) {
                lineChart.destroy(); // Destroy existing chart instance if exists
            }
            setLineChart(new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map((_, index) => index + 1), // Creating an array from 1 to number of iterations
                    datasets: [{
                        label: getChartLabel(goal),
                        data: data,
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            
                            title: {
                                display: true,
                                text: 'Value'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Iteration'
                            }
                        }
                    }
                }
            }));
        }
    };
    
   
    const renderCombinedChart = (data) => {
        const ctx = document.getElementById('combinedChart');
        if (ctx) {
            if (lineChart) lineChart.destroy(); // Destroy any existing chart instance
            setLineChart(new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: data.length }, (_, i) => i + 1),
                    datasets: [
                        {
                            label: 'Global Best Returns',
                            data: data.map(item => item[0]),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            tension: 0.1,
                            yAxisID: 'y',
                        },
                        {
                            label: 'Global Best Volatility',
                            data: data.map(item => item[1]),
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            tension: 0.1,
                            yAxisID: 'y1',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Returns'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Volatility',
                                color: 'rgb(255, 99, 132)'
                            },
                            grid: {
                                drawOnChartArea: false // only draw grid lines for this scale
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            }));
        }
    };
    
    const handleTickerClick = (ticker) => {
        setInputTicker(ticker);
    };

    const handleInputChange = (event) => {
        setInputTicker(event.target.value);
    };

    const handleAddTicker = () => {
        setSelectedTickers([...selectedTickers, inputTicker]);
        setInputTicker('');
    };

    const handleClearTickers = () => {
        setSelectedTickers([]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'https://newsapso.onrender.com';
            const response = await axios.post(`${API_URL}/optimize`, {
                tickers: selectedTickers,
                startDate,
                endDate,
                riskFreeRate,
                goal
            });
            setResult(response.data);
            setModalIsOpen(true); // Open the modal after getting the result
            setShowSummary(true); // Show summary when result is available
        } catch (error) {
            if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            setError(error.response.data.error);
          } else if (error.request) {
            // The request was made but no response was received
            console.log(error.request);
            setError('No response from server.');
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
            setError('An error occurred. Please try again later.');
          }
        } finally {
          setLoading(false);
        }
    };

    const handleRemoveTicker = (tickerToRemove) => {
        setSelectedTickers(selectedTickers.filter(ticker => ticker !== tickerToRemove));
    };

    const handleSelectAll = () => {
        setSelectedTickers(tickers);
    };

    return (
        <div className="app">
        <div className="container app-container">
            <h1 className="app-title">Portfolio Optimization Using PSO</h1>
            <form onSubmit={handleSubmit} className="mb-3">
            <div className="mb-3">
                <label className="form-label">Our Recommended Companies (click to select)</label>
                <div className='row-1'>
                <div className="d-flex flx-wrap">
                    {tickers.map((ticker, index) => (
                        <div key={index} className="m-2 ticker-item" onClick={() => handleTickerClick(ticker)}>
                            <img src={`/${ticker}.png`} alt={`${ticker} logo`} className="ticker-logo" />
                        </div>
                    ))}
                </div>
                </div>
                <label className="form-label-left">Input custom ticker</label>
                <input type="text" className="form-control" value={inputTicker} onChange={handleInputChange} />
                <div className='btn-row'>
                <button type="button" className="btn" onClick={handleAddTicker}>Add Ticker</button>
                <button type="button" className="btn" onClick={handleSelectAll}>Select All</button>
                </div>
            </div>

                <div className="mb-3">
                    {/* <label className="form-label">Selected Tickers:</label> */}
                    <div className="selected-tickers-list">
                        {selectedTickers.map((ticker, index) => (
                            <span key={index} className="badge bg-secondaryn m-1">
                                {ticker}
                                <button type="button" className="btn-close btn-close-white ms-2" onClick={() => handleRemoveTicker(ticker)}></button>
                            </span>
                        ))}
                    </div>
                    <div className='btn-row'>
                    <button type="button" className="btn" onClick={handleClearTickers}>Clear All</button>
                    </div>
                </div>
                <div className="mb-3 row">
                    <div className="col">
                        <label className="form-label-left">Start Date:</label>
                        <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="col">
                        <label className="form-label-left">End Date:</label>
                        <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
 
                <div className="row-1">
                <div className="col-md-4">
                    <label>
                    <div className="card">
                        <div className="card-header">
                            Maximize Sharpe Ratio
                        </div>
                        <div className="card-body">
                            <p className="card-text">Optimizes the portfolio for maximum Sharpe Ratio, which represents the average return earned in excess of the risk-free rate per unit of volatility or total risk.</p>
                        </div>
                        <input type="radio" name="goal" value="1" checked={goal === '1'} onChange={(e) => setGoal(e.target.value)} className='radio-button'  />
                    </div>
                    </label>
                </div>
                <div className="col-md-4">
                    <label>
                    <div className="card">
                        <div className="card-header">
                            Minimize Volatility
                        </div>
                        <div className="card-body">
                            <p className="card-text">Optimizes the portfolio for minimum volatility, aiming to achieve the most stable returns by minimizing the standard deviation of the portfolio returns.</p>
                        </div>
                        <input type="radio" name="goal" value="2" checked={goal === '2'} onChange={(e) => setGoal(e.target.value)} className='radio-button' />
                    </div>
                    </label>
                </div>
                <div className="col-md-4">
                    <label>
                    <div className="card">
                        <div className="card-header">
                            Maximize Returns
                        </div>
                        <div className="card-body">
                            <p className="card-text">Optimizes the portfolio for maximum returns, aiming to achieve the highest possible return regardless of the risk.</p>
                        </div>
                        <input type="radio" name="goal" value="3" checked={goal === '3'} onChange={(e) => setGoal(e.target.value)} className='radio-button'  />
                    </div>
                    </label>
                </div>
                <div className="col-md-4">
                    <label>
                    <div className="card">
                        <div className="card-header">
                            Maximize Sortino Ratio
                        </div>
                        <div className="card-body">
                            <p className="card-text">Optimizes the portfolio for maximum return for a given level of downside risk. It is particularly useful as it only considers the downside risk, thus providing a more accurate measure of risk-adjusted returns.</p>
                        </div>
                        <input type="radio" name="goal" value="4" checked={goal === '4'} onChange={(e) => setGoal(e.target.value)} className='radio-button'  />
                    </div>
                    </label>
                </div>
                <div className="col-md-4">
                    <label>
                    <div className="card">
                        <div className="card-header">
                            MOPSO (Max Returns - Min Risk)
                        </div>
                        <div className="card-body">
                            <p className="card-text">Optimizes the portfolio for maximizing returns while minimizing risk. It uses a swarm-based algorithm (Multi Objective Particle Swarm Optimization) to find the optimal trade-off between these two conflicting objectives.</p>
                        </div>
                        <input type="radio" name="goal" value="5" checked={goal === '5'} onChange={(e) => setGoal(e.target.value)} className='radio-button' />
                    </div>
                    </label>
                </div>
            </div>
            <div className='btn-row'>
                <button onClick={handleSubmit} type="submit" className="btn">Optimize Portfolio</button>
               
            </div>
            </form>
            
            {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
            {/* <div className="pie-chart-container">
                    <canvas id="pieChart"></canvas>
            </div> */}
                <Modal
                    isOpen={modalIsOpen}
                    onRequestClose={() => setModalIsOpen(false)}
                    contentLabel="Results"
                    className="Modal"
                    overlayClassName="Overlay"
                >
                    <h2>Allocations</h2>
                    {result && result.results.sorted_ticker_weights && (
                        <div>
                            {result.results.sorted_ticker_weights.map((item, index) => (
                                <p key={index}>{item[0]}: {(item[1]*100).toFixed(2)}%</p>
                            ))}
                        </div>
                    )}
                    <button className="btn" onClick={() => setModalIsOpen(false)}>Close</button>
                </Modal>
                {showSummary && ( // Show summary when showSummary is true
                <div className="statistical-summary">
                <h2>Results</h2>
                <div className="pie-chart-summary-container row-1">
                    
                <div className="pie-chart-container">
                    <canvas id="pieChart"></canvas>
                </div>
                

                <div className="statistical-summary">
                    <h2>Statistical Summary</h2>
                    {result && (
                        <div>
                            <p>Associated Risk: {(result.results.associated_risk * 100).toFixed(2)}%</p>
                            <p>Associated Return: {(result.results.associated_return * 100).toFixed(2)}%</p>
                        </div>
                    )}
                </div>
                </div>
                {goal !== '5' && (
                <div className="chart-container" style={{ height: '40vh', width: '80vw' }}>
                    <canvas id="lineChart"></canvas>
                </div>
            )}
            {goal === '5' && (
                <>
                    <div className="chart-container" style={{ height: '50vh', width: '80vw' }}>
                    <canvas id="combinedChart"></canvas>
                </div>
                </>
            )}
                


            </div>
            )}
        </div>
        </div>
    );
    
}

export default App;