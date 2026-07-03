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

# Expire old SageMaker images to prevent ECR storage bloat
resource "aws_ecr_lifecycle_policy" "sagemaker" {
  repository = data.aws_ecr_repository.sagemaker.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 3 images, expire the rest"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 3
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ECR Repository for Lambda
data "aws_ecr_repository" "lambda" {
  count = var.lambda_image_uri != "" && var.lambda_image_uri != null ? 1 : 0
  name  = "marketminute-lambda"
}

resource "aws_ecr_lifecycle_policy" "lambda" {
  count      = var.lambda_image_uri != "" && var.lambda_image_uri != null ? 1 : 0
  repository = data.aws_ecr_repository.lambda[0].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 3 images, expire the rest"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 3
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
