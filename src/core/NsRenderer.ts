import { WebGLRendererParameters } from "three";
import {
  ref,
  shallowRef,
  computed,
  nextTick,
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
import { cameraSetProp } from "./Camera";

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
    const canvas = shallowRef<TCanvas>(null!);
    const renderer = ref<RendererInterface>(null!);

    const onCanvasReady = (args: { object: TCanvas }) => {
      canvas.value = args.object;
      emit("canvasReady", args.object);
    };

    const el = ref<ViewRef>(null!);
    const { width, height } = useElementSize(el);
    watch([width, height], ([nvWidth, nvHeight]) => {
      if (props.resize && appReady.value && renderer.value) {
        if (renderer.value?.camera) {
          cameraSetProp(renderer.value.camera, "aspect", nvWidth / nvHeight);
        }
        renderer.value?.renderer?.setSize(nvWidth, nvHeight);
        renderer.value?.renderer?.setPixelRatio(Screen.mainScreen.scale || 1);
        emit("resize", {
          renderer: renderer.value,
          width: nvWidth,
          height: nvHeight,
        });
      }
    });

    const onLoaded = async () => {
      await nextTick();
      appReady.value = true;
    };

    expose({
      canvas,
      renderer,
      sizes: computed(() => ({
        width: width.value,
        height: height.value,
      })),
    });
    const canvasComp = resolveComponent("canvas");

    const { resize, ...rendererProps } = props;

    return () =>
      h("ContentView", { ref: el, onLoaded }, [
        appReady.value && h(canvasComp, { onReady: onCanvasReady }),
        canvas.value &&
          appReady.value &&
          h(
            Renderer,
            {
              ref: renderer,
              ...rendererProps,

              outerCanvas: canvas.value,
              height: String(height.value),
              width: String(width.value),
              onReady: (e: RendererInterface) => emit("rendererReady", e),
              pixelRatio: Screen.mainScreen.scale || 1,
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
