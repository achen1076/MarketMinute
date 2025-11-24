resource "aws_sagemaker_model" "quant" {
  name               = "${var.project_name}-${var.environment}-model"
  execution_role_arn = aws_iam_role.sagemaker_execution.arn

  primary_container {
    image              = var.sagemaker_image_uri
    mode               = "SingleModel"
    container_hostname = "inference"
  }
}

resource "aws_sagemaker_endpoint_configuration" "quant" {
  name = "${var.project_name}-${var.environment}-serverless-config"

  production_variants {
    variant_name = "AllTraffic"
    model_name   = aws_sagemaker_model.quant.name

    serverless_config {
      memory_size_in_mb = var.sagemaker_memory_mb
      max_concurrency   = var.sagemaker_max_concurrency
    }
  }
}

resource "aws_sagemaker_endpoint" "quant" {
  name = "${var.project_name}-${var.environment}-endpoint"

  endpoint_config_name = aws_sagemaker_endpoint_configuration.quant.name
}
