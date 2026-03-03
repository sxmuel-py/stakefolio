package controllers

import (
	"betting-management/database"
	"betting-management/middleware"
	"betting-management/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateBetRequest struct {
	BookieID    uint           `json:"bookie_id" binding:"required"`
	Description string         `json:"description" binding:"required"`
	BetType     models.BetType `json:"bet_type"`
	Stake       float64        `json:"stake" binding:"required,gt=0"`
	Odds        float64        `json:"odds" binding:"required,gt=1"`
	Notes       string         `json:"notes"`
}

type UpdateBetStatusRequest struct {
	Status models.BetStatus `json:"status" binding:"required"`
}

func CreateBet(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req CreateBetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify bookie belongs to user
	var bookie models.Bookie
	if err := database.DB.Where("id = ? AND user_id = ?", req.BookieID, userID).First(&bookie).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bookie not found"})
		return
	}

	// Check if user has sufficient balance
	if bookie.CurrentBalance < req.Stake {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	bet := models.Bet{
		UserID:      userID,
		BookieID:    req.BookieID,
		Description: req.Description,
		BetType:     req.BetType,
		Stake:       req.Stake,
		Odds:        req.Odds,
		Status:      models.BetStatusPending,
		Notes:       req.Notes,
		PlacedAt:    time.Now(),
	}

	if bet.BetType == "" {
		bet.BetType = models.BetTypeSingle
	}

	// Start transaction
	tx := database.DB.Begin()

	if err := tx.Create(&bet).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bet"})
		return
	}

	// Update bookie balance
	bookie.CurrentBalance -= req.Stake
	if err := tx.Save(&bookie).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update balance"})
		return
	}

	// Create transaction record
	transaction := models.BankrollTransaction{
		UserID:        userID,
		BookieID:      req.BookieID,
		Type:          models.TransactionTypeBetLoss,
		Amount:        -req.Stake,
		BalanceBefore: bookie.CurrentBalance + req.Stake,
		BalanceAfter:  bookie.CurrentBalance,
		Description:   "Bet placed: " + req.Description,
		RelatedBetID:  &bet.ID,
	}
	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	tx.Commit()

	// Load bookie relation
	database.DB.Preload("Bookie").First(&bet, bet.ID)

	c.JSON(http.StatusCreated, bet)
}

func GetBets(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var bets []models.Bet
	query := database.DB.Where("user_id = ?", userID).Preload("Bookie")

	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by bookie
	if bookieID := c.Query("bookie_id"); bookieID != "" {
		query = query.Where("bookie_id = ?", bookieID)
	}

	if err := query.Order("placed_at DESC").Find(&bets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bets"})
		return
	}

	c.JSON(http.StatusOK, bets)
}

func GetBet(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	betID := c.Param("id")

	var bet models.Bet
	if err := database.DB.Where("id = ? AND user_id = ?", betID, userID).Preload("Bookie").First(&bet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bet not found"})
		return
	}

	c.JSON(http.StatusOK, bet)
}

func UpdateBetStatus(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	betID := c.Param("id")

	var bet models.Bet
	if err := database.DB.Where("id = ? AND user_id = ?", betID, userID).First(&bet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bet not found"})
		return
	}

	var req UpdateBetStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Can't update already settled bets
	if bet.Status != models.BetStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bet already settled"})
		return
	}

	tx := database.DB.Begin()

	// Update bet status
	bet.Status = req.Status
	now := time.Now()
	bet.SettledAt = &now

	if err := tx.Save(&bet).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bet"})
		return
	}

	// Update bookie balance if won or void
	var bookie models.Bookie
	tx.First(&bookie, bet.BookieID)

	if req.Status == models.BetStatusWon {
		bookie.CurrentBalance += bet.ActualReturn

		transaction := models.BankrollTransaction{
			UserID:        userID,
			BookieID:      bet.BookieID,
			Type:          models.TransactionTypeBetWin,
			Amount:        bet.ActualReturn,
			BalanceBefore: bookie.CurrentBalance - bet.ActualReturn,
			BalanceAfter:  bookie.CurrentBalance,
			Description:   "Bet won: " + bet.Description,
			RelatedBetID:  &bet.ID,
		}
		tx.Create(&transaction)
	} else if req.Status == models.BetStatusVoid {
		bookie.CurrentBalance += bet.Stake

		transaction := models.BankrollTransaction{
			UserID:        userID,
			BookieID:      bet.BookieID,
			Type:          models.TransactionTypeDeposit,
			Amount:        bet.Stake,
			BalanceBefore: bookie.CurrentBalance - bet.Stake,
			BalanceAfter:  bookie.CurrentBalance,
			Description:   "Bet voided: " + bet.Description,
			RelatedBetID:  &bet.ID,
		}
		tx.Create(&transaction)
	}

	if err := tx.Save(&bookie).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update balance"})
		return
	}

	tx.Commit()

	// Reload with relations
	database.DB.Preload("Bookie").First(&bet, bet.ID)

	c.JSON(http.StatusOK, bet)
}

func GetBetStats(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var stats struct {
		TotalBets    int64   `json:"total_bets"`
		PendingBets  int64   `json:"pending_bets"`
		WonBets      int64   `json:"won_bets"`
		LostBets     int64   `json:"lost_bets"`
		TotalStaked  float64 `json:"total_staked"`
		TotalReturns float64 `json:"total_returns"`
		TotalProfit  float64 `json:"total_profit"`
		WinRate      float64 `json:"win_rate"`
		ROI          float64 `json:"roi"`
	}

	database.DB.Model(&models.Bet{}).Where("user_id = ?", userID).Count(&stats.TotalBets)
	database.DB.Model(&models.Bet{}).Where("user_id = ? AND status = ?", userID, models.BetStatusPending).Count(&stats.PendingBets)
	database.DB.Model(&models.Bet{}).Where("user_id = ? AND status = ?", userID, models.BetStatusWon).Count(&stats.WonBets)
	database.DB.Model(&models.Bet{}).Where("user_id = ? AND status = ?", userID, models.BetStatusLost).Count(&stats.LostBets)

	database.DB.Model(&models.Bet{}).Where("user_id = ?", userID).Select("COALESCE(SUM(stake), 0)").Scan(&stats.TotalStaked)
	database.DB.Model(&models.Bet{}).Where("user_id = ?", userID).Select("COALESCE(SUM(actual_return), 0)").Scan(&stats.TotalReturns)
	database.DB.Model(&models.Bet{}).Where("user_id = ?", userID).Select("COALESCE(SUM(profit), 0)").Scan(&stats.TotalProfit)

	settledBets := stats.WonBets + stats.LostBets
	if settledBets > 0 {
		stats.WinRate = (float64(stats.WonBets) / float64(settledBets)) * 100
	}

	if stats.TotalStaked > 0 {
		stats.ROI = (stats.TotalProfit / stats.TotalStaked) * 100
	}

	c.JSON(http.StatusOK, stats)
}
