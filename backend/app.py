from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from optimize_portfolio import optimize_portfolio
import os

app = Flask(__name__)
CORS(app)

# Use environment variable for debug mode
DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

@app.route('/optimize', methods=['POST'])
def optimize():
    try:
        data = request.get_json()
        selected_tickers = data.get('tickers')
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        optimization_goal = data.get('goal')

        # Validate inputs
        if not all([selected_tickers, start_date, end_date, optimization_goal]):
            return jsonify({"error": "Missing required fields: tickers, startDate, endDate, or optimization goal"}), 400
        
        # Convert start_date and end_date to datetime objects
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD."}), 400

        if end_date < start_date:
            return jsonify({"error": "End date must be after start date."}), 400

        # Call your portfolio optimization function
        results, best = optimize_portfolio(selected_tickers, start_date, end_date, optimization_goal)

        return jsonify({
            'results': results,
            'best_values': best
        })
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=DEBUG)