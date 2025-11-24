FROM python:3.10-slim

# Install system dependencies for LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install required dependencies
RUN pip install --upgrade pip

# Install dependencies for inference
COPY requirements.txt /opt/ml/code/requirements.txt
RUN pip install -r /opt/ml/code/requirements.txt

# SageMaker-specific folders
RUN mkdir -p /opt/ml/model
RUN mkdir -p /opt/ml/input/data
RUN mkdir -p /opt/ml/code

# Copy inference code
COPY inference.py /opt/ml/code/inference.py
COPY wsgi.py /opt/ml/code/wsgi.py
COPY serve /usr/local/bin/serve

# Copy src code (needed by models)
COPY src/ /opt/ml/code/src/

# Copy trained models (must be in build context)
COPY models/ /opt/ml/model/

ENV PYTHONPATH=/opt/ml/code
ENV FLASK_APP=wsgi.py

# Make serve script executable and set as entrypoint
RUN chmod +x /usr/local/bin/serve

CMD ["python3", "/usr/local/bin/serve"]
