package models

import (
	"time"
)

type TransactionType string

const (
	TransactionTypeDeposit  TransactionType = "deposit"
	TransactionTypeWithdraw TransactionType = "withdraw"
	TransactionTypeTransfer TransactionType = "transfer"
	TransactionTypeBetWin   TransactionType = "bet_win"
	TransactionTypeBetLoss  TransactionType = "bet_loss"
)

type BankrollTransaction struct {
	ID            uint            `gorm:"primaryKey" json:"id"`
	UserID        uint            `gorm:"not null;index" json:"user_id"`
	BookieID      uint            `gorm:"index" json:"bookie_id,omitempty"`
	Type          TransactionType `gorm:"not null" json:"type"`
	Amount        float64         `gorm:"not null" json:"amount"`
	BalanceBefore float64         `json:"balance_before"`
	BalanceAfter  float64         `json:"balance_after"`
	Description   string          `json:"description"`
	RelatedBetID  *uint           `json:"related_bet_id,omitempty"`
	CreatedAt     time.Time       `json:"created_at"`

	Bookie *Bookie `gorm:"foreignKey:BookieID" json:"bookie,omitempty"`
}
