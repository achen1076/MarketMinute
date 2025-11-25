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
  name = "${var.project_name}-${var.environment}-realtime-config"

  production_variants {
    variant_name           = "AllTraffic"
    model_name             = aws_sagemaker_model.quant.name
    instance_type          = "ml.t2.medium"
    initial_instance_count = 1
  }
}

resource "aws_sagemaker_endpoint" "quant" {
  name = "${var.project_name}-${var.environment}-endpoint"

  endpoint_config_name = aws_sagemaker_endpoint_configuration.quant.name
}
