import { King } from '../database/types';

/**
 * Game logic utilities for KING OF THE CHAT
 */
export class GameLogic {
  /**
   * Calculate win chance based on streak
   * Starts at 50/50, increases by 5% per defense, max 70/30
   */
  static getWinChance(streak: number): number {
    const baseChance = 0.5; // 50%
    const bonusPerStreak = 0.05; // 5% bonus per streak
    const maxChance = 0.7; // 70% max chance

    const chance = baseChance + (streak * bonusPerStreak);
    return Math.min(chance, maxChance);
  }

  /**
   * Simulate attack result
   */
  static simulateAttack(streak: number): {
    success: boolean;
    winChance: number;
    roll: number;
  } {
    const winChance = this.getWinChance(streak);
    const roll = Math.random(); // 0.0 to 1.0

    return {
      success: roll < winChance,
      winChance,
      roll
    };
  }

  /**
   * Format win chance as percentage string
   */
  static formatWinChance(streak: number): string {
    const chance = this.getWinChance(streak);
    const percentage = Math.round(chance * 100);
    return `${percentage}%`;
  }

  /**
   * Get odds string for display
   */
  static getOddsString(streak: number): string {
    const winChance = this.getWinChance(streak);
    const winPercent = Math.round(winChance * 100);
    const losePercent = 100 - winPercent;

    return `${winPercent}/${losePercent}`;
  }

  /**
   * Validate bet amount
   */
  static isValidBet(amount: number): boolean {
    return Number.isInteger(amount) && amount > 0 && amount <= 10000;
  }

  /**
   * Get streak emoji string
   */
  static getStreakEmojis(streak: number): string {
    if (streak === 0) return '';
    return '🔥'.repeat(Math.min(streak, 10)); // Max 10 flames for display
  }

  /**
   * Calculate payout (winner takes double the bet)
   */
  static calculatePayout(betAmount: number): number {
    return betAmount * 2;
  }

  /**
   * Check if user can attack king
   */
  static canAttackKing(king: King, attackerId: number): boolean {
    return king.userId !== attackerId;
  }

  /**
   * Generate game message text
   */
  static generateGameMessage(
    king: King,
    userBalance: number,
    userId: number,
    isCurrentUserKing: boolean = false
  ): string {
    const streakEmojis = this.getStreakEmojis(king.streak);
    const oddsString = this.getOddsString(king.streak);

    const safeUsername = (king.username || king.firstName || 'Unknown');

    let message = `👑 @${safeUsername} – KING OF THE CHAT

RULES:
1. BET /king <amount> to claim throne
2. DUMP to attack the King - ${oddsString} odds
3. Winner doubles up
4. CASHOUT anytime

STREAK BONUS: +5% winrate per defense up to 70/30

Bet: ${king.betAmount} coins | Streak: ${king.streak}${streakEmojis ? ` ${streakEmojis}` : ''}`;

    return message;
  }

  /**
   * Generate no king message
   */
  static generateNoKingMessage(userBalance: number): string {
    return `👑 KING OF THE CHAT

RULES:
1. BET /king <amount> to claim throne
2. DUMP to attack the King - 50/50 odds
3. Winner doubles up
4. CASHOUT anytime

🔥 STREAK BONUS: +5% winrate per defense up to 70/30

No king currently - be the first to claim the throne!
Your balance: ${userBalance} coins`;
  }
}
