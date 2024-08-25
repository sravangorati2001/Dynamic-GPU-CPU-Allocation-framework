package routes

import (
    "github.com/gin-gonic/gin"
    "myapp/api/controllers"
)

func RegisterRoutes(router *gin.Engine) {
    router.GET("/api/hello", controllers.Hello)
}

