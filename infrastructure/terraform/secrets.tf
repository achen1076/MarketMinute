# AWS Secrets Manager for FMP API Key
# Stores API key securely instead of environment variable

resource "aws_secretsmanager_secret" "fmp_api_key" {
  name                    = "${var.project_name}-${var.environment}-fmp-api-key"
  description             = "Financial Modeling Prep API key for market data"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "fmp_api_key" {
  secret_id = aws_secretsmanager_secret.fmp_api_key.id
  secret_string = jsonencode({
    FMP_API_KEY = var.fmp_api_key
  })
}

output "fmp_api_key_secret_name" {
  description = "Name of the FMP API key secret"
  value       = aws_secretsmanager_secret.fmp_api_key.name
}
