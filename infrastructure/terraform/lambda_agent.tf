# MarketMinute Agent Lambda
# Combines MCP tools + AI orchestrator into a single serverless function

variable "agent_lambda_image_uri" {
  description = "ECR image URI for Agent Lambda (set to 'none' to skip)"
  type        = string
  default     = "none"
}

variable "openai_api_key" {
  description = "OpenAI API key for agent"
  type        = string
  sensitive   = true
  default     = ""
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
  default     = ""
}

resource "aws_lambda_function" "agent" {
  count = var.agent_lambda_image_uri != "none" && var.agent_lambda_image_uri != "" ? 1 : 0

  function_name = "${var.project_name}-${var.environment}-agent"
  package_type  = "Image"
  image_uri     = var.agent_lambda_image_uri
  role          = aws_iam_role.agent_lambda_execution.arn
  timeout       = 300  # 5 minutes for complex queries
  memory_size   = 1024

  environment {
    variables = {
      OPENAI_API_KEY          = var.openai_api_key
      DATABASE_URL            = var.database_url
      FMP_API_KEY             = var.fmp_api_key
      SAGEMAKER_ENDPOINT_NAME = aws_sagemaker_endpoint.quant.name
      PROJECT_NAME            = var.project_name
      ENVIRONMENT             = var.environment
    }
  }
}

# IAM Role for Agent Lambda
resource "aws_iam_role" "agent_lambda_execution" {
  name = "${var.project_name}-${var.environment}-agent-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "agent_lambda_basic" {
  role       = aws_iam_role.agent_lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Allow Agent Lambda to invoke SageMaker
resource "aws_iam_role_policy" "agent_lambda_sagemaker" {
  name = "${var.project_name}-${var.environment}-agent-lambda-sagemaker"
  role = aws_iam_role.agent_lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sagemaker:InvokeEndpoint"]
      Resource = aws_sagemaker_endpoint.quant.arn
    }]
  })
}

# Allow Agent Lambda to read FMP secret (if needed for runtime)
resource "aws_iam_role_policy" "agent_lambda_secrets" {
  count = var.agent_lambda_image_uri != "none" && var.agent_lambda_image_uri != "" ? 1 : 0
  name  = "${var.project_name}-${var.environment}-agent-lambda-secrets"
  role  = aws_iam_role.agent_lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.fmp_api_key.arn]
    }]
  })
}

# Lambda Function URL (public endpoint)
resource "aws_lambda_function_url" "agent" {
  count = var.agent_lambda_image_uri != "none" && var.agent_lambda_image_uri != "" ? 1 : 0

  function_name      = aws_lambda_function.agent[0].function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = [var.webapp_url, "http://localhost:3000", "http://localhost:3001"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    max_age           = 86400
  }
}

resource "aws_lambda_permission" "agent_function_url" {
  count = var.agent_lambda_image_uri != "none" && var.agent_lambda_image_uri != "" ? 1 : 0

  statement_id           = "AllowPublicInvoke"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.agent[0].function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

output "agent_lambda_url" {
  description = "Agent Lambda URL"
  value       = var.agent_lambda_image_uri != "none" && var.agent_lambda_image_uri != "" ? aws_lambda_function_url.agent[0].function_url : "Agent Lambda not deployed"
}
