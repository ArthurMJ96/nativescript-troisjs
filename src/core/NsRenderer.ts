import { WebGLRendererParameters } from "three";
import {
  ref,
  shallowRef,
  computed,
  nextTick,
  watchEffect,
  defineComponent,
  resolveComponent,
  PropType,
  watch,
  h,
} from "vue";
import { PointerPublicConfigInterface } from "./usePointer";
import Renderer, {
  type RendererInterface,
  type RenderEventInterface,
  type ResizeEventInterface,
} from "./Renderer";
import { Screen } from "@nativescript/core/platform";
import { useElementSize, ViewRef } from "@nativescript-use/vue";
import type { Canvas } from "@nativescript/canvas";

export type TCanvas = Canvas;

const comp = defineComponent({
  props: {
    params: {
      type: Object as PropType<WebGLRendererParameters>,
      default: () => ({}),
    },
    antialias: Boolean,
    alpha: Boolean,
    autoClear: { type: Boolean, default: true },
    orbitCtrl: {
      type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>,
      default: false,
      required: false,
    },
    pointer: {
      type: [Boolean, Object] as PropType<
        boolean | PointerPublicConfigInterface
      >,
      default: false,
    },
    resize: {
      type: Boolean,
      default: false,
    },
    shadow: Boolean,
    width: String,
    height: String,
    pixelRatio: Number,
    xr: Boolean,
    props: { type: Object, default: () => ({}) },

    onMounted: {
      type: Function as PropType<(r: RendererInterface) => void>,
      required: false,
    },
    onBeforeRender: {
      type: Function as PropType<(e: RenderEventInterface) => void>,
      required: false,
    },
    onAfterRender: {
      type: Function as PropType<(e: RenderEventInterface) => void>,
      required: false,
    },
    onResize: {
      type: Function as PropType<(e: ResizeEventInterface) => void>,
      required: false,
    },

    /**
     * A number between 0 and 1 to scale the canvas resolution.
     * This is useful for performance optimization on high resolution screens.
     * @example 0.5 will render the canvas at half the resolution of the original size.
     */
    resolutionScale: {
      type: Number,
      default: 1,
    },
  },

  emits: {
    canvasReady: (canvas: TCanvas) => true,
    rendererReady: (renderer: RendererInterface) => true,
    resize: (event: {
      renderer: RendererInterface;
      width: number;
      height: number;
    }) => true,
  },

  setup(props, { emit, expose, slots }) {
    const appReady = ref(false);
    const wrapper = ref<ViewRef>(null!);
    const canvas = shallowRef<TCanvas>(null!);
    const renderer = ref<RendererInterface>(null!);
    const { width, height } = useElementSize(wrapper);
    const sizes = computed(() => ({
      width: width.value * Screen.mainScreen.scale,
      height: height.value * Screen.mainScreen.scale,
      unscaled: {
        width: width.value,
        height: height.value,
      },
    }));

    function onCanvasReady(args: { object: TCanvas }) {
      canvas.value = args.object;
      emit("canvasReady", args.object);
    }

    function updateScale() {
      const renderScale = Math.min(Math.max(props.resolutionScale, 0), 1);
      const matrixScale = 1 / renderScale;
      if (matrixScale >= 1) {
        canvas.value?.nativeView?.setScaleX(matrixScale);
        canvas.value?.nativeView?.setScaleY(matrixScale);
      }
      const { width, height } = sizes.value;
      renderer.value?.three?.setSize(width * renderScale, height * renderScale);
    }

    // Handle resolutionScale
    watchEffect(updateScale);

    // Handle resize
    watch([width, height], () => {
      if (props.resize && appReady.value && renderer.value) {
        updateScale();
        emit("resize", {
          renderer: renderer.value,
          ...sizes.value,
        });
      }
    });

    function onLoaded() {
      nextTick(() => {
        appReady.value = true;
      });
    }

    expose({
      canvas,
      renderer,
      sizes,
    });
    const canvasComp = resolveComponent("canvas");

    const { resize, ...rendererProps } = props;

    return () =>
      h("ContentView", { ref: wrapper, onLoaded }, [
        appReady.value && h(canvasComp, { onReady: onCanvasReady }),
        canvas.value &&
          appReady.value &&
          h(
            Renderer,
            {
              ref: renderer,
              ...rendererProps,

              outerCanvas: canvas.value,
              height: String(sizes.value.height),
              width: String(sizes.value.width),
              onReady: (e: RendererInterface) => emit("rendererReady", e),
            },
            slots.default || []
          ),
      ]);
  },
});

interface ExposedProps {
  new (): {
    readonly canvas: TCanvas;
    readonly renderer: RendererInterface;
    readonly sizes: {
      width: number;
      height: number;
      unscaled: {
        width: number;
        height: number;
      };
    };
  };
}

export default comp as typeof comp & ExposedProps;
