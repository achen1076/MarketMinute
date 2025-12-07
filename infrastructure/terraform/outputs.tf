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

output "ml_services_instance_id" {
  description = "ID of the EC2 instance running ML services"
  value       = aws_instance.ml_services.id
}

output "ml_services_public_ip" {
  description = "Public IP of the ML services EC2 instance"
  value       = aws_instance.ml_services.public_ip
}

output "sentiment_service_url" {
  description = "URL for sentiment service"
  value       = "http://${aws_instance.ml_services.public_ip}:8001"
}

output "relevance_service_url" {
  description = "URL for relevance service"
  value       = "http://${aws_instance.ml_services.public_ip}:8002"
}
