
[![NPM Package][npm]][npm-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]

[npm]: https://img.shields.io/npm/v/nativescript-troisjs
[npm-url]: https://www.npmjs.com/package/nativescript-troisjs
[npm-downloads]: https://img.shields.io/npm/dw/nativescript-troisjs
[npmtrends-url]: https://www.npmtrends.com/nativescript-troisjs

# ✨ TroisJS + NativeScript-Vue3 ⚡

I wanted something similar to *react-three-fiber* but for Nativescript + VueJS.

So I found TroisJS and adapted it.

+ Changed Renderer Component to allow passing in custom Canvas instance.
+ Added `<NsRenderer>` Component to 
   + properly wait for the Canvas to be loaded
   + pass loaded canvas into Renderer
   + apply width, height & scaling via wrapper ContentView
   + add resolution-scale prop to optionally lower the rendered resolution for higher FPS (Ex: for Android TV)
   + adapt resize prop to work on orientation change

+ Changed Renderer's onMounted, onBeforeRender, onAfterRender & onResize callbacks to be register directly as props
    > Ex: <NsRenderer @before-render="fn" />
+ Added `useGameLoop` composable.
+ & more.

## Usage (NativeScript-Vue3)

### Install

```bash
npm i three @nativescript/canvas @nativescript/canvas-polyfill nativescript-troisjs
```

#### Register canvas element & apply polyfill

```js
// app.ts|js

import '@nativescript/canvas-polyfill'
registerElement('canvas', () => require('@nativescript/canvas').Canvas)

// ...

```


#### Example usage

Simply use `<NsRenderer>` instead of `<Renderer>`.

```html
<script lang="ts" setup>
import { ref } from 'nativescript-vue'
import chroma from 'chroma-js'
import {
  Camera,
  ToonMaterial,
  AmbientLight,
  PointLight,
  Torus,
  Scene,
  NsRenderer,
  useGameLoop,
} from 'nativescript-troisjs'

const n = ref(30)
const cscale = chroma.scale(['#dd3e1b', '#0b509c'])
const color = (i: number) => cscale(i / n.value).css()
const meshRefs = ref<(typeof Torus)[]>([])

// useGameLoop is a optional helper to create a game loop with a fixed frame rate.
const { loop, fps } = useGameLoop(
  function ({ time }, delta) {
    // Example from: https://troisjs.github.io/examples/loop.html
    let mesh, ti
    for (let i = 1; i <= n.value; i++) {
      mesh = meshRefs.value?.[i]?.mesh
      if (mesh) {
        ti = time - i * 500
        mesh.rotation.x = ti * 0.00015
        mesh.rotation.y = ti * 0.0002
        mesh.rotation.z = ti * 0.00017
      }
    }
  },
  144,
  true
)
</script>

<template>
  <GridLayout rows="*, auto" class="bg-base-200">
    <NsRenderer row="0" rowSpan="2" @before-render="loop" alpha orbit-ctrl>
      <Camera :position="{ z: 15 }" />
      <Scene>
        <AmbientLight color="#808080" />
        <PointLight color="#ffffff" :position="{ y: 50, z: 0 }" />
        <PointLight color="#ffffff" :position="{ y: -50, z: 0 }" />
        <PointLight color="#ffffff" :position="{ y: 0, z: 0 }" />
        <Torus
          v-for="i in n"
          :key="i"
          ref="meshRefs"
          :radius="i * 0.2"
          :tube="0.1"
          :radial-segments="8"
          :tubular-segments="(i + 2) * 4"
        >
          <ToonMaterial :color="color(i)" />
        </Torus>
      </Scene>
    </NsRenderer>

    <Label row="1" :text="`FPS: ${fps}`" class="text-center" />
  </GridLayout>
</template>

```
<hr>
Read more on https://troisjs.github.io/guide/

- 💻 Examples (wip) : https://troisjs.github.io/ ([sources](https://github.com/troisjs/troisjs.github.io/tree/master/src/components))
- 📖 Doc (wip) : https://troisjs.github.io/guide/ ([repo](https://github.com/troisjs/troisjs.github.io))
- 🚀 Codepen examples : https://codepen.io/collection/AxoWoz

<p style="text-align:center;">
  <a href="https://troisjs-flower.pages.dev"><img src="/screenshots/troisjs_15.jpg" width="24%" /></a>
  <a href="https://troisjs-water.pages.dev"><img src="/screenshots/troisjs_14.jpg" width="24%" /></a>
  <a href="https://troisjs-dof-test.pages.dev"><img src="/screenshots/troisjs_13.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/little-planet/"><img src="/screenshots/little-planet.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/examples/physics/1.html"><img src="/screenshots/troisjs_10.jpg" width="24%" /></a>
  <a href="https://troisjs-trails.pages.dev"><img src="/screenshots/troisjs_12.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/examples/demos/2.html"><img src="/screenshots/troisjs_5.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/examples/materials/2.html"><img src="/screenshots/troisjs_2.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/examples/loop.html"><img src="/screenshots/troisjs_6.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/examples/shadows.html"><img src="/screenshots/troisjs_7.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/examples/demos/5.html"><img src="/screenshots/troisjs_8.jpg" width="24%" /></a>
  <a href="https://troisjs.github.io/examples/lights.html"><img src="/screenshots/troisjs_9.jpg" width="24%" /></a>
</p>


## Issues

If you encounter any issues, please open a new issue with as much detail as possible. This is **beta** software, so there might be bugs.

- [Join Discord](https://nativescript.org/discord)
