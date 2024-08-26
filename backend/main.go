package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "strings"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "k8s.io/client-go/kubernetes"
    "k8s.io/client-go/tools/clientcmd"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

func main() {
    router := gin.Default()
    router.Use(cors.Default())
    // Build the Kubernetes config from the Minikube kubeconfig file
    config, err := clientcmd.BuildConfigFromFlags("", "/home/sravan/.kube/config")
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
                    },
                },
                RestartPolicy: v1.RestartPolicyAlways,
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
