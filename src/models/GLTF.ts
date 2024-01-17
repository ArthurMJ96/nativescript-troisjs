import { defineComponent } from "vue";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { knownFolders, path, File } from "@nativescript/core";
import Model from "./Model";

export default defineComponent({
  extends: Model,
  props: {
    dracoPath: { type: String, required: true },
  },
  created() {
    const localPath: string = path.normalize(
      knownFolders.currentApp().path + this.src.replace("~", "")
    );

    const localExists = File.exists(localPath);

    const loader = new GLTFLoader();
    if (this.dracoPath) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        localExists
          ? this.dracoPath
          : path.normalize(
              knownFolders.currentApp().path + this.dracoPath.replace("~", "")
            )
      );
      loader.setDRACOLoader(dracoLoader);
    }

    this.$emit("before-load", loader);

    if (localExists) {
      const file = File.fromPath(localPath);
      file.read().then((contents) => {
        const uint8arr: Uint8Array = new Uint8Array(contents);
        loader.parse(
          uint8arr.buffer,
          file.parent.path,
          (gltf) => {
            this.onLoad(gltf);
            this.initObject3D(gltf.scene);
          },
          this.onError
        );
      });
    } else {
      loader.load(
        this.src,
        (gltf) => {
          this.onLoad(gltf);
          this.initObject3D(gltf.scene);
        },
        this.onProgress,
        this.onError
      );
    }
  },
});
