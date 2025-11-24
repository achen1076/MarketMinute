FROM public.ecr.aws/lambda/python:3.10

# Copy requirements and install dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy Lambda handler and modules
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/
COPY predictions.py ${LAMBDA_TASK_ROOT}/
COPY forecasting.py ${LAMBDA_TASK_ROOT}/
COPY tickers.py ${LAMBDA_TASK_ROOT}/

# Copy quant source code for Schwab API and feature generation
COPY src/ ${LAMBDA_TASK_ROOT}/src/

CMD ["lambda_handler.handler"]
