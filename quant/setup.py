"""
Setup script to install quant-lstm as a package
"""
from setuptools import setup, find_packages

setup(
    name="quant-lstm",
    version="1.0.0",
    description="Institutional Quant Trading System with Deep Learning",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        # Core requirements are in requirements_institutional.txt
    ],
)
