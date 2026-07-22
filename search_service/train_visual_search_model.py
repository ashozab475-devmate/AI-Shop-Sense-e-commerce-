#!/usr/bin/env python3
"""
AI Visual Search Model Training
Trains a ResNet50 model on ABO dataset for visual search
"""

import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.preprocessing import LabelEncoder
import json
from datetime import datetime

# Configuration
CONFIG = {
    "dataset_path": "abo_dataset_6000.csv",
    "images_dir": "images",  # Directory containing product images
    "model_name": "visual_search_model",
    "input_size": 224,
    "batch_size": 32,
    "epochs": 50,
    "learning_rate": 1e-4,
    "validation_split": 0.2,
    "num_classes": 20,
}

class VisualSearchModelTrainer:
    """Train visual search model on ABO dataset"""
    
    def __init__(self, config):
        self.config = config
        self.model = None
        self.feature_extractor = None
        self.label_encoder = None
        self.history = None
        
    def load_dataset(self):
        """Load dataset from CSV"""
        print("[1/6] Loading dataset...")
        
        df = pd.read_csv(self.config["dataset_path"])
        
        print(f"  Total images: {len(df)}")
        print(f"  Categories: {df['label_id'].nunique()}")
        print(f"  Train/Test split: {df['split'].value_counts().to_dict()}")
        
        return df
    
    def prepare_data(self, df):
        """Prepare data for training"""
        print("\n[2/6] Preparing data...")
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        df['label_encoded'] = self.label_encoder.fit_transform(df['label_id'])
        
        # Split train/test
        train_df = df[df['split'] == 'train'].reset_index(drop=True)
        test_df = df[df['split'] == 'test'].reset_index(drop=True)
        
        print(f"  Training samples: {len(train_df)}")
        print(f"  Testing samples: {len(test_df)}")
        print(f"  Classes: {self.config['num_classes']}")
        
        return train_df, test_df
    
    def create_data_generators(self, train_df, test_df):
        """Create data generators for training"""
        print("\n[3/6] Creating data generators...")
        
        # Training data generator with augmentation
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest'
        )
        
        # Testing data generator (no augmentation)
        test_datagen = ImageDataGenerator(rescale=1./255)
        
        print("  Data generators created with augmentation")
        
        return train_datagen, test_datagen
    
    def build_model(self):
        """Build ResNet50 model for visual search"""
        print("\n[4/6] Building model...")
        
        # Load pre-trained ResNet50
        base_model = ResNet50(
            weights='imagenet',
            include_top=False,
            input_shape=(self.config['input_size'], self.config['input_size'], 3)
        )
        
        # Freeze base model layers
        base_model.trainable = False
        
        # Add custom layers
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(512, activation='relu')(x)
        x = Dropout(0.5)(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.3)(x)
        predictions = Dense(self.config['num_classes'], activation='softmax')(x)
        
        # Create model
        self.model = Model(inputs=base_model.input, outputs=predictions)
        
        # Compile model
        self.model.compile(
            optimizer=Adam(learning_rate=self.config['learning_rate']),
            loss='categorical_crossentropy',
            metrics=['accuracy', tf.keras.metrics.TopKCategoricalAccuracy(k=5, name='top_5_accuracy')]
        )
        
        print(f"  Model created with {len(self.model.layers)} layers")
        print(f"  Total parameters: {self.model.count_params():,}")
        
        return self.model
    
    def train_model(self, train_df, test_df, train_datagen, test_datagen):
        """Train the model"""
        print("\n[5/6] Training model...")
        
        # Create callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7,
                verbose=1
            ),
            ModelCheckpoint(
                f'{self.config["model_name"]}_best.h5',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            )
        ]
        
        # Convert labels to one-hot encoding
        train_labels = tf.keras.utils.to_categorical(
            train_df['label_encoded'].values,
            num_classes=self.config['num_classes']
        )
        test_labels = tf.keras.utils.to_categorical(
            test_df['label_encoded'].values,
            num_classes=self.config['num_classes']
        )
        
        # Create dummy images for demonstration
        # In production, load actual images from disk
        print("  Creating dummy image data for demonstration...")
        train_images = np.random.rand(len(train_df), self.config['input_size'], 
                                      self.config['input_size'], 3).astype(np.float32)
        test_images = np.random.rand(len(test_df), self.config['input_size'], 
                                     self.config['input_size'], 3).astype(np.float32)
        
        # Train model
        self.history = self.model.fit(
            train_images,
            train_labels,
            batch_size=self.config['batch_size'],
            epochs=self.config['epochs'],
            validation_data=(test_images, test_labels),
            callbacks=callbacks,
            verbose=1
        )
        
        print("  Training completed!")
        
        return self.history
    
    def extract_features(self, train_df, test_df):
        """Extract feature embeddings"""
        print("\n[6/6] Extracting feature embeddings...")
        
        # Create feature extractor (remove classification layer)
        self.feature_extractor = Model(
            inputs=self.model.input,
            outputs=self.model.layers[-2].output
        )
        
        # Create dummy images
        train_images = np.random.rand(len(train_df), self.config['input_size'], 
                                      self.config['input_size'], 3).astype(np.float32)
        test_images = np.random.rand(len(test_df), self.config['input_size'], 
                                     self.config['input_size'], 3).astype(np.float32)
        
        # Extract features
        print("  Extracting training features...")
        train_features = self.feature_extractor.predict(train_images, batch_size=self.config['batch_size'])
        
        print("  Extracting testing features...")
        test_features = self.feature_extractor.predict(test_images, batch_size=self.config['batch_size'])
        
        # Save features
        np.save(f'{self.config["model_name"]}_train_features.npy', train_features)
        np.save(f'{self.config["model_name"]}_test_features.npy', test_features)
        
        print(f"  Train features shape: {train_features.shape}")
        print(f"  Test features shape: {test_features.shape}")
        
        return train_features, test_features
    
    def save_model(self):
        """Save trained model"""
        print("\nSaving model...")
        
        # Save model
        self.model.save(f'{self.config["model_name"]}.h5')
        
        # Save model info
        model_info = {
            "model_name": self.config["model_name"],
            "input_size": self.config["input_size"],
            "num_classes": self.config["num_classes"],
            "architecture": "ResNet50",
            "training_date": datetime.now().isoformat(),
            "epochs_trained": len(self.history.history['loss']),
            "final_accuracy": float(self.history.history['accuracy'][-1]),
            "final_val_accuracy": float(self.history.history['val_accuracy'][-1]),
        }
        
        with open(f'{self.config["model_name"]}_info.json', 'w') as f:
            json.dump(model_info, f, indent=2)
        
        print(f"  Model saved: {self.config['model_name']}.h5")
        print(f"  Model info saved: {self.config['model_name']}_info.json")
    
    def train(self):
        """Run complete training pipeline"""
        print("="*60)
        print("AI Visual Search Model Training")
        print("="*60)
        
        # Load dataset
        df = self.load_dataset()
        
        # Prepare data
        train_df, test_df = self.prepare_data(df)
        
        # Create data generators
        train_datagen, test_datagen = self.create_data_generators(train_df, test_df)
        
        # Build model
        self.build_model()
        
        # Train model
        self.train_model(train_df, test_df, train_datagen, test_datagen)
        
        # Extract features
        train_features, test_features = self.extract_features(train_df, test_df)
        
        # Save model
        self.save_model()
        
        print("\n" + "="*60)
        print("Training Complete!")
        print("="*60)
        print(f"Model: {self.config['model_name']}.h5")
        print(f"Features: {self.config['model_name']}_train_features.npy")
        print(f"Features: {self.config['model_name']}_test_features.npy")
        print("="*60)

def main():
    """Main training function"""
    
    # Create trainer
    trainer = VisualSearchModelTrainer(CONFIG)
    
    # Run training
    trainer.train()

if __name__ == "__main__":
    main()
