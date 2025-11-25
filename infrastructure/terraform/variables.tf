variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project prefix for resource names"
  type        = string
  default     = "marketminute"
}

variable "environment" {
  description = "Environment name (dev/stage/prod)"
  type        = string
  default     = "dev"
}

variable "sagemaker_image_uri" {
  description = "Full ECR image URI for the SageMaker container"
  type        = string
}

variable "sagemaker_memory_mb" {
  description = "Serverless endpoint memory size in MB (max 3072 for free tier)"
  type        = number
  default     = 3072
}

variable "sagemaker_max_concurrency" {
  description = "Serverless endpoint max concurrent invocations"
  type        = number
  default     = 5
}

variable "lambda_image_uri" {
  description = "ECR image URI for Lambda orchestrator (set to 'none' to skip Lambda)"
  type        = string
  default     = "none"
}

variable "schwab_app_key" {
  description = "Schwab API app key"
  type        = string
  sensitive   = true
  default     = "none"
}

variable "schwab_app_secret" {
  description = "Schwab App Secret for authentication"
  type        = string
  sensitive   = true
}

variable "webapp_url" {
  description = "URL of the Next.js webapp for Sentinel agent integration"
  type        = string
  default     = ""
}

variable "enable_github_oidc" {
  description = "Enable GitHub OIDC provider for CI/CD (eliminates need for AWS keys in GitHub)"
  type        = bool
  default     = false
}

variable "github_repo" {
  description = "GitHub repository in format 'owner/repo' (e.g., 'achen1076/MarketMinute')"
  type        = string
  default     = ""
}
