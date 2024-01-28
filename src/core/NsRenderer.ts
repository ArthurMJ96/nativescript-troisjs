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
} from "./Renderer";
import { Screen } from "@nativescript/core/platform";
import { CoreTypes, View } from "@nativescript/core";
import type { Canvas } from "@nativescript/canvas";

export type TCanvas = Canvas;

export type Sizes = {
  width: number;
  height: number;
  unscaled: {
    width: number;
    height: number;
  };
};

export type NsRendererResizeEvent = {
  renderer: RendererInterface;
} & Sizes;

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
    resize: (event: NsRendererResizeEvent) => true,
  },

  setup(props, { emit, expose, slots }) {
    const appReady = ref(false);
    const canvas = shallowRef<TCanvas>(null!);
    const renderer = ref<RendererInterface>(null!);

    const width = ref<CoreTypes.dip>(0);
    const height = ref<CoreTypes.dip>(0);

    const sizes = computed(() => ({
      width: width.value * Screen.mainScreen.scale,
      height: height.value * Screen.mainScreen.scale,
      unscaled: {
        width: width.value,
        height: height.value,
      },
    }));

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

    function updateSize(view: View) {
      const size = view?.getActualSize();
      if (size) {
        width.value = size.width;
        height.value = size.height;
      }
    }

    function onWrapperLoaded({ object }: { object: View }) {
      const layoutChanged = () => updateSize(object);
      updateSize(object);
      object.on(View.layoutChangedEvent, layoutChanged);
      object.on(View.unloadedEvent, () => {
        object.off(View.layoutChangedEvent, layoutChanged);
      });
      nextTick(() => {
        appReady.value = true;
      });
    }

    function onCanvasReady(args: { object: TCanvas }) {
      emit("canvasReady", (canvas.value = args.object));
    }

    expose({
      canvas,
      renderer,
      sizes,
    });
    const canvasComp = resolveComponent("canvas");

    const { resize, onResize, ...rendererProps } = props;

    return () =>
      h("ContentView", { onLoaded: onWrapperLoaded }, [
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
    readonly sizes: Sizes;
  };
}

export default comp as typeof comp & ExposedProps;
