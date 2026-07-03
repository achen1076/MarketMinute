# =============================================================================
# CloudWatch Log Retention
# =============================================================================
# By default, Lambda and SageMaker create log groups with infinite retention,
# which costs ~$0.03/GB/month forever. Set explicit retention to cap costs.
# =============================================================================

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 14
}

# Orchestrator Lambda log group
resource "aws_cloudwatch_log_group" "orchestrator" {
  count             = var.lambda_image_uri != "none" && var.lambda_image_uri != "" ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.quant_orchestrator[0].function_name}"
  retention_in_days = var.log_retention_days
}

# Agent Lambda log group
resource "aws_cloudwatch_log_group" "agent" {
  count             = var.agent_lambda_image_uri != "none" && var.agent_lambda_image_uri != "" ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.agent[0].function_name}"
  retention_in_days = var.log_retention_days
}

# EC2 scheduler Lambda log group
resource "aws_cloudwatch_log_group" "ec2_scheduler" {
  count             = var.ec2_auto_schedule ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.ec2_scheduler[0].function_name}"
  retention_in_days = var.log_retention_days
}

# SageMaker endpoint log group (auto-created by AWS)
resource "aws_cloudwatch_log_group" "sagemaker_endpoint" {
  name              = "/aws/sagemaker/Endpoints/${aws_sagemaker_endpoint.quant.name}"
  retention_in_days = var.log_retention_days
}
