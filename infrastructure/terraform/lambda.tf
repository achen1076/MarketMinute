#############################################
# LAMBDA ORCHESTRATOR
# Fetches data, calls SageMaker, returns predictions
#############################################

resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-${var.environment}-lambda-role"

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

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Allow Lambda to invoke SageMaker
resource "aws_iam_role_policy" "lambda_sagemaker" {
  name = "${var.project_name}-${var.environment}-lambda-sagemaker-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sagemaker:InvokeEndpoint"
      ]
      Resource = aws_sagemaker_endpoint.quant.arn
    }]
  })
}

resource "aws_lambda_function" "quant_orchestrator" {
  count = var.lambda_image_uri != "none" && var.lambda_image_uri != "" ? 1 : 0
  
  function_name = "${var.project_name}-${var.environment}-orchestrator"
  package_type  = "Image"
  image_uri     = var.lambda_image_uri
  role          = aws_iam_role.lambda_execution.arn
  timeout       = 300
  memory_size   = 1024
  
  # Natural rate limiting: 32-second execution time + CORS restrictions
  # Reserved concurrency not needed for low-frequency workload (daily cron + occasional manual triggers)

  environment {
    variables = {
      SAGEMAKER_ENDPOINT_NAME = aws_sagemaker_endpoint.quant.name
      SCHWAB_APP_KEY          = var.schwab_app_key
      SCHWAB_APP_SECRET       = var.schwab_app_secret
      PROJECT_NAME            = var.project_name
      ENVIRONMENT             = var.environment
      WEBAPP_URL              = var.webapp_url
    }
  }
}

# Lambda Function URL (public endpoint with restricted CORS)
resource "aws_lambda_function_url" "quant_orchestrator" {
  count = var.lambda_image_uri != "none" && var.lambda_image_uri != "" ? 1 : 0
  
  function_name      = aws_lambda_function.quant_orchestrator[0].function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    # Only allow requests from authorized origins (webapp + localhost for dev)
    allow_origins     = [
      var.webapp_url,
      "http://localhost:3000",
      "http://localhost:3001"
    ]
    allow_methods     = ["POST"]
    allow_headers     = ["content-type", "x-api-key"]
    max_age           = 86400
  }
}

# Permission for public invocation via Function URL
resource "aws_lambda_permission" "allow_function_url" {
  count = var.lambda_image_uri != "none" && var.lambda_image_uri != "" ? 1 : 0
  
  statement_id           = "AllowPublicInvoke"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.quant_orchestrator[0].function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

output "lambda_function_url" {
  description = "Lambda orchestrator URL"
  value       = var.lambda_image_uri != "none" && var.lambda_image_uri != "" ? aws_lambda_function_url.quant_orchestrator[0].function_url : "Lambda not deployed yet"
}
