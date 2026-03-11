package models

import (
	"time"

	"gorm.io/gorm"
)

type BetStatus string

const (
	BetStatusPending BetStatus = "pending"
	BetStatusWon     BetStatus = "won"
	BetStatusLost    BetStatus = "lost"
	BetStatusVoid    BetStatus = "void"
)

type BetType string

const (
	BetTypeSingle      BetType = "single"
	BetTypeAccumulator BetType = "accumulator"
	BetTypeSystem      BetType = "system"
)

type Bet struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	BookieID     uint           `gorm:"not null;index" json:"bookie_id"`
	Description  string         `gorm:"not null" json:"description"`
	BetType      BetType        `gorm:"default:single" json:"bet_type"`
	Stake        float64        `gorm:"not null" json:"stake"`
	Odds         float64        `gorm:"not null" json:"odds"`
	Status       BetStatus      `gorm:"default:pending" json:"status"`
	PotentialWin float64        `json:"potential_win"` // Calculated: stake * odds
	ActualReturn float64        `gorm:"default:0" json:"actual_return"`
	Profit       float64        `json:"profit"` // Calculated: actual_return - stake
	PlacedAt     time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"placed_at"`
	SettledAt    *time.Time     `json:"settled_at,omitempty"`
	Notes        string         `json:"notes"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Bookie Bookie `gorm:"foreignKey:BookieID" json:"bookie,omitempty"`
}

// BeforeSave hook to calculate potential win
func (b *Bet) BeforeSave(tx *gorm.DB) error {
	b.PotentialWin = b.Stake * b.Odds

	if b.Status == BetStatusWon {
		b.ActualReturn = b.PotentialWin
		b.Profit = b.ActualReturn - b.Stake
	} else if b.Status == BetStatusLost {
		b.ActualReturn = 0
		b.Profit = -b.Stake
	} else if b.Status == BetStatusVoid {
		b.ActualReturn = b.Stake
		b.Profit = 0
	}

	return nil
}
