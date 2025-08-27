import * as fs from 'fs';
import * as path from 'path';

/**
 * Image handling utilities
 */
export class ImageUtils {
  private static readonly IMAGE_PATH = './assets/images/king.jpg';

  /**
   * Check if king image exists
   */
  static imageExists(): boolean {
    try {
      return fs.existsSync(this.IMAGE_PATH);
    } catch (error) {
      console.error('Error checking image existence:', error);
      return false;
    }
  }

  /**
   * Get absolute path to king image
   */
  static getImagePath(): string {
    return path.resolve(this.IMAGE_PATH);
  }

  /**
   * Create assets/images directory if it doesn't exist
   */
  static ensureImageDirectory(): void {
    const dir = path.dirname(this.IMAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Validate image file (basic check)
   */
  static isValidImage(): boolean {
    if (!this.imageExists()) return false;

    try {
      const stats = fs.statSync(this.IMAGE_PATH);
      // Basic validation: file exists and has some size
      return stats.size > 0;
    } catch (error) {
      console.error('Error validating image:', error);
      return false;
    }
  }
}
