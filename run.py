import subprocess

def run_docker_compose():
    try:
        subprocess.run(["docker", "compose", "up", "-d"], check=True)
        print("✅ Docker Compose started successfully!")

    except subprocess.CalledProcessError as e:
        print(f"❌ Error running Docker Compose: {e}")

def stop_docker_compose():
    try:
        subprocess.run(["docker", "compose", "down"], check=True)
        print("🛑 Docker Compose stopped.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error stopping Docker Compose: {e}")

# Example usage:
if __name__ == "__main__":
    run_docker_compose()
    # stop_docker_compose()
