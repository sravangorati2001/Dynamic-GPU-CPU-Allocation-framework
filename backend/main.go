package main

import (
    "io"
    "log"
    "fmt"
    "context"
    "net/http"
    "os/exec"
    "regexp"
    "strings"
    "time"
    "strconv"
    corev1 "k8s.io/api/core/v1"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "k8s.io/client-go/kubernetes"
    "k8s.io/client-go/tools/clientcmd"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    "k8s.io/apimachinery/pkg/util/wait"
    "k8s.io/apimachinery/pkg/api/resource"
    v1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/util/intstr"
)

type TaskRequest struct {
    TaskName  string `json:"taskName" binding:"required"`
    CPUs      string `json:"cpus" binding:"required"`
    GPUs      string `json:"gpus" binding:"required"`
    ImageName string `json:"imageName" binding:"required"`
}

type AddResourcesRequest struct {
    TaskName string `json:"taskName" binding:"required"`
    GPUs     string `json:"gpus" binding:"required"`
    CPUs     string `json:"cpus" binding:"required"`
}

func main() {
    router := gin.Default()
    router.Use(cors.Default())
    // Build the Kubernetes config from the Minikube kubeconfig file
    config, err := clientcmd.BuildConfigFromFlags("", "/home/ubuntu/.kube/config")
    if err != nil {
        log.Fatalf("Failed to load Kubernetes config: %v", err)
    }

    // Create the Kubernetes clientset
    clientset, err := kubernetes.NewForConfig(config)
    if err != nil {
        log.Fatalf("Failed to create Kubernetes client: %v", err)
    }

    // Define the API endpoint for creating a pod
    router.POST("/create-pod", func(c *gin.Context) {
        var taskReq TaskRequest
        if err := c.ShouldBindJSON(&taskReq); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // Sanitize the task name to follow the Kubernetes naming convention
        sanitizedTaskName := strings.ToLower(strings.ReplaceAll(taskReq.TaskName, " ", "-"))

        // Define the pod specification with labels
        pod := &v1.Pod{
            ObjectMeta: metav1.ObjectMeta{
                Name: sanitizedTaskName, // Ensure the pod name follows RFC 1123
                Labels: map[string]string{
                    "app": sanitizedTaskName, // Ensure labels follow RFC 1123
                },
            },
            Spec: v1.PodSpec{
                Containers: []v1.Container{
                    {
                        Name:  sanitizedTaskName, // Ensure the container name follows RFC 1123
                        Image: taskReq.ImageName,
			Command: []string{
                  	    "jupyter", "notebook", "--ip=0.0.0.0", "--no-browser", "--allow-root",
                        },
                        Ports: []v1.ContainerPort{
                            {
                                ContainerPort: 8888, // TensorFlow or Jupyter usually runs on port 8888
                            },
                        },
                        Resources: v1.ResourceRequirements{
                            Requests: v1.ResourceList{
                                "cpu": resource.MustParse(taskReq.CPUs),
                                "nvidia.com/gpu": resource.MustParse(taskReq.GPUs), // Request GPUs
                            },
                            Limits: v1.ResourceList{
                                "cpu": resource.MustParse(taskReq.CPUs),
                                "nvidia.com/gpu": resource.MustParse(taskReq.GPUs), // Limit GPUs
                            },
                        },
                        VolumeMounts: []v1.VolumeMount{
                            {
                                Name:      "notebook-storage",
                                MountPath: "/workspace", // Mount the notebook directory
                            },
                        },
                    },
                },
                Volumes: []v1.Volume{
                    {
                        Name: "notebook-storage", // Ensure this matches the volumeMounts name
                        VolumeSource: v1.VolumeSource{
                            PersistentVolumeClaim: &v1.PersistentVolumeClaimVolumeSource{
                                ClaimName: "jupyter-pvc", // Ensure this is the correct PVC name
                            },
                        },
                    },
                },
                RestartPolicy: v1.RestartPolicyNever,
            },
        }
        

        // Create the pod in the default namespace
        createdPod, err := clientset.CoreV1().Pods("default").Create(context.TODO(), pod, metav1.CreateOptions{})
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pod", "details": err.Error()})
            return
        }

        // Expose the pod via a service
        service := &v1.Service{
            ObjectMeta: metav1.ObjectMeta{
                Name: sanitizedTaskName + "-service",
            },
            Spec: v1.ServiceSpec{
                Selector: map[string]string{
                    "app": sanitizedTaskName, // Ensure the selector matches the sanitized pod label
                },
                Ports: []v1.ServicePort{
                    {
                        Protocol:   v1.ProtocolTCP,
                        Port:       80,
                        TargetPort: intstr.FromInt(8888), // Forward traffic to the container port 8888
                    },
                },
                Type: v1.ServiceTypeNodePort, // Use NodePort to expose externally
            },
        }

        // Create the service
        createdService, err := clientset.CoreV1().Services("default").Create(context.TODO(), service, metav1.CreateOptions{})
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service", "details": err.Error()})
            return
        }

        // Get the NodePort assigned to the service
        nodePort := createdService.Spec.Ports[0].NodePort

        // Construct the URL (assuming Minikube runs on localhost)
        serviceURL := fmt.Sprintf("http://localhost:%d", nodePort)

        // Return the service URL to the client
        c.JSON(http.StatusOK, gin.H{
            "message":    "Pod and service created successfully",
            "podName":    createdPod.Name,
            "serviceURL": serviceURL,
        })
    })


    // API to get the number of available GPUs
    router.GET("/available-resources", func(c *gin.Context) {
		nodes, err := clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list nodes", "details": err.Error()})
			return
		}

		totalAllocatableGPUs := 0
		totalAllocatableCPUs := 0
		totalUsedGPUs := 0
		totalUsedCPUs := 0

		for _, node := range nodes.Items {
			// Get Allocatable GPUs
			if allocatableGPUs, ok := node.Status.Allocatable["nvidia.com/gpu"]; ok {
				gpus, _ := allocatableGPUs.AsInt64()
				totalAllocatableGPUs += int(gpus)
			}

			// Get Allocatable CPUs
			if allocatableCPUs, ok := node.Status.Allocatable[v1.ResourceCPU]; ok {
				cpus, _ := allocatableCPUs.AsInt64()
				totalAllocatableCPUs += int(cpus)
			}
		}

		// Iterate over the pods to calculate used resources
		pods, err := clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list pods", "details": err.Error()})
			return
		}

		for _, pod := range pods.Items {
			for _, container := range pod.Spec.Containers {
				// Get Used GPUs
				if usedGPUs, ok := container.Resources.Requests["nvidia.com/gpu"]; ok {
					gpus, _ := usedGPUs.AsInt64()
					totalUsedGPUs += int(gpus)
				}

				// Get Used CPUs
				if usedCPUs, ok := container.Resources.Requests[v1.ResourceCPU]; ok {
					cpus, _ := usedCPUs.AsInt64()
					totalUsedCPUs += int(cpus)
				}
			}
		}

		// Calculate free GPUs and CPUs
		freeGPUs := totalAllocatableGPUs - totalUsedGPUs
		freeCPUs := totalAllocatableCPUs - totalUsedCPUs

		// Send response back to frontend
		c.JSON(http.StatusOK, gin.H{
			"freeGPUs":            freeGPUs,
			"totalAllocatableGPUs": totalAllocatableGPUs,
			"totalUsedGPUs":       totalUsedGPUs,
			"freeCPUs":            freeCPUs,
			"totalAllocatableCPUs": totalAllocatableCPUs,
			"totalUsedCPUs":       totalUsedCPUs,
		})
	})
     
    router.POST("/add-resources", func(c *gin.Context) {
    var gpuReq AddResourcesRequest
    if err := c.ShouldBindJSON(&gpuReq); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Fetch the pod by task name
    pod, err := clientset.CoreV1().Pods("default").Get(context.TODO(), gpuReq.TaskName, metav1.GetOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pod", "details": err.Error()})
        return
    }

    // Update the GPU resource limits for the pod's container
    pod.Spec.Containers[0].Resources.Limits["nvidia.com/gpu"] = resource.MustParse(gpuReq.GPUs)
    pod.Spec.Containers[0].Resources.Requests["nvidia.com/gpu"] = resource.MustParse(gpuReq.GPUs)

    // Delete the current pod
    err = clientset.CoreV1().Pods("default").Delete(context.TODO(), gpuReq.TaskName, metav1.DeleteOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pod", "details": err.Error()})
        return
    }

    // Wait for the pod to be deleted
    err = waitForPodDeletion(clientset, "default", gpuReq.TaskName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed waiting for pod deletion", "details": err.Error()})
        return
    }

    // Recreate the pod with the new resource requests
    newPod := &corev1.Pod{
        ObjectMeta: metav1.ObjectMeta{
            Name:      gpuReq.TaskName,
            Namespace: "default",
            Labels:    pod.Labels,
        },
        Spec: pod.Spec,
    }

    createdPod, err := clientset.CoreV1().Pods("default").Create(context.TODO(), newPod, metav1.CreateOptions{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create updated pod", "details": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "GPUs successfully added to the task", "podName": createdPod.Name})
})

    router.DELETE("/delete-task/:taskName", func(c *gin.Context) {
        taskName := c.Param("taskName")
    
        // Delete the deployment (if it exists)
        err := clientset.AppsV1().Deployments("default").Delete(context.TODO(), taskName, metav1.DeleteOptions{})
        if err != nil && !strings.Contains(err.Error(), "not found") {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete deployment", "details": err.Error()})
            return
        }
    
        // Delete the pod (if there's no deployment managing it)
        err = clientset.CoreV1().Pods("default").Delete(context.TODO(), taskName, metav1.DeleteOptions{})
        if err != nil && !strings.Contains(err.Error(), "not found") {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pod", "details": err.Error()})
            return
        }
    
        // Check if the service exists before attempting to delete it
        serviceName := taskName + "-service"
        _, err = clientset.CoreV1().Services("default").Get(context.TODO(), serviceName, metav1.GetOptions{})
        if err != nil && strings.Contains(err.Error(), "not found") {
            c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully, service was not found or already deleted"})
            return
        }
    
        // Delete the associated service
        err = clientset.CoreV1().Services("default").Delete(context.TODO(), serviceName, metav1.DeleteOptions{})
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service", "details": err.Error()})
            return
        }
    
        c.JSON(http.StatusOK, gin.H{"message": "Task and service deleted successfully"})
    })    
    
    
    router.GET("/tasks", func(c *gin.Context) {
        pods, err := clientset.CoreV1().Pods("default").List(context.TODO(), metav1.ListOptions{})
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list pods", "details": err.Error()})
            return
        }
    
        taskNames := []string{}
        for _, pod := range pods.Items {
            taskNames = append(taskNames, pod.Name)
        }
    
        c.JSON(http.StatusOK, gin.H{"tasks": taskNames})
    })
    
    router.POST("/access-jupyter", func(c *gin.Context) {
        var request struct {
            Port        string `json:"port" binding:"required"`
            ServiceName string `json:"serviceName" binding:"required"`
        }

        // Bind JSON input
        if err := c.ShouldBindJSON(&request); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // Convert port from string to int
        port, err := strconv.Atoi(request.Port)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Port must be a valid integer"})
            return
        }

        // Run kubectl port-forward command as a background process
        cmd := exec.Command("kubectl", "port-forward", fmt.Sprintf("svc/%s", request.ServiceName), fmt.Sprintf("%d:80", port), "--address=0.0.0.0")
        err = cmd.Start()
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start port forwarding", "details": err.Error()})
            return
        }

        // Give some time for port-forwarding to start
        time.Sleep(2 * time.Second)

        var token string
        if strings.Contains(request.ServiceName, "jupyter") {
            // Get the pod associated with the Jupyter Notebook service
            pods, err := clientset.CoreV1().Pods("default").List(context.TODO(), metav1.ListOptions{
                LabelSelector: "app=" + strings.TrimSuffix(request.ServiceName, "-service"),
            })
            if err != nil || len(pods.Items) == 0 {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find Jupyter pod", "details": err.Error()})
                return
            }

            // Get the pod logs to extract the Jupyter token
            logStream, err := clientset.CoreV1().Pods("default").GetLogs(pods.Items[0].Name, &v1.PodLogOptions{}).Stream(context.TODO())
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pod logs", "details": err.Error()})
                return
            }
            defer logStream.Close()

            // Read the logs and search for the token
            buf := new(strings.Builder)
            _, err = io.Copy(buf, logStream)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read pod logs", "details": err.Error()})
                return
            }

            token = extractJupyterToken(buf.String())
            if token == "" {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract Jupyter token"})
                return
            }
        }

        // Construct the public URL and return it along with the token if available
        publicIP := "149.36.1.88" // Replace with your public IP or domain
        serviceURL := fmt.Sprintf("http://%s:%d", publicIP, port)

        response := gin.H{"url": serviceURL}
        if token != "" {
            response["token"] = token
        }

        c.JSON(http.StatusOK, response)
    })

    router.GET("/list-tasks", func(c *gin.Context) {
        pods, err := clientset.CoreV1().Pods("default").List(context.TODO(), metav1.ListOptions{})
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list pods", "details": err.Error()})
            return
        }

        tasks := []map[string]interface{}{}

        for _, pod := range pods.Items {
            var gpus string
            var cpus string

            // Extract the requested resources
            if len(pod.Spec.Containers) > 0 {
                cpus = pod.Spec.Containers[0].Resources.Requests.Cpu().String()
                if gpu, ok := pod.Spec.Containers[0].Resources.Requests["nvidia.com/gpu"]; ok {
                    gpus = gpu.String()
                }
            }

            // Find associated service to get the port
            serviceName := pod.Name + "-service"
            service, err := clientset.CoreV1().Services("default").Get(context.TODO(), serviceName, metav1.GetOptions{})
            var nodePort int32
            if err == nil && len(service.Spec.Ports) > 0 {
                nodePort = service.Spec.Ports[0].NodePort
            }

            task := map[string]interface{}{
                "name":       pod.Name,
                "imageName":  pod.Spec.Containers[0].Image,
                "cpus":       cpus,
                "gpus":       gpus,
                "nodePort":   nodePort,
            }
            tasks = append(tasks, task)
        }

        c.JSON(http.StatusOK, gin.H{"tasks": tasks})
    })

    router.Run(":8080")
}

func extractJupyterToken(logs string) string {
    re := regexp.MustCompile(`token=([a-zA-Z0-9]+)`)
    match := re.FindStringSubmatch(logs)
    if len(match) > 1 {
        return match[1]
    }
    return ""
}

func waitForPodDeletion(clientset *kubernetes.Clientset, namespace, name string) error {
    return wait.PollImmediate(time.Second, time.Minute, func() (bool, error) {
        _, err := clientset.CoreV1().Pods(namespace).Get(context.TODO(), name, metav1.GetOptions{})
        if err != nil {
            if errors.IsNotFound(err) {
                return true, nil
            }
            return false, err
        }
        return false, nil
    })
}



func findDeploymentForPod(clientset *kubernetes.Clientset, podName string) (string, error) {
    pod, err := clientset.CoreV1().Pods("default").Get(context.TODO(), podName, metav1.GetOptions{})
    if err != nil {
        return "", fmt.Errorf("failed to get pod: %v", err)
    }

    for _, ownerRef := range pod.OwnerReferences {
        if ownerRef.Kind == "ReplicaSet" {
            rs, err := clientset.AppsV1().ReplicaSets("default").Get(context.TODO(), ownerRef.Name, metav1.GetOptions{})
            if err != nil {
                return "", fmt.Errorf("failed to get ReplicaSet: %v", err)
            }
            for _, rsOwnerRef := range rs.OwnerReferences {
                if rsOwnerRef.Kind == "Deployment" {
                    return rsOwnerRef.Name, nil
                }
            }
        }
    }

    return "", fmt.Errorf("no deployment found for pod %s", podName)
}
