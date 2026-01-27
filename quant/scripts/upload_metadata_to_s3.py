#!/usr/bin/env python3
"""
Upload model_metadata.json to S3

This script uploads the model metadata JSON file to S3 for use by the webapp.
The webapp fetches this metadata to display model quality information.

Usage:
    python upload_metadata_to_s3.py [--metadata-file PATH] [--bucket BUCKET] [--key KEY]

Environment Variables:
    AWS_REGION: AWS region (default: us-east-1)
    MODEL_METADATA_S3_BUCKET: S3 bucket name (default: marketminute-quant-models)
    MODEL_METADATA_S3_KEY: S3 object key (default: model_metadata.json)
"""

import argparse
import json
import os
import sys
from pathlib import Path

import boto3
from botocore.exceptions import ClientError


def upload_metadata_to_s3(
    metadata_file: Path,
    bucket: str,
    key: str,
    region: str = "us-east-1"
) -> bool:
    """
    Upload model metadata JSON file to S3.

    Args:
        metadata_file: Path to the model_metadata.json file
        bucket: S3 bucket name
        key: S3 object key
        region: AWS region

    Returns:
        True if upload successful, False otherwise
    """
    # Validate file exists
    if not metadata_file.exists():
        print(f"❌ Error: Metadata file not found: {metadata_file}")
        return False

    # Validate JSON format
    try:
        with open(metadata_file, 'r') as f:
            data = json.load(f)

        # Validate structure
        if "models" not in data:
            print("❌ Error: Invalid metadata format - missing 'models' key")
            return False

        model_count = len(data.get("models", {}))
        print(f"📊 Found {model_count} models in metadata file")

    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON format: {e}")
        return False

    # Upload to S3
    try:
        print(f"\n🔄 Uploading to S3...")
        print(f"   Bucket: {bucket}")
        print(f"   Key: {key}")
        print(f"   Region: {region}")

        s3_client = boto3.client('s3', region_name=region)

        # Upload with metadata
        s3_client.upload_file(
            str(metadata_file),
            bucket,
            key,
            ExtraArgs={
                'ContentType': 'application/json',
                'CacheControl': 'max-age=3600',  # Cache for 1 hour
            }
        )

        print(f"\n✅ Upload successful!")

        # Verify upload
        response = s3_client.head_object(Bucket=bucket, Key=key)
        size_kb = response['ContentLength'] / 1024
        print(f"   Size: {size_kb:.2f} KB")
        print(f"   Last Modified: {response['LastModified']}")
        print(f"   ETag: {response['ETag']}")

        # Generate S3 URI
        s3_uri = f"s3://{bucket}/{key}"
        https_url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

        print(f"\n📍 S3 URI: {s3_uri}")
        print(f"🌐 HTTPS URL: {https_url}")

        return True

    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        print(f"\n❌ S3 Upload failed: {error_code}")
        print(f"   {error_msg}")

        if error_code == 'NoSuchBucket':
            print(f"\n💡 Bucket '{bucket}' does not exist. Create it first:")
            print(f"   aws s3 mb s3://{bucket} --region {region}")
        elif error_code in ['AccessDenied', 'InvalidAccessKeyId']:
            print(f"\n💡 Check your AWS credentials:")
            print(f"   aws configure")

        return False

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Upload model_metadata.json to S3",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upload using defaults (from env vars)
  python upload_metadata_to_s3.py
  
  # Specify custom file path
  python upload_metadata_to_s3.py --metadata-file /path/to/model_metadata.json
  
  # Override S3 bucket and key
  python upload_metadata_to_s3.py --bucket my-bucket --key my-metadata.json
        """
    )

    # Get project root (parent of scripts directory)
    project_root = Path(__file__).resolve().parents[1]
    default_metadata_file = project_root / "models" / "model_metadata.json"

    parser.add_argument(
        '--metadata-file',
        type=Path,
        default=default_metadata_file,
        help=f'Path to model_metadata.json (default: {default_metadata_file})'
    )

    parser.add_argument(
        '--bucket',
        type=str,
        default=os.getenv('MODEL_METADATA_S3_BUCKET',
                          'marketminute-quant-models'),
        help='S3 bucket name (default: from MODEL_METADATA_S3_BUCKET env var)'
    )

    parser.add_argument(
        '--key',
        type=str,
        default=os.getenv('MODEL_METADATA_S3_KEY', 'model_metadata.json'),
        help='S3 object key (default: from MODEL_METADATA_S3_KEY env var)'
    )

    parser.add_argument(
        '--region',
        type=str,
        default=os.getenv('AWS_REGION', 'us-east-1'),
        help='AWS region (default: from AWS_REGION env var or us-east-1)'
    )

    args = parser.parse_args()

    print("=" * 70)
    print(" MODEL METADATA S3 UPLOAD")
    print("=" * 70)

    success = upload_metadata_to_s3(
        metadata_file=args.metadata_file,
        bucket=args.bucket,
        key=args.key,
        region=args.region
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
