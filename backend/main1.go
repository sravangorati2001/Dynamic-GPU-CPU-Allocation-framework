package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	karmadaclientset "github.com/karmada-io/karmada/pkg/generated/clientset/versioned"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type Server struct {
	karmadaClient *karmadaclientset.Clientset
}


func createPodAndService(clientset *kubernetes.Clientset, namespace, taskName string, cpus, gpus int, imageName string) (*corev1.Service, error) {
    // Create Pod
    pod := &corev1.Pod{
        ObjectMeta: metav1.ObjectMeta{
            Name: taskName,
            Labels: map[string]string{
                "app": taskName,
            },
        },
        Spec: corev1.PodSpec{
            Containers: []corev1.Container{
                {
                    Name:  taskName,
                    Image: imageName,
                    Resources: corev1.ResourceRequirements{
                        Requests: corev1.ResourceList{
                            corev1.ResourceCPU:    resource.MustParse(fmt.Sprintf("%d", cpus)),
                            "nvidia.com/gpu": resource.MustParse(fmt.Sprintf("%d", gpus)),
                        },
                        Limits: corev1.ResourceList{
                            corev1.ResourceCPU:    resource.MustParse(fmt.Sprintf("%d", cpus)),
                            "nvidia.com/gpu": resource.MustParse(fmt.Sprintf("%d", gpus)),
                        },
                    },
                    Ports: []corev1.ContainerPort{
                        {
                            ContainerPort: 8888,
                            Protocol:      corev1.ProtocolTCP,
                        },
                    },
                },
            },
        },
    }

    // Create pod in the specified namespace
    _, err := clientset.CoreV1().Pods(namespace).Create(context.TODO(), pod, metav1.CreateOptions{})
    if err != nil {
        return nil, fmt.Errorf("failed to create pod: %v", err)
    }

    // Create Service
    service := &corev1.Service{
        ObjectMeta: metav1.ObjectMeta{
            Name: taskName + "-service",
        },
        Spec: corev1.ServiceSpec{
            Type: corev1.ServiceTypeNodePort,
            Selector: map[string]string{
                "app": taskName,
            },
            Ports: []corev1.ServicePort{
                {
                    Port:       8888,
                    TargetPort: intstr.FromInt(8888),
                    Protocol:   corev1.ProtocolTCP,
                },
            },
        },
    }

    // Create service in the specified namespace
    createdService, err := clientset.CoreV1().Services(namespace).Create(context.TODO(), service, metav1.CreateOptions{})
    if err != nil {
        // Cleanup pod if service creation fails
        _ = clientset.CoreV1().Pods(namespace).Delete(context.TODO(), taskName, metav1.DeleteOptions{})
        return nil, fmt.Errorf("failed to create service: %v", err)
    }

    return createdService, nil
}

func getKubeConfig() (*rest.Config, error) {
	// Try in-cluster config first
	config, err := rest.InClusterConfig()
	if err == nil {
		return config, nil
	}

	// Fallback to kubeconfig file
	userHomeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("error getting user home dir: %v", err)
	}

	kubeConfigPath := filepath.Join(userHomeDir, ".kube", "config")
	if envPath := os.Getenv("KUBECONFIG"); envPath != "" {
		kubeConfigPath = envPath
	}

	config, err = clientcmd.BuildConfigFromFlags("", kubeConfigPath)
	if err != nil {
		return nil, fmt.Errorf("error building kubeconfig: %v", err)
	}

	return config, nil
}

func newServer() (*Server, error) {
	// Get kubernetes config
	config, err := getKubeConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get kubeconfig: %v", err)
	}

	// Create Karmada clientset
	karmadaClient, err := karmadaclientset.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create karmada client: %v", err)
	}

	return &Server{
		karmadaClient: karmadaClient,
	}, nil
}
func (s *Server) getClusterClient(clusterName string) (*kubernetes.Clientset, error) {
    // Get local kubeconfig
    homeDir, err := os.UserHomeDir()
    if err != nil {
        return nil, fmt.Errorf("error getting home dir: %v", err)
    }

    // Build config from local kubeconfig file
    config, err := clientcmd.BuildConfigFromFlags("", filepath.Join(homeDir, ".kube", "config"))
    if err != nil {
        return nil, fmt.Errorf("error building config: %v", err)
    }

    // Create kubernetes client
    clientset, err := kubernetes.NewForConfig(config)
    if err != nil {
        return nil, fmt.Errorf("error creating clientset: %v", err)
    }

    return clientset, nil
}
func main1() {
	// Set Gin to release mode in production
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Initialize server
	server, err := newServer()
	if err != nil {
		fmt.Printf("Failed to initialize server: %v\n", err)
		os.Exit(1)
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	// List all clusters in Karmada
	r.GET("/clusters", func(c *gin.Context) {
		clusters, err := server.karmadaClient.ClusterV1alpha1().Clusters().List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var clusterNames []string
		for _, cluster := range clusters.Items {
			clusterNames = append(clusterNames, cluster.Name)
		}

		c.JSON(http.StatusOK, gin.H{"clusters": clusterNames})
	})

	// Get cluster details
	r.GET("/clusters/:cluster", func(c *gin.Context) {
		clusterName := c.Param("cluster")
		
		cluster, err := server.karmadaClient.ClusterV1alpha1().Clusters().Get(context.TODO(), clusterName, metav1.GetOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"name": cluster.Name,
			"apiEndpoint": cluster.Spec.APIEndpoint,
			"version": cluster.Status.KubernetesVersion,
			"conditions": cluster.Status.Conditions,
		})
	})

	// List all pods in a specific cluster
	r.GET("/clusters/:cluster/pods", func(c *gin.Context) {
		clusterName := c.Param("cluster")
		
		// Get client for the specific cluster
		clientset, err := server.getClusterClient(clusterName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// List pods in all namespaces
		pods, err := clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var podList []string
		for _, pod := range pods.Items {
			podList = append(podList, fmt.Sprintf("%s/%s", pod.Namespace, pod.Name))
		}

		c.JSON(http.StatusOK, gin.H{"pods": podList})
	})

	// Deploy service to a cluster
	r.POST("/clusters/:cluster/services", func(c *gin.Context) {
		clusterName := c.Param("cluster")

		// Parse service deployment request
		var serviceReq struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace"`
			Port      int32  `json:"port"`
		}

		if err := c.BindJSON(&serviceReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get client for the specific cluster
		clientset, err := server.getClusterClient(clusterName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create service object
		service := &corev1.Service{
			ObjectMeta: metav1.ObjectMeta{
				Name:      serviceReq.Name,
				Namespace: serviceReq.Namespace,
			},
			Spec: corev1.ServiceSpec{
				Ports: []corev1.ServicePort{
					{
						Port: serviceReq.Port,
					},
				},
				Selector: map[string]string{
					"app": serviceReq.Name,
				},
			},
		}

		// Create service in the cluster
		result, err := clientset.CoreV1().Services(serviceReq.Namespace).Create(context.TODO(), service, metav1.CreateOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Service %s created successfully in cluster %s", result.Name, clusterName),
		})
	})


	r.GET("/clusters/:cluster/namespaces", func(c *gin.Context) {
    clusterName := c.Param("cluster")

    // Get client for the specific cluster
    clientset, err := server.getClusterClient(clusterName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // List namespaces
    namespaces, err := clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    var namespaceList []string
    for _, ns := range namespaces.Items {
        namespaceList = append(namespaceList, ns.Name)
    }

    c.JSON(http.StatusOK, gin.H{"namespaces": namespaceList})
})

// Get services in a namespace
r.GET("/clusters/:cluster/namespaces/:namespace/services", func(c *gin.Context) {
    clusterName := c.Param("cluster")
    namespace := c.Param("namespace")

    // Get client for the specific cluster
    clientset, err := server.getClusterClient(clusterName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // List services in the namespace
    services, err := clientset.CoreV1().Services(namespace).List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    var serviceList []map[string]interface{}
    for _, svc := range services.Items {
        // Convert ports to a more friendly format
        var ports []map[string]interface{}
        for _, port := range svc.Spec.Ports {
            ports = append(ports, map[string]interface{}{
                "port": port.Port,
                "targetPort": port.TargetPort.IntVal,
                "protocol": port.Protocol,
            })
        }

        // Get service age
        age := time.Since(svc.CreationTimestamp.Time).Round(time.Second)

        // Get external IP if available
        var externalIP string
        if len(svc.Status.LoadBalancer.Ingress) > 0 {
            externalIP = svc.Status.LoadBalancer.Ingress[0].IP
        }

        // Determine service health
        health := map[string]string{
            "status": "Healthy",
            "message": "Service is running normally",
        }
        if svc.Spec.Type == "LoadBalancer" && externalIP == "" {
            health = map[string]string{
                "status": "Pending",
                "message": "Waiting for external IP",
            }
        }

        serviceList = append(serviceList, map[string]interface{}{
            "name": svc.Name,
            "type": string(svc.Spec.Type),
            "clusterIP": svc.Spec.ClusterIP,
            "externalIP": externalIP,
            "ports": ports,
            "health": health,
            "age": age.String(),
        })
    }

    c.JSON(http.StatusOK, gin.H{"services": serviceList})
})

r.POST("/create-pod", func(c *gin.Context) {
    var request struct {
        TaskName         string `json:"taskName"`
        CPUs            string `json:"cpus"`
        GPUs            string `json:"gpus"`
        ImageName       string `json:"imageName"`
        Cluster         string `json:"cluster"`
        Namespace       string `json:"namespace"`
    }

    if err := c.BindJSON(&request); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
        return
    }

    // Convert CPU and GPU strings to integers
    cpus, err := strconv.Atoi(request.CPUs)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CPU value"})
        return
    }

    gpus, err := strconv.Atoi(request.GPUs)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid GPU value"})
        return
    }

    // Get cluster client
    clientset, err := server.getClusterClient(request.Cluster)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get cluster client: %v", err)})
        return
    }

    // Create pod and service
    service, err := createPodAndService(clientset, request.Namespace, request.TaskName, cpus, gpus, request.ImageName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Get node IP where the pod is running
    nodeIP := "localhost" // Default for local development
    if len(service.Spec.ClusterIP) > 0 {
        nodeIP = service.Spec.ClusterIP
    }

    // Create service URL
    serviceURL := fmt.Sprintf("http://%s:%d", nodeIP, service.Spec.Ports[0].NodePort)

    c.JSON(http.StatusOK, gin.H{
        "message": "Pod and service created successfully",
        "podName": request.TaskName,
        "serviceName": request.TaskName + "-service",
        "namespace": request.Namespace,
        "cluster": request.Cluster,
        "serviceURL": serviceURL,
    })
})


// Add these new endpoints in your main() function, before r.Run()

// Get detailed information about all clusters
r.GET("/clusters/details", func(c *gin.Context) {
    clusters, err := server.karmadaClient.ClusterV1alpha1().Clusters().List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    var clusterDetails []map[string]interface{}
    for _, cluster := range clusters.Items {
        // Determine cluster status
        status := "Unknown"
        for _, condition := range cluster.Status.Conditions {
            if condition.Type == "Ready" {
                if condition.Status == "True" {
                    status = "Healthy"
                } else {
                    status = "Unhealthy"
                }
                break
            }
        }

        // Get node count
        clientset, err := server.getClusterClient(cluster.Name)
        nodeCount := 0
        if err == nil {
            if nodes, err := clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{}); err == nil {
                nodeCount = len(nodes.Items)
            }
        }

        // Calculate age
        age := time.Since(cluster.CreationTimestamp.Time).Round(time.Second)

        clusterDetails = append(clusterDetails, map[string]interface{}{
            "name":      cluster.Name,
            "status":    status,
            "version":   cluster.Status.KubernetesVersion,
            "nodeCount": nodeCount,
            "region":    cluster.Labels["region"],
            "age":       age.String(),
        })
    }

    c.JSON(http.StatusOK, gin.H{"clusters": clusterDetails})
})

// Get cluster health metrics
r.GET("/clusters/:cluster/health", func(c *gin.Context) {
    clusterName := c.Param("cluster")
    
    cluster, err := server.karmadaClient.ClusterV1alpha1().Clusters().Get(context.TODO(), clusterName, metav1.GetOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    clientset, err := server.getClusterClient(clusterName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Get nodes information
    nodes, err := clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Calculate resource usage
    var totalCPU, totalMemory, usedCPU, usedMemory resource.Quantity
    for _, node := range nodes.Items {
        totalCPU.Add(*node.Status.Capacity.Cpu())
        totalMemory.Add(*node.Status.Capacity.Memory())
        usedCPU.Add(*node.Status.Allocatable.Cpu())
        usedMemory.Add(*node.Status.Allocatable.Memory())
    }

    // Get pod count
    pods, err := clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "name": cluster.Name,
        "status": map[string]interface{}{
            "conditions": cluster.Status.Conditions,
            "resources": map[string]interface{}{
                "cpu": map[string]string{
                    "total": totalCPU.String(),
                    "used":  usedCPU.String(),
                },
                "memory": map[string]string{
                    "total": totalMemory.String(),
                    "used":  usedMemory.String(),
                },
            },
            "nodeCount": len(nodes.Items),
            "podCount":  len(pods.Items),
        },
    })
})

// Get cluster nodes
r.GET("/clusters/:cluster/nodes", func(c *gin.Context) {
    clusterName := c.Param("cluster")
    
    clientset, err := server.getClusterClient(clusterName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    nodes, err := clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    var nodesList []map[string]interface{}
    for _, node := range nodes.Items {
        // Determine node status
        status := "Unknown"
        for _, condition := range node.Status.Conditions {
            if condition.Type == "Ready" {
                if condition.Status == "True" {
                    status = "Ready"
                } else {
                    status = "NotReady"
                }
                break
            }
        }

        // Calculate age
        age := time.Since(node.CreationTimestamp.Time).Round(time.Second)

        nodesList = append(nodesList, map[string]interface{}{
            "name":     node.Name,
            "status":   status,
            "version":  node.Status.NodeInfo.KubeletVersion,
            "os":       node.Status.NodeInfo.OperatingSystem,
            "ip":       node.Status.Addresses[0].Address,
            "capacity": map[string]string{
                "cpu":    node.Status.Capacity.Cpu().String(),
                "memory": node.Status.Capacity.Memory().String(),
                "pods":   node.Status.Capacity.Pods().String(),
            },
            "age": age.String(),
        })
    }

    c.JSON(http.StatusOK, gin.H{"nodes": nodesList})
})

// Get cluster namespace resources
r.GET("/clusters/:cluster/namespaces/:namespace/resources", func(c *gin.Context) {
    clusterName := c.Param("cluster")
    namespace := c.Param("namespace")
    
    clientset, err := server.getClusterClient(clusterName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Get pods in namespace
    pods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Calculate resource usage
    var totalCPURequest, totalMemoryRequest resource.Quantity
    var runningPods, pendingPods, failedPods int

    for _, pod := range pods.Items {
        // Count pods by status
        switch pod.Status.Phase {
        case corev1.PodRunning:
            runningPods++
        case corev1.PodPending:
            pendingPods++
        case corev1.PodFailed:
            failedPods++
        }

        // Sum resource requests
        for _, container := range pod.Spec.Containers {
            if cpu := container.Resources.Requests.Cpu(); cpu != nil {
                totalCPURequest.Add(*cpu)
            }
            if memory := container.Resources.Requests.Memory(); memory != nil {
                totalMemoryRequest.Add(*memory)
            }
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "namespace": namespace,
        "resources": map[string]interface{}{
            "cpu":    totalCPURequest.String(),
            "memory": totalMemoryRequest.String(),
        },
        "pods": map[string]int{
            "running":  runningPods,
            "pending": pendingPods,
            "failed":  failedPods,
            "total":   len(pods.Items),
        },
    })
})

	// Run the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
