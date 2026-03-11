package controllers

import (
	"betting-management/database"
	"betting-management/middleware"
	"betting-management/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreateBookieRequest struct {
	Name           string  `json:"name" binding:"required"`
	Website        string  `json:"website"`
	InitialDeposit float64 `json:"initial_deposit"`
	Color          string  `json:"color"`
	Notes          string  `json:"notes"`
}

type UpdateBookieRequest struct {
	Name    string `json:"name"`
	Website string `json:"website"`
	Color   string `json:"color"`
	Notes   string `json:"notes"`
}

func CreateBookie(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req CreateBookieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	bookie := models.Bookie{
		UserID:         userID,
		Name:           req.Name,
		Website:        req.Website,
		CurrentBalance: req.InitialDeposit,
		InitialDeposit: req.InitialDeposit,
		Color:          req.Color,
		Notes:          req.Notes,
	}

	if bookie.Color == "" {
		bookie.Color = "#3B82F6"
	}

	if err := database.DB.Create(&bookie).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bookie"})
		return
	}

	// Create initial deposit transaction if amount > 0
	if req.InitialDeposit > 0 {
		transaction := models.BankrollTransaction{
			UserID:        userID,
			BookieID:      bookie.ID,
			Type:          models.TransactionTypeDeposit,
			Amount:        req.InitialDeposit,
			BalanceBefore: 0,
			BalanceAfter:  req.InitialDeposit,
			Description:   "Initial deposit",
		}
		database.DB.Create(&transaction)
	}

	c.JSON(http.StatusCreated, bookie)
}

func GetBookies(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var bookies []models.Bookie
	if err := database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&bookies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookies"})
		return
	}

	c.JSON(http.StatusOK, bookies)
}

func GetBookie(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	bookieID := c.Param("id")

	var bookie models.Bookie
	if err := database.DB.Where("id = ? AND user_id = ?", bookieID, userID).First(&bookie).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bookie not found"})
		return
	}

	c.JSON(http.StatusOK, bookie)
}

func UpdateBookie(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	bookieID := c.Param("id")

	var bookie models.Bookie
	if err := database.DB.Where("id = ? AND user_id = ?", bookieID, userID).First(&bookie).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bookie not found"})
		return
	}

	var req UpdateBookieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		bookie.Name = req.Name
	}
	if req.Website != "" {
		bookie.Website = req.Website
	}
	if req.Color != "" {
		bookie.Color = req.Color
	}
	bookie.Notes = req.Notes

	if err := database.DB.Save(&bookie).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bookie"})
		return
	}

	c.JSON(http.StatusOK, bookie)
}

func DeleteBookie(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	bookieID := c.Param("id")

	var bookie models.Bookie
	if err := database.DB.Where("id = ? AND user_id = ?", bookieID, userID).First(&bookie).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bookie not found"})
		return
	}

	if err := database.DB.Delete(&bookie).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete bookie"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bookie deleted successfully"})
}
