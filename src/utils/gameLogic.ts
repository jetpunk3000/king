import { King } from '../database/types';

/**
 * Game economy system for KING OF THE CHAT
 * Handles payouts with configurable house edge for fair zero-sum gaming
 */
export class GameEconomy {
  private static houseEdgePercent: number = 0; // Default 0% house edge (zero-sum)

  /**
   * Get current house edge percentage
   */
  static getHouseEdgePercent(): number {
    return this.houseEdgePercent;
  }

  /**
   * Set house edge percentage (admin function)
   * @param percent - House edge as decimal (0.0 to 0.1 for 0% to 10%)
   */
  static setHouseEdgePercent(percent: number): boolean {
    if (percent < 0 || percent > 0.5) { // Max 50% house edge
      return false;
    }
    this.houseEdgePercent = percent;
    console.log(`🏦 House edge updated to ${(percent * 100).toFixed(1)}%`);
    return true;
  }

  /**
   * Calculate payout with house edge deduction
   * @param betAmount - The original bet amount
   * @returns Payout amount after house edge deduction
   */
  static calculatePayout(betAmount: number): number {
    const houseCut = Math.floor(betAmount * this.houseEdgePercent);
    return betAmount - houseCut;
  }

  /**
   * Get house cut amount for display
   * @param betAmount - The original bet amount
   * @returns Amount taken by house
   */
  static getHouseCut(betAmount: number): number {
    return Math.floor(betAmount * this.houseEdgePercent);
  }

  /**
   * Get economy info for admin display
   */
  static getEconomyInfo(): {
    houseEdgePercent: number;
    isZeroSum: boolean;
    description: string;
  } {
    const percent = this.houseEdgePercent;
    const isZeroSum = percent === 0;

    let description = '';
    if (isZeroSum) {
      description = 'Zero-sum game (no house edge)';
    } else {
      description = `${(percent * 100).toFixed(1)}% house edge`;
    }

    return {
      houseEdgePercent: percent,
      isZeroSum,
      description
    };
  }
}

/**
 * Game logic utilities for KING OF THE CHAT
 * @deprecated Use GameEconomy for payout calculations
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
   * Calculate payout (deprecated - use GameEconomy.calculatePayout)
   * @deprecated Use GameEconomy.calculatePayout for proper zero-sum economics
   */
  static calculatePayout(betAmount: number): number {
    // Use new economy system for zero-sum gaming
    return GameEconomy.calculatePayout(betAmount);
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
