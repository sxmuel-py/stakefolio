package routes

import (
	"betting-management/controllers"
	"betting-management/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", controllers.Register)
			auth.POST("/login", controllers.Login)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			protected.GET("/me", controllers.GetMe)

			// Bookie routes
			bookies := protected.Group("/bookies")
			{
				bookies.POST("", controllers.CreateBookie)
				bookies.GET("", controllers.GetBookies)
				bookies.GET("/:id", controllers.GetBookie)
				bookies.PUT("/:id", controllers.UpdateBookie)
				bookies.DELETE("/:id", controllers.DeleteBookie)
			}

			// Bet routes
			bets := protected.Group("/bets")
			{
				bets.POST("", controllers.CreateBet)
				bets.GET("", controllers.GetBets)
				bets.GET("/stats", controllers.GetBetStats)
				bets.GET("/:id", controllers.GetBet)
				bets.PATCH("/:id/status", controllers.UpdateBetStatus)
			}

			// Bankroll routes
			bankroll := protected.Group("/bankroll")
			{
				bankroll.POST("/deposit", controllers.Deposit)
				bankroll.POST("/withdraw", controllers.Withdraw)
				bankroll.GET("/transactions", controllers.GetTransactions)
				bankroll.GET("/summary", controllers.GetBankrollSummary)
			}
		}
	}
}
