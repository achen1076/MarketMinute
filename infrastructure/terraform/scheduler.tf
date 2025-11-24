# EventBridge rule to trigger Lambda daily at 4:05 PM EST (21:05 UTC)
# Note: During EDT (summer), this will run at 5:05 PM EDT
resource "aws_cloudwatch_event_rule" "daily_analysis" {
  name                = "${var.project_name}-${var.environment}-daily-analysis"
  description         = "Trigger daily market analysis every weekday at 4:05 PM EST"
  schedule_expression = "cron(5 21 ? * MON-FRI *)"
  state               = "ENABLED"
}

# EventBridge target pointing to Lambda function
resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.daily_analysis.name
  target_id = "lambda"
  arn       = aws_lambda_function.quant_orchestrator[0].arn

  input = jsonencode({
    task = "daily_analysis"
  })
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.quant_orchestrator[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_analysis.arn
}
