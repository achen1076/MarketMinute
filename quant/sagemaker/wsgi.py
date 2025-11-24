from flask import Flask, request, jsonify
import inference

app = Flask(__name__)

# Load models on startup
print("Loading models...")
models = inference.model_fn("/opt/ml/model")
print(f"Models loaded: {len(models)} models")


@app.route('/ping', methods=['GET'])
def ping():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'models_loaded': len(models)})


@app.route('/invocations', methods=['POST'])
def invocations():
    """
    Main inference endpoint
    Expected POST body: JSON with prediction request
    """
    try:
        # Parse request
        content_type = request.content_type or 'application/json'
        input_data = inference.input_fn(request.data, content_type)

        # Generate predictions
        predictions = inference.predict_fn(input_data, models)

        # Format response
        response = inference.output_fn(predictions, content_type)

        return response, 200, {'Content-Type': 'application/json'}

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
