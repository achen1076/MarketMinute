# ECR Repository for SageMaker
data "aws_ecr_repository" "sagemaker" {
  name = "marketminute-sagemaker"
}

# Allow SageMaker to pull images
resource "aws_ecr_repository_policy" "sagemaker_pull" {
  repository = data.aws_ecr_repository.sagemaker.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSageMakerPull"
        Effect = "Allow"
        Principal = {
          Service = "sagemaker.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# ECR Repository for Lambda
data "aws_ecr_repository" "lambda" {
  count = var.lambda_image_uri != "" && var.lambda_image_uri != null ? 1 : 0
  name  = "marketminute-lambda"
}
