import { WebGLRendererParameters } from "three";
import {
  ref,
  shallowRef,
  computed,
  nextTick,
  defineComponent,
  resolveComponent,
  PropType,
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

export default defineComponent({
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
      type: [Boolean, String] as PropType<boolean | string>,
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
    const sizes = computed(() => {
      const scale = Screen.mainScreen.scale || 1;
      return {
        width: String(width.value * scale),
        height: String(height.value * scale),
      };
    });

    const onLoaded = async () => {
      await nextTick();
      appReady.value = true;
    };

    expose({
      canvas,
      renderer,
    });
    const canvasComp = resolveComponent("canvas");

    return () =>
      h("ContentView", { ref: el, onLoaded }, [
        appReady.value && h(canvasComp, { onReady: onCanvasReady }),
        canvas.value &&
          appReady.value &&
          h(
            Renderer,
            {
              ref: renderer,
              ...props,
              outerCanvas: canvas.value,
              height: sizes.value.height,
              width: sizes.value.width,
              onReady: (e: RendererInterface) => emit("rendererReady", e),
            },
            slots.default || []
          ),
      ]);
  },
});
