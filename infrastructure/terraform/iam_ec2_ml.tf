# IAM role for EC2 ML services instance
# Allows pulling from ECR

resource "aws_iam_role" "ml_services_ec2" {
  name = "${var.project_name}-${var.environment}-ml-services-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Policy for ECR access
resource "aws_iam_role_policy" "ml_services_ecr" {
  name = "ecr-pull"
  role = aws_iam_role.ml_services_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "ml_services" {
  name = "${var.project_name}-${var.environment}-ml-services"
  role = aws_iam_role.ml_services_ec2.name
}

# Attach instance profile to EC2
resource "aws_iam_role_policy_attachment" "ml_services_ssm" {
  role       = aws_iam_role.ml_services_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
