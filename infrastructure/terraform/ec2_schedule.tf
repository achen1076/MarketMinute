# =============================================================================
# EC2 Scheduled Start/Stop
# =============================================================================
# Saves ~85% of EC2 cost by only running the sentiment/relevance services
# during US market hours on weekdays.
#
# Schedule (UTC, covers EST/EDT safely):
#   Start: 13:00 UTC Mon-Fri  (8 AM EST / 9 AM EDT)
#   Stop:  22:00 UTC Mon-Fri  (5 PM EST / 6 PM EDT)
#
# Lambda cron triggers in lambda.tf run at 21:05 UTC (4:05 PM EST) —
# well within the window.
# =============================================================================

variable "ec2_auto_schedule" {
  description = "Enable scheduled start/stop of the ML services EC2 instance"
  type        = bool
  default     = true
}

# IAM role for the scheduler Lambda
resource "aws_iam_role" "ec2_scheduler" {
  count = var.ec2_auto_schedule ? 1 : 0
  name  = "${var.project_name}-${var.environment}-ec2-scheduler-role"

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

resource "aws_iam_role_policy_attachment" "ec2_scheduler_basic" {
  count      = var.ec2_auto_schedule ? 1 : 0
  role       = aws_iam_role.ec2_scheduler[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "ec2_scheduler" {
  count = var.ec2_auto_schedule ? 1 : 0
  name  = "${var.project_name}-${var.environment}-ec2-scheduler-policy"
  role  = aws_iam_role.ec2_scheduler[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances"
      ]
      Resource = "*"
    }]
  })
}

# Inline Lambda source: start or stop instance based on event payload
data "archive_file" "ec2_scheduler" {
  count       = var.ec2_auto_schedule ? 1 : 0
  type        = "zip"
  output_path = "${path.module}/build/ec2_scheduler.zip"

  source {
    filename = "index.py"
    content  = <<-EOT
      import boto3, os

      ec2 = boto3.client("ec2")
      INSTANCE_ID = os.environ["INSTANCE_ID"]

      def handler(event, context):
          action = event.get("action", "stop")
          if action == "start":
              resp = ec2.start_instances(InstanceIds=[INSTANCE_ID])
              print(f"Started {INSTANCE_ID}: {resp}")
          else:
              resp = ec2.stop_instances(InstanceIds=[INSTANCE_ID])
              print(f"Stopped {INSTANCE_ID}: {resp}")
          return {"action": action, "instance_id": INSTANCE_ID}
    EOT
  }
}

resource "aws_lambda_function" "ec2_scheduler" {
  count            = var.ec2_auto_schedule ? 1 : 0
  function_name    = "${var.project_name}-${var.environment}-ec2-scheduler"
  role             = aws_iam_role.ec2_scheduler[0].arn
  handler          = "index.handler"
  runtime          = "python3.11"
  filename         = data.archive_file.ec2_scheduler[0].output_path
  source_code_hash = data.archive_file.ec2_scheduler[0].output_base64sha256
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      INSTANCE_ID = aws_instance.ml_services.id
    }
  }
}

# Start at 13:00 UTC Mon-Fri
resource "aws_cloudwatch_event_rule" "ec2_start" {
  count               = var.ec2_auto_schedule ? 1 : 0
  name                = "${var.project_name}-${var.environment}-ec2-start"
  description         = "Start ML services EC2 weekday mornings"
  schedule_expression = "cron(0 13 ? * MON-FRI *)"
  state               = "ENABLED"
}

resource "aws_cloudwatch_event_target" "ec2_start" {
  count     = var.ec2_auto_schedule ? 1 : 0
  rule      = aws_cloudwatch_event_rule.ec2_start[0].name
  target_id = "start"
  arn       = aws_lambda_function.ec2_scheduler[0].arn
  input     = jsonencode({ action = "start" })
}

resource "aws_lambda_permission" "ec2_start_invoke" {
  count         = var.ec2_auto_schedule ? 1 : 0
  statement_id  = "AllowEventBridgeStart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec2_scheduler[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ec2_start[0].arn
}

# Stop at 22:00 UTC Mon-Fri (after daily cron at 21:05 UTC)
resource "aws_cloudwatch_event_rule" "ec2_stop" {
  count               = var.ec2_auto_schedule ? 1 : 0
  name                = "${var.project_name}-${var.environment}-ec2-stop"
  description         = "Stop ML services EC2 weekday evenings"
  schedule_expression = "cron(0 22 ? * MON-FRI *)"
  state               = "ENABLED"
}

resource "aws_cloudwatch_event_target" "ec2_stop" {
  count     = var.ec2_auto_schedule ? 1 : 0
  rule      = aws_cloudwatch_event_rule.ec2_stop[0].name
  target_id = "stop"
  arn       = aws_lambda_function.ec2_scheduler[0].arn
  input     = jsonencode({ action = "stop" })
}

resource "aws_lambda_permission" "ec2_stop_invoke" {
  count         = var.ec2_auto_schedule ? 1 : 0
  statement_id  = "AllowEventBridgeStop"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec2_scheduler[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ec2_stop[0].arn
}

# Also add extra weekend stop safety net — stops instance if left running
resource "aws_cloudwatch_event_rule" "ec2_weekend_stop" {
  count               = var.ec2_auto_schedule ? 1 : 0
  name                = "${var.project_name}-${var.environment}-ec2-weekend-stop"
  description         = "Safety: stop ML services EC2 on weekends"
  schedule_expression = "cron(0 2 ? * SAT,SUN *)"
  state               = "ENABLED"
}

resource "aws_cloudwatch_event_target" "ec2_weekend_stop" {
  count     = var.ec2_auto_schedule ? 1 : 0
  rule      = aws_cloudwatch_event_rule.ec2_weekend_stop[0].name
  target_id = "stop"
  arn       = aws_lambda_function.ec2_scheduler[0].arn
  input     = jsonencode({ action = "stop" })
}

resource "aws_lambda_permission" "ec2_weekend_stop_invoke" {
  count         = var.ec2_auto_schedule ? 1 : 0
  statement_id  = "AllowEventBridgeWeekendStop"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec2_scheduler[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ec2_weekend_stop[0].arn
}
