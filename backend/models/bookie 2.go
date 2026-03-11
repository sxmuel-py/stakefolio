package models

import (
	"time"

	"gorm.io/gorm"
)

type Bookie struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	UserID         uint           `gorm:"not null;index" json:"user_id"`
	Name           string         `gorm:"not null" json:"name"`
	Website        string         `json:"website"`
	CurrentBalance float64        `gorm:"default:0" json:"current_balance"`
	InitialDeposit float64        `gorm:"default:0" json:"initial_deposit"`
	Color          string         `gorm:"default:#3B82F6" json:"color"` // For UI customization
	Notes          string         `json:"notes"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	Bets                 []Bet                 `gorm:"foreignKey:BookieID" json:"bets,omitempty"`
	BankrollTransactions []BankrollTransaction `gorm:"foreignKey:BookieID" json:"transactions,omitempty"`
}
