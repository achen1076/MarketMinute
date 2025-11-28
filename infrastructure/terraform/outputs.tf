output "sagemaker_model_name" {
  description = "Name of the SageMaker model"
  value       = aws_sagemaker_model.quant.name
}

output "sagemaker_endpoint_name" {
  description = "Name of the SageMaker endpoint"
  value       = aws_sagemaker_endpoint.quant.name
}

output "sagemaker_endpoint_arn" {
  description = "ARN of the SageMaker endpoint"
  value       = aws_sagemaker_endpoint.quant.arn
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule for daily analysis"
  value       = aws_cloudwatch_event_rule.daily_analysis.arn
}

output "eventbridge_schedule" {
  description = "Schedule expression for daily analysis"
  value       = aws_cloudwatch_event_rule.daily_analysis.schedule_expression
}
