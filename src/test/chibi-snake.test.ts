import { expect, it } from "vitest";
import { ChibiSnake } from "@/lib/chibi-snake";

class InspectSnake extends ChibiSnake<object> {
  get length() { return this.snake.length; }
  feedAhead() { this.grid.clear(this.food); this.food = { x: this.head.x + 1, y: this.head.y }; }
  step() { this.update(); }
}

it("collecting an Andrey grows the snake by one Andrey", () => {
  const game = new InspectSnake({ width: 16, height: 16, tickRate: 6, continuousSpace: false, scoreConfig: { foodMultiplier: 1, movementMultiplier: 0, useSnakeLength: false } },
    { cellSize: 1, snakeRenderer: () => ({}), foodRenderer: () => ({}), clearRenderer: () => {} }, () => {});
  expect(game.length).toBe(3);
  game.feedAhead(); game.step(); game.step();
  expect(game.length).toBe(4);
});