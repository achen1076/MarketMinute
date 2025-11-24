import sagemaker
from sagemaker.model import Model

AWS_REGION = "us-east-1"
ACCOUNT_ID = "<YOUR_ACCOUNT_ID>"
IMAGE_URI = f"{ACCOUNT_ID}.dkr.ecr.{AWS_REGION}.amazonaws.com/marketminute-quant-sagemaker:latest"

role = "arn:aws:iam::<YOUR_ACCOUNT_ID>:role/SageMakerExecutionRole"

session = sagemaker.Session()

model = Model(
    image_uri=IMAGE_URI,
    model_data=None,  # no .tar.gz needed since image contains model.pkl
    role=role,
    sagemaker_session=session
)

endpoint_name = "marketminute-quant-endpoint"

predictor = model.deploy(
    endpoint_name=endpoint_name,
    instance_type="ml.t2.medium",
    initial_instance_count=1
)

print(f"Deployed at endpoint: {endpoint_name}")
