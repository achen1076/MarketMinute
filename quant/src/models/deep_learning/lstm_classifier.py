"""
LSTM Classifier for time series prediction.
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import logging
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class LSTMModel(nn.Module):
    """LSTM neural network for multiclass classification."""

    def __init__(self, input_dim: int, hidden_dim: int = 128, num_layers: int = 2,
                 num_classes: int = 3, dropout: float = 0.3):
        """
        Initialize LSTM model.

        Args:
            input_dim: Number of input features
            hidden_dim: Hidden dimension size
            num_layers: Number of LSTM layers
            num_classes: Number of output classes
            dropout: Dropout rate
        """
        super(LSTMModel, self).__init__()

        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        # LSTM layers
        self.lstm = nn.LSTM(
            input_dim,
            hidden_dim,
            num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )

        # Attention mechanism
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_dim * 2,
            num_heads=4,
            dropout=dropout,
            batch_first=True
        )

        # Fully connected layers
        self.fc1 = nn.Linear(hidden_dim * 2, hidden_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(hidden_dim, num_classes)

        # Batch normalization
        self.batch_norm = nn.BatchNorm1d(hidden_dim)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)

        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)

        # Take last time step
        out = attn_out[:, -1, :]

        out = self.fc1(out)
        out = self.batch_norm(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)

        return out


class LSTMClassifier:
    """LSTM Classifier wrapper with scikit-learn-like interface."""

    def __init__(
        self,
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        learning_rate: float = 0.001,
        batch_size: int = 64,
        epochs: int = 100,
        patience: int = 15,
        sequence_length: int = 20,
        device: Optional[str] = None
    ):
        """
        Initialize LSTM classifier.

        Args:
            hidden_dim: Hidden dimension size
            num_layers: Number of LSTM layers
            dropout: Dropout rate
            learning_rate: Learning rate
            batch_size: Batch size
            epochs: Maximum epochs
            patience: Early stopping patience
            sequence_length: Length of input sequences
            device: Device to use ('cuda', 'cpu', or None for auto)
        """
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.dropout = dropout
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs
        self.patience = patience
        self.sequence_length = sequence_length

        # Set device
        if device is None:
            self.device = torch.device(
                'cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        logger.info(f"Using device: {self.device}")

        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.best_loss = float('inf')

    def _create_sequences(self, X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for LSTM input."""
        sequences = []
        labels = []

        for i in range(len(X) - self.sequence_length + 1):
            sequences.append(X[i:i + self.sequence_length])
            labels.append(y[i + self.sequence_length - 1])

        return np.array(sequences), np.array(labels)

    def fit(self, X, y, X_val=None, y_val=None):
        """
        Train LSTM model.

        Args:
            X: Training features
            y: Training labels
            X_val: Validation features
            y_val: Validation labels
        """
        logger.info(f"Training LSTM on {len(X)} samples...")

        # Store feature names
        if isinstance(X, pd.DataFrame):
            self.feature_names = list(X.columns)
            X = X.values

        if isinstance(y, pd.Series):
            y = y.values

        label_map = {-1: 0, 0: 1, 1: 2}
        y_mapped = np.array([label_map.get(yi, yi) for yi in y])

        X_scaled = self.scaler.fit_transform(X)

        X_seq, y_seq = self._create_sequences(X_scaled, y_mapped)

        logger.info(
            f"Created {len(X_seq)} sequences of length {self.sequence_length}")

        # Convert to tensors
        X_tensor = torch.FloatTensor(X_seq).to(self.device)
        y_tensor = torch.LongTensor(y_seq).to(self.device)

        # Create data loader
        dataset = TensorDataset(X_tensor, y_tensor)
        train_loader = DataLoader(
            dataset, batch_size=self.batch_size, shuffle=True)

        # Validation data
        if X_val is not None and y_val is not None:
            if isinstance(X_val, pd.DataFrame):
                X_val = X_val.values
            if isinstance(y_val, pd.Series):
                y_val = y_val.values

            y_val_mapped = np.array([label_map.get(yi, yi) for yi in y_val])
            X_val_scaled = self.scaler.transform(X_val)
            X_val_seq, y_val_seq = self._create_sequences(
                X_val_scaled, y_val_mapped)

            X_val_tensor = torch.FloatTensor(X_val_seq).to(self.device)
            y_val_tensor = torch.LongTensor(y_val_seq).to(self.device)

            val_dataset = TensorDataset(X_val_tensor, y_val_tensor)
            val_loader = DataLoader(
                val_dataset, batch_size=self.batch_size, shuffle=False)
        else:
            val_loader = None

        # Initialize model
        input_dim = X_seq.shape[2]
        self.model = LSTMModel(
            input_dim=input_dim,
            hidden_dim=self.hidden_dim,
            num_layers=self.num_layers,
            num_classes=3,
            dropout=self.dropout
        ).to(self.device)

        # Loss and optimizer
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(),
                               lr=self.learning_rate, weight_decay=1e-5)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', patience=5, factor=0.5)

        # Training loop
        best_val_loss = float('inf')
        patience_counter = 0

        for epoch in range(self.epochs):
            # Training
            self.model.train()
            train_loss = 0
            for batch_X, batch_y in train_loader:
                optimizer.zero_grad()
                outputs = self.model(batch_X)
                loss = criterion(outputs, batch_y)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(), max_norm=1.0)
                optimizer.step()
                train_loss += loss.item()

            train_loss /= len(train_loader)

            # Validation
            if val_loader is not None:
                self.model.eval()
                val_loss = 0
                with torch.no_grad():
                    for batch_X, batch_y in val_loader:
                        outputs = self.model(batch_X)
                        loss = criterion(outputs, batch_y)
                        val_loss += loss.item()

                val_loss /= len(val_loader)
                scheduler.step(val_loss)

                # Early stopping
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    patience_counter = 0
                    self.best_loss = val_loss
                else:
                    patience_counter += 1

                if (epoch + 1) % 10 == 0:
                    logger.info(
                        f"Epoch {epoch+1}/{self.epochs} - Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")

                if patience_counter >= self.patience:
                    logger.info(f"Early stopping at epoch {epoch+1}")
                    break
            else:
                if (epoch + 1) % 10 == 0:
                    logger.info(
                        f"Epoch {epoch+1}/{self.epochs} - Train Loss: {train_loss:.4f}")

        logger.info("Training complete")
        return self

    def predict_proba(self, X):
        """Predict probabilities."""
        if isinstance(X, pd.DataFrame):
            X = X.values

        X_scaled = self.scaler.transform(X)

        # Create sequences (pad if necessary)
        if len(X_scaled) < self.sequence_length:
            # Pad with first row
            padding = np.repeat(
                X_scaled[0:1], self.sequence_length - len(X_scaled), axis=0)
            X_scaled = np.vstack([padding, X_scaled])

        X_seq, _ = self._create_sequences(X_scaled, np.zeros(len(X_scaled)))

        X_tensor = torch.FloatTensor(X_seq).to(self.device)

        self.model.eval()
        with torch.no_grad():
            outputs = self.model(X_tensor)
            probas = torch.softmax(outputs, dim=1)

        return probas.cpu().numpy()

    def predict(self, X):
        """Predict class labels."""
        probas = self.predict_proba(X)
        labels = np.argmax(probas, axis=1)

        label_map_reverse = {0: -1, 1: 0, 2: 1}
        return np.array([label_map_reverse[l] for l in labels])

    def save(self, path: str):
        """Save model."""
        Path(path).parent.mkdir(parents=True, exist_ok=True)

        torch.save({
            'model_state_dict': self.model.state_dict(),
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'config': {
                'hidden_dim': self.hidden_dim,
                'num_layers': self.num_layers,
                'dropout': self.dropout,
                'sequence_length': self.sequence_length
            }
        }, path)

        logger.info(f"Model saved to {path}")

    @classmethod
    def load(cls, path: str):
        """Load model."""
        checkpoint = torch.load(path)

        config = checkpoint['config']
        instance = cls(
            hidden_dim=config['hidden_dim'],
            num_layers=config['num_layers'],
            dropout=config['dropout'],
            sequence_length=config['sequence_length']
        )

        instance.scaler = checkpoint['scaler']
        instance.feature_names = checkpoint['feature_names']

        # Recreate model
        input_dim = len(
            instance.feature_names) if instance.feature_names else 10
        instance.model = LSTMModel(
            input_dim=input_dim,
            hidden_dim=config['hidden_dim'],
            num_layers=config['num_layers'],
            dropout=config['dropout']
        ).to(instance.device)

        instance.model.load_state_dict(checkpoint['model_state_dict'])

        logger.info(f"Model loaded from {path}")
        return instance
