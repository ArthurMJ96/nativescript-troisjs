import { ref, unref, watch } from "nativescript-vue";
import type { Ref } from "nativescript-vue";
import type { RenderEventInterface } from "../core";

/**
 * Wraps a loop function so it can be executed at a specific frame-rate
 * @param func The function to be executed at a specific frame-rate
 * @param fpsLimit The target fps-cap to be used. Use a ref() to change at runtime. (Default: 60)
 * @param calculateFps Whether to calculate the current FPS (Default: false)
 */
export function useGameLoop(
  func: (renderEvent: RenderEventInterface, delta: number) => void,
  fpsLimit: number | Ref<number> = 60,
  calculateFps = false
) {
  let targetFps = 0,
    fpsInterval = 0;
  let lastTime = 0,
    lastOverTime = 0,
    prevOverTime = 0,
    delta = 0;
  let fpsTime = 0,
    frames = 0;

  const fps = ref(0);

  function updateFps(value: number) {
    targetFps = value;
    fpsInterval = 1000 / targetFps;
  }

  updateFps(unref(fpsLimit));
  if (typeof fpsLimit === "object") {
    watch(fpsLimit, updateFps);
  }

  return {
    /**
     * Ref to the calculated FPS.
     * Only updated if `calculateFps = true`
     */
    fps,

    /**
     * The frame-capped loop function.
     * @param re The render event returned by the `onBeforeRender` event.
     */
    loop(re: RenderEventInterface) {
      delta = re.time - lastTime;

      if (delta >= fpsInterval) {
        const time = re.time;
        prevOverTime = lastOverTime;
        lastOverTime = delta % fpsInterval;
        lastTime = time - lastOverTime;

        // keep time elapsed in sync with real life
        delta -= prevOverTime;

        // "normalize" the delta time (so 1 equals to 1 second)
        delta *= 0.001;

        if (calculateFps) {
          frames++;
          if (time >= fpsTime + 1000) {
            fps.value =
              Math.round(((frames * 1000) / (time - fpsTime)) * 100) / 100;
            frames = 0;
            fpsTime = time;
          }
        }

        func(re, delta);
      }
    },
  };
}
