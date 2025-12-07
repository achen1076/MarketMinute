# EC2 instance for sentiment + relevance models
# Replaces SageMaker serverless for these lightweight services

# Security group for ML services
resource "aws_security_group" "ml_services" {
  name        = "${var.project_name}-${var.environment}-ml-services"
  description = "Security group for sentiment and relevance FastAPI services"
  vpc_id      = aws_vpc.ml_services.id

  # SSH access (restrict to your IP in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # Sentiment service (8001)
  ingress {
    from_port   = 8001
    to_port     = 8001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Sentiment API"
  }

  # Relevance service (8002)
  ingress {
    from_port   = 8002
    to_port     = 8002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Relevance API"
  }

  # Outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ml-services"
  }
}

# VPC for ML services
resource "aws_vpc" "ml_services" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

# Public subnet
resource "aws_subnet" "ml_services" {
  vpc_id                  = aws_vpc.ml_services.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-subnet"
  }
}

# Internet gateway
resource "aws_internet_gateway" "ml_services" {
  vpc_id = aws_vpc.ml_services.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

# Route table
resource "aws_route_table" "ml_services" {
  vpc_id = aws_vpc.ml_services.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ml_services.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rt"
  }
}

# Route table association
resource "aws_route_table_association" "ml_services" {
  subnet_id      = aws_subnet.ml_services.id
  route_table_id = aws_route_table.ml_services.id
}

# Latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 instance
resource "aws_instance" "ml_services" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.ml_services_instance_type
  subnet_id                   = aws_subnet.ml_services.id
  vpc_security_group_ids      = [aws_security_group.ml_services.id]
  iam_instance_profile        = aws_iam_instance_profile.ml_services.name
  associate_public_ip_address = true

  depends_on = [
    aws_internet_gateway.ml_services,
    aws_route_table_association.ml_services
  ]

  user_data = templatefile("${path.module}/user_data.sh", {
    sentiment_port = 8001
    relevance_port = 8002
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-ml-services"
  }

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }
}
