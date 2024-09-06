# KubeAI: GPU/CPU Orchestration Framework

## Problem Statement

The primary challenge addressed by KubeAI is the reduction of idle time for GPUs in Kubernetes environments. When GPUs are assigned to Kubernetes tasks, they often remain idle after task completion, leading to inefficient resource utilization. KubeAI aims to create a framework or service that optimizes GPU usage by dynamically managing and reallocating these resources.

## Overview

KubeAI is an advanced GPU/CPU orchestration framework designed for efficient resource management in AI and machine learning environments. This project leverages Kubernetes, Docker, AWS, Grafana, Golang, NVIDIA DCGM, Prometheus, GIN Framework, and Material UI to provide a comprehensive solution for dynamic resource allocation and monitoring.

## Demo Video:

https://github.com/user-attachments/assets/eac90a42-70c4-4598-bc7d-88eccaf4e1fe

Key features include:
- Dynamic GPU/CPU allocation to services
- Persistent volume storage across applications
- On-demand allocation and deallocation of CPUs & GPUs
- Detailed monitoring of GPU/CPU usage, temperature, and other metrics
- Kubernetes task creation via UI with direct service URL access
- Integration with Grafana and Prometheus for advanced monitoring and visualization
- Support for various AI frameworks and Jupyter notebook instances

KubeAI allows for close monitoring of GPU memory and temperature, enabling appropriate actions to be taken based on these metrics.

## Architecture Diagram
![image](https://github.com/user-attachments/assets/02f4c8a4-d876-47c8-8d90-de19bfe8e3e5)

## Installation

To set up the KubeAI environment, follow these installation steps for the required components:

1. Docker:
   ```
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io
   ```

2. kubectl:
   ```
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

3. Minikube:
   ```
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   ```

4. Prometheus:
   ```
   wget https://github.com/prometheus/prometheus/releases/download/v2.30.3/prometheus-2.30.3.linux-amd64.tar.gz
   tar xvfz prometheus-*.tar.gz
   cd prometheus-*
   ```

5. Grafana:
   ```
   sudo apt-get install -y apt-transport-https
   sudo apt-get install -y software-properties-common wget
   wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
   echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
   sudo apt-get update
   sudo apt-get install grafana
   ```

6. NVIDIA DCGM:
   ```
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   ```

7. GIN Framework:
   ```
   go get -u github.com/gin-gonic/gin
   ```

8. React:
   ```
   npx create-react-app my-app
   cd my-app
   npm start
   ```

## Usage

To run the KubeAI application:

1. Start the frontend:
   ```
   cd frontend
   npm run start
   ```

2. Start the backend:
   ```
   cd backend 
   go run main.go
   ```

## Components

**1. Kubernetes:** Orchestrates containerized applications, manages deployment, scaling, and operations of application containers across clusters of hosts.

**2. Docker:** Provides containerization technology, allowing applications to be packaged with their dependencies and run in isolated environments.

**3. AWS:** Cloud platform used for hosting and scaling the KubeAI infrastructure.

**4. Grafana:** Provides visualization and analytics for the metrics collected by Prometheus, offering customizable dashboards for monitoring GPU/CPU usage.

**5. Golang:** The primary programming language used for developing the backend services of KubeAI.

**6. NVIDIA DCGM (Data Center GPU Manager):** Provides GPU telemetry and management capabilities, crucial for monitoring GPU health and performance.

**7. Prometheus:** Collects and stores time-series data, used for monitoring system metrics and generating alerts.

**8. GIN Framework:** A web framework written in Go, used for building the backend API of KubeAI.

**9. Material UI:** A popular React UI framework used for designing the frontend interface of KubeAI.
These components work together to create a robust system for GPU/CPU orchestration, enabling efficient resource allocation and detailed monitoring in AI and machine learning environments.

# Application
<img width="1920" alt="Screenshot 2024-09-03 at 5 08 17 PM" src="https://github.com/user-attachments/assets/0ba7a826-bb10-476f-9dda-cf398b3ef0a6">
<img width="1920" alt="Screenshot 2024-09-03 at 5 08 56 PM" src="https://github.com/user-attachments/assets/903cbe21-2275-4a9f-9594-e15660573b4a">
<img width="1920" alt="Screenshot 2024-09-03 at 5 08 34 PM" src="https://github.com/user-attachments/assets/6f995a90-0834-4ad3-b6ec-7b5bd5aedcb4">
<img width="1920" alt="Screenshot 2024-09-03 at 5 08 34 PM" src="https://github.com/user-attachments/assets/8f231529-78ea-4617-b0c0-3e6e4e69c361">





