"""
Cleanup script to remove processed data and backtest results.

Usage:
  python3 scripts/cleanup.py                    # Interactive mode
  python3 scripts/cleanup.py --all              # Clean everything
  python3 scripts/cleanup.py --processed        # Clean processed data only
  python3 scripts/cleanup.py --backtests        # Clean backtest results only
  python3 scripts/cleanup.py --models           # Clean trained models only
"""
import os
import shutil
import argparse
from pathlib import Path


def get_file_size(directory):
    """Get total size of files in directory."""
    total_size = 0
    if not os.path.exists(directory):
        return 0

    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.exists(filepath):
                total_size += os.path.getsize(filepath)

    return total_size


def format_size(size_bytes):
    """Format bytes to human readable."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"


def count_files(directory, pattern='*'):
    """Count files in directory."""
    if not os.path.exists(directory):
        return 0
    path = Path(directory)
    return len(list(path.glob(pattern)))


def clean_processed_data():
    """Remove all processed CSV files."""
    data_dir = Path('data/processed')

    if not data_dir.exists():
        print("✓ No processed data directory found")
        return 0

    file_count = count_files(data_dir, '*.csv')
    total_size = get_file_size(data_dir)

    if file_count == 0:
        print("✓ No processed data files to clean")
        return 0

    print(
        f"\n📂 Processed Data: {file_count} files ({format_size(total_size)})")

    # Delete all CSV files
    deleted = 0
    for csv_file in data_dir.glob('*.csv'):
        try:
            csv_file.unlink()
            deleted += 1
            print(f"  ✓ Deleted: {csv_file.name}")
        except Exception as e:
            print(f"  ❌ Error deleting {csv_file.name}: {e}")

    print(
        f"\n✅ Cleaned {deleted} processed data files ({format_size(total_size)})")
    return total_size


def clean_backtests():
    """Remove all backtest result files."""
    backtest_dir = Path('outputs/backtests')

    if not backtest_dir.exists():
        print("✓ No backtest directory found")
        return 0

    file_count = count_files(backtest_dir, '*.csv')
    total_size = get_file_size(backtest_dir)

    if file_count == 0:
        print("✓ No backtest files to clean")
        return 0

    print(
        f"\n📊 Backtest Results: {file_count} files ({format_size(total_size)})")

    # Delete all CSV files
    deleted = 0
    for csv_file in backtest_dir.glob('*.csv'):
        try:
            csv_file.unlink()
            deleted += 1
            print(f"  ✓ Deleted: {csv_file.name}")
        except Exception as e:
            print(f"  ❌ Error deleting {csv_file.name}: {e}")

    print(f"\n✅ Cleaned {deleted} backtest files ({format_size(total_size)})")
    return total_size


def clean_models():
    """Remove all trained model files."""
    models_dir = Path('outputs/models')

    if not models_dir.exists():
        print("✓ No models directory found")
        return 0

    file_count = count_files(models_dir, '*.pkl')
    total_size = get_file_size(models_dir)

    if file_count == 0:
        print("✓ No model files to clean")
        return 0

    print(
        f"\n🤖 Trained Models: {file_count} files ({format_size(total_size)})")

    # Delete all PKL files
    deleted = 0
    for pkl_file in models_dir.glob('*.pkl'):
        try:
            pkl_file.unlink()
            deleted += 1
            print(f"  ✓ Deleted: {pkl_file.name}")
        except Exception as e:
            print(f"  ❌ Error deleting {pkl_file.name}: {e}")

    print(f"\n✅ Cleaned {deleted} model files ({format_size(total_size)})")
    return total_size


def show_status():
    """Show current disk usage."""
    print("="*70)
    print(" CURRENT DISK USAGE")
    print("="*70)

    # Processed data
    processed_count = count_files('data/processed', '*.csv')
    processed_size = get_file_size('data/processed')
    print(f"\n📂 Processed Data:")
    print(f"   Files: {processed_count}")
    print(f"   Size: {format_size(processed_size)}")

    # Backtests
    backtest_count = count_files('outputs/backtests', '*.csv')
    backtest_size = get_file_size('outputs/backtests')
    print(f"\n📊 Backtest Results:")
    print(f"   Files: {backtest_count}")
    print(f"   Size: {format_size(backtest_size)}")

    # Models
    model_count = count_files('outputs/models', '*.pkl')
    model_size = get_file_size('outputs/models')
    print(f"\n🤖 Trained Models:")
    print(f"   Files: {model_count}")
    print(f"   Size: {format_size(model_size)}")

    # Total
    total_size = processed_size + backtest_size + model_size
    print(f"\n{'='*70}")
    print(f"💾 Total: {format_size(total_size)}")
    print(f"{'='*70}")

    return processed_count + backtest_count + model_count > 0


def interactive_cleanup():
    """Interactive cleanup mode."""
    print("="*70)
    print(" CLEANUP UTILITY")
    print("="*70)

    has_files = show_status()

    if not has_files:
        print("\n✓ Nothing to clean!")
        return

    print("\n\nWhat would you like to clean?")
    print("  1. Processed data only")
    print("  2. Backtest results only")
    print("  3. Trained models only")
    print("  4. Everything")
    print("  5. Cancel")

    choice = input("\nEnter choice (1-5): ").strip()

    total_freed = 0

    if choice == '1':
        total_freed = clean_processed_data()
    elif choice == '2':
        total_freed = clean_backtests()
    elif choice == '3':
        total_freed = clean_models()
    elif choice == '4':
        print("\n⚠️  This will delete ALL processed data, backtests, and models!")
        confirm = input("Are you sure? (yes/no): ").strip().lower()
        if confirm == 'yes':
            total_freed += clean_processed_data()
            total_freed += clean_backtests()
            total_freed += clean_models()
        else:
            print("\n✓ Cancelled")
            return
    elif choice == '5':
        print("\n✓ Cancelled")
        return
    else:
        print("\n❌ Invalid choice")
        return

    print(f"\n{'='*70}")
    print(f"✅ CLEANUP COMPLETE - Freed {format_size(total_freed)}")
    print(f"{'='*70}")


def main():
    parser = argparse.ArgumentParser(
        description='Clean up processed data and results')
    parser.add_argument('--all', action='store_true', help='Clean everything')
    parser.add_argument('--processed', action='store_true',
                        help='Clean processed data only')
    parser.add_argument('--backtests', action='store_true',
                        help='Clean backtest results only')
    parser.add_argument('--models', action='store_true',
                        help='Clean trained models only')
    parser.add_argument('--status', action='store_true',
                        help='Show current disk usage')

    args = parser.parse_args()

    # If no arguments, run interactive mode
    if not any([args.all, args.processed, args.backtests, args.models, args.status]):
        interactive_cleanup()
        return

    if args.status:
        show_status()
        return

    # Clean based on flags
    total_freed = 0

    if args.all:
        print("="*70)
        print(" CLEANING EVERYTHING")
        print("="*70)
        total_freed += clean_processed_data()
        total_freed += clean_backtests()
        total_freed += clean_models()
    else:
        if args.processed:
            total_freed += clean_processed_data()
        if args.backtests:
            total_freed += clean_backtests()
        if args.models:
            total_freed += clean_models()

    print(f"\n{'='*70}")
    print(f"✅ CLEANUP COMPLETE - Freed {format_size(total_freed)}")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
