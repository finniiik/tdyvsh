import { Snake, type GameConfig, type RenderConfig } from "snake-game-engine";

/** Use the established engine, with a safe centered start and full-board finish. */
export class ChibiSnake<T> extends Snake<T> {
  constructor(config: GameConfig, render: RenderConfig<T>, finish: () => void) {
    super(config, render, finish);
    for (const p of this.snake) { render.clearRenderer(this.grid.get(p)); this.grid.clear(p); }
    render.clearRenderer(this.lastFoodRendered);
    this.grid.clear(this.food);
    const x = Math.floor(config.width / 2), y = Math.floor(config.height / 2);
    this.snake = [{ x, y }, { x: x - 1, y }, { x: x - 2, y }];
    for (const p of this.snake) this.grid.set(p, render.snakeRenderer(p));
    this.lastFoodRendered = this.spawnFood();
  }

  protected override spawnFood(): T {
    if (this.grid.positionsEmpty.length === 0) {
      this.stop();
      this.onGameOver();
      return this.renderConfig.foodRenderer({ x: -1, y: -1 });
    }
    return super.spawnFood();
  }
}