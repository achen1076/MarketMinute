# ============================================
# Quant Model (existing)
# ============================================
resource "aws_sagemaker_model" "quant" {
  # Name includes hash of image URI so each new image produces a unique model,
  # allowing create_before_destroy when updating.
  name               = "${var.project_name}-${var.environment}-quant-model-${substr(md5(var.sagemaker_image_uri), 0, 8)}"
  execution_role_arn = aws_iam_role.sagemaker_execution.arn

  primary_container {
    image              = var.sagemaker_image_uri
    mode               = "SingleModel"
    container_hostname = "inference"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_sagemaker_endpoint_configuration" "quant" {
  # Use name_prefix so Terraform can replace this config cleanly when switching
  # endpoint types (serverless <-> real-time) without name conflicts.
  name_prefix = "${var.project_name}-${var.environment}-quant-config-"

  production_variants {
    variant_name = "AllTraffic"
    model_name   = aws_sagemaker_model.quant.name

    # Serverless Inference: pay per invocation only (no 24/7 instance cost).
    # Cold start ~5-15s after idle; fine for daily cron workloads.
    serverless_config {
      memory_size_in_mb = var.sagemaker_memory_mb
      max_concurrency   = var.sagemaker_max_concurrency
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_sagemaker_endpoint" "quant" {
  name = "${var.project_name}-${var.environment}-quant-endpoint"

  endpoint_config_name = aws_sagemaker_endpoint_configuration.quant.name
}

