# Secrets Manager for Schwab OAuth token
resource "aws_secretsmanager_secret" "schwab_token" {
  name                    = "${var.project_name}-${var.environment}-schwab-token"
  description             = "Schwab OAuth token for API access"
  recovery_window_in_days = 7
}

# Secret value - must be manually populated
resource "aws_secretsmanager_secret_version" "schwab_token" {
  secret_id     = aws_secretsmanager_secret.schwab_token.id
  secret_string = "{}"  # Placeholder - will be updated with actual token
}

# IAM policy for Lambda to access secrets
resource "aws_iam_role_policy" "lambda_secrets" {
  count = var.lambda_image_uri != "" && var.lambda_image_uri != null ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-lambda-secrets-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.schwab_token.arn
      }
    ]
  })
}
