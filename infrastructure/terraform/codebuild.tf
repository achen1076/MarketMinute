# =============================================================================
# CodeBuild for SageMaker Image
# =============================================================================
# Builds the SageMaker inference Docker image in AWS (no local Docker needed).
# Source: a zip uploaded to S3 containing Dockerfile, src/, models/, etc.
# Output: image pushed to ECR repo `marketminute-sagemaker`.
#
# Cost: ~$0.005/min for general1.small. A typical build is 5-10 min = ~$0.05.
# =============================================================================

# S3 bucket to hold build sources
resource "aws_s3_bucket" "build_artifacts" {
  bucket        = "${var.project_name}-${var.environment}-build-artifacts-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "build_artifacts" {
  bucket = aws_s3_bucket.build_artifacts.id

  rule {
    id     = "expire-old-builds"
    status = "Enabled"

    filter {}

    expiration {
      days = 7
    }
  }
}

data "aws_caller_identity" "current" {}

# IAM role for CodeBuild
resource "aws_iam_role" "codebuild" {
  name = "${var.project_name}-${var.environment}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "codebuild.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${var.project_name}-${var.environment}-codebuild-policy"
  role = aws_iam_role.codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.build_artifacts.arn,
          "${aws_s3_bucket.build_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:DescribeImages"
        ]
        Resource = "*"
      }
    ]
  })
}

# CodeBuild project
resource "aws_codebuild_project" "sagemaker_image" {
  name         = "${var.project_name}-${var.environment}-sagemaker-build"
  description  = "Build and push SageMaker inference image to ECR"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_MEDIUM" # 4 vCPU / 7GB - faster image build
    image           = "aws/codebuild/standard:7.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true # needed for docker-in-docker

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }
    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }
    environment_variable {
      name  = "REPO_NAME"
      value = "marketminute-sagemaker"
    }
  }

  source {
    type      = "S3"
    location  = "${aws_s3_bucket.build_artifacts.bucket}/sagemaker-build-context.zip"
    buildspec = <<-YAML
      version: 0.2
      phases:
        pre_build:
          commands:
            - 'echo "Logging into ECR..."'
            - 'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com'
            - 'export IMAGE_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME'
        build:
          commands:
            - 'echo "Building image..."'
            - 'docker build --platform linux/amd64 --provenance=false -t $REPO_NAME:latest .'
            - 'docker tag $REPO_NAME:latest $IMAGE_URI:latest'
        post_build:
          commands:
            - 'echo "Pushing image..."'
            - 'docker push $IMAGE_URI:latest'
            - 'DIGEST=$(aws ecr describe-images --repository-name $REPO_NAME --image-ids imageTag=latest --region $AWS_REGION --query "imageDetails[0].imageDigest" --output text)'
            - 'echo "Image digest $DIGEST"'
            - 'echo "$IMAGE_URI@$DIGEST" > /tmp/image_uri.txt'
            - 'aws s3 cp /tmp/image_uri.txt s3://${aws_s3_bucket.build_artifacts.bucket}/last_build_image_uri.txt'
    YAML
  }

  cache {
    type = "NO_CACHE"
  }

  logs_config {
    cloudwatch_logs {
      status = "ENABLED"
    }
  }
}

output "build_artifacts_bucket" {
  description = "S3 bucket for CodeBuild source uploads"
  value       = aws_s3_bucket.build_artifacts.bucket
}

output "codebuild_project_name" {
  description = "CodeBuild project that builds the SageMaker image"
  value       = aws_codebuild_project.sagemaker_image.name
}
