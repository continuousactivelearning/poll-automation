import subprocess
import sys

def install_pytorch():
    print("Installing PyTorch with CUDA support...")
    
    # Check Python version
    python_version = sys.version_info
    print(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Determine the appropriate PyTorch version based on Python version
    if python_version.minor >= 11:
        # For Python 3.11+
        command = [
            sys.executable, "-m", "pip", "install",
            "torch", "torchvision", "torchaudio",
            "--index-url", "https://download.pytorch.org/whl/cu121"
        ]
    else:
        # For Python 3.10 and below
        command = [
            sys.executable, "-m", "pip", "install",
            "torch==2.2.2+cu121", "torchvision==0.17.2+cu121", "torchaudio==2.2.2+cu121",
            "--index-url", "https://download.pytorch.org/whl/cu121"
        ]
    
    print(f"Running command: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("PyTorch installation successful!")
        print(result.stdout)
    else:
        print("PyTorch installation failed!")
        print(result.stderr)
        
        # Try an alternative installation method
        print("\nTrying alternative installation method...")
        alt_command = [
            sys.executable, "-m", "pip", "install",
            "torch", "torchvision", "torchaudio",
            "--extra-index-url", "https://download.pytorch.org/whl/cu121"
        ]
        print(f"Running command: {' '.join(alt_command)}")
        alt_result = subprocess.run(alt_command, capture_output=True, text=True)
        
        if alt_result.returncode == 0:
            print("Alternative PyTorch installation successful!")
            print(alt_result.stdout)
        else:
            print("Alternative PyTorch installation failed!")
            print(alt_result.stderr)

if __name__ == "__main__":
    install_pytorch()