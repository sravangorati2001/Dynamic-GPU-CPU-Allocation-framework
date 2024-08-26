package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"  // Import the CORS package
    "myapp/api/routes"
)

func main() {
    router := gin.Default()

    // Enable CORS middleware
    router.Use(cors.Default())

    // Load all routes from routes package
    routes.RegisterRoutes(router)

    // Start the server
    router.Run(":8080") // Use port 8080
}

