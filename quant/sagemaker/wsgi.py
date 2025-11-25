from flask import Flask, request, jsonify
import inference

app = Flask(__name__)

# Initialize model directory for lazy loading
print("Initializing model directory...")
model_path = inference.model_fn("/opt/ml/model")
# Count available models without loading them
available_models = len(list(model_path.glob("*_lgbm.pkl")))
print(
    f"Model directory ready: {available_models} models available for lazy loading")


@app.route('/ping', methods=['GET'])
def ping():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'models_available': available_models})


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
        predictions = inference.predict_fn(input_data, model_path)

        # Format response
        response = inference.output_fn(predictions, content_type)

        return response, 200, {'Content-Type': 'application/json'}

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
