package controllers

import (
	"betting-management/database"
	"betting-management/middleware"
	"betting-management/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DepositRequest struct {
	BookieID    uint    `json:"bookie_id" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description"`
}

type WithdrawRequest struct {
	BookieID    uint    `json:"bookie_id" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description"`
}

func Deposit(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var bookie models.Bookie
	if err := database.DB.Where("id = ? AND user_id = ?", req.BookieID, userID).First(&bookie).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bookie not found"})
		return
	}

	tx := database.DB.Begin()

	balanceBefore := bookie.CurrentBalance
	bookie.CurrentBalance += req.Amount

	if err := tx.Save(&bookie).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update balance"})
		return
	}

	description := req.Description
	if description == "" {
		description = "Deposit"
	}

	transaction := models.BankrollTransaction{
		UserID:        userID,
		BookieID:      req.BookieID,
		Type:          models.TransactionTypeDeposit,
		Amount:        req.Amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  bookie.CurrentBalance,
		Description:   description,
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":     "Deposit successful",
		"transaction": transaction,
		"new_balance": bookie.CurrentBalance,
	})
}

func Withdraw(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var bookie models.Bookie
	if err := database.DB.Where("id = ? AND user_id = ?", req.BookieID, userID).First(&bookie).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bookie not found"})
		return
	}

	if bookie.CurrentBalance < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	tx := database.DB.Begin()

	balanceBefore := bookie.CurrentBalance
	bookie.CurrentBalance -= req.Amount

	if err := tx.Save(&bookie).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update balance"})
		return
	}

	description := req.Description
	if description == "" {
		description = "Withdrawal"
	}

	transaction := models.BankrollTransaction{
		UserID:        userID,
		BookieID:      req.BookieID,
		Type:          models.TransactionTypeWithdraw,
		Amount:        -req.Amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  bookie.CurrentBalance,
		Description:   description,
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":     "Withdrawal successful",
		"transaction": transaction,
		"new_balance": bookie.CurrentBalance,
	})
}

func GetTransactions(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var transactions []models.BankrollTransaction
	query := database.DB.Where("user_id = ?", userID).Preload("Bookie")

	if bookieID := c.Query("bookie_id"); bookieID != "" {
		query = query.Where("bookie_id = ?", bookieID)
	}

	if err := query.Order("created_at DESC").Limit(100).Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}

	c.JSON(http.StatusOK, transactions)
}

func GetBankrollSummary(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var summary struct {
		TotalBalance   float64 `json:"total_balance"`
		TotalDeposited float64 `json:"total_deposited"`
		TotalWithdrawn float64 `json:"total_withdrawn"`
		TotalProfit    float64 `json:"total_profit"`
		ROI            float64 `json:"roi"`
		BookieCount    int64   `json:"bookie_count"`
	}

	// Get total balance across all bookies
	database.DB.Model(&models.Bookie{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(current_balance), 0)").
		Scan(&summary.TotalBalance)

	// Get total deposits
	database.DB.Model(&models.BankrollTransaction{}).
		Where("user_id = ? AND type = ?", userID, models.TransactionTypeDeposit).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.TotalDeposited)

	// Get total withdrawals
	var withdrawnAmount float64
	database.DB.Model(&models.BankrollTransaction{}).
		Where("user_id = ? AND type = ?", userID, models.TransactionTypeWithdraw).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&withdrawnAmount)
	summary.TotalWithdrawn = -withdrawnAmount // Convert to positive

	// Calculate profit
	summary.TotalProfit = summary.TotalBalance + summary.TotalWithdrawn - summary.TotalDeposited

	// Calculate ROI
	if summary.TotalDeposited > 0 {
		summary.ROI = (summary.TotalProfit / summary.TotalDeposited) * 100
	}

	// Get bookie count
	database.DB.Model(&models.Bookie{}).Where("user_id = ?", userID).Count(&summary.BookieCount)

	c.JSON(http.StatusOK, summary)
}
