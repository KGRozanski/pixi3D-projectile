/// <reference path='../global.d.ts' />

import { Application, Assets, Point, Renderer } from "pixi.js"
import { CameraOrbitControl, LightingEnvironment, ImageBasedLighting, Model, Mesh3D, Light, LightType, ShadowCastingLight, ShadowQuality, Camera, Point3D, Transform3D } from "pixi3d/pixi7"

let app = new Application({
  backgroundColor: 0xdddddd, resizeTo: window, antialias: true
})
document.body.appendChild(app.view as HTMLCanvasElement)

const manifest = {
  bundles: [{
    name: "assets",
    assets: [
      {
        name: "diffuse",
        srcs: "assets/chromatic/diffuse.cubemap",
      },
      {
        name: "specular",
        srcs: "assets/chromatic/specular.cubemap",
      },
      {
        name: "teapot",
        srcs: "assets/teapot/teapot.gltf",
      },
      {
        name: "magma",
        srcs: "assets/magma/magma.gltf",
      },
    ],
  }]
}

await Assets.init({ manifest })
let assets = await Assets.loadBundle("assets")

let model = app.stage.addChild(Model.from(assets.magma))
model.scale.set(.01, .01, .01)

model.position.set(0, 0, 0)

let ground = app.stage.addChild(Mesh3D.createPlane())
ground.scale.set(100, 100, 100)


let range = document.getElementById("range");
let fireBtn = document.getElementById('fire');

const V0 = 18; // Projection Velocity (in m/s)
const angle = 0.570796327 // in rad;
let t = 0; // in milliseconds
let fired = false; // if ball has been projected
const timeOfFlight = 2 * Math.sin(angle) * V0 / 9.81; // full time of flight
let timeOfBlast: number;

range?.addEventListener('input' , (e: any) => {
  model.position.set(e.target.value, calculateTrajectoryY(e.target.value), 0);
})

fireBtn?.addEventListener('click', () => fire())


function calculateTrajectoryY(x: number): number {
  return x * (V0 * Math.sin(angle) /  V0 * Math.cos(angle)) - 9.81 * 1/2  * Math.pow(x / V0 * Math.cos(angle), 2);
}

function moveProjectile() {
  const x = V0 * Math.cos(angle) * t / 1000;
  const y = V0 * Math.sin(angle) * t / 1000 - 1/2 * 9.81 * Math.pow((t / 1000), 2);

  model.position.set(x, y, 0);
}

function fire() {
  fired = true;
  timeOfBlast = Date.now();
}


let ticker = (delta: number) => {



  if (fired) {
    if (Date.now() - timeOfBlast < timeOfFlight * 1000) {
      t = Date.now() - timeOfBlast;
      moveProjectile()
    } else {
      fired = false;
    }
  }
};

app.ticker.add(ticker);


LightingEnvironment.main.imageBasedLighting = new ImageBasedLighting(
  assets.diffuse,
  assets.specular
)

let directionalLight = new Light()
directionalLight.intensity = 1
directionalLight.type = LightType.directional
directionalLight.rotationQuaternion.setEulerAngles(25, 120, 0)
LightingEnvironment.main.lights.push(directionalLight)

let shadowCastingLight = new ShadowCastingLight(
  app.renderer as Renderer, directionalLight, { shadowTextureSize: 1024, quality: ShadowQuality.high })
shadowCastingLight.softness = 1
shadowCastingLight.shadowArea = 15

let pipeline = app.renderer.plugins.pipeline
pipeline.enableShadows(ground, shadowCastingLight)
pipeline.enableShadows(model, shadowCastingLight)

let control = new CameraOrbitControl(app.view as HTMLCanvasElement);
control.angles.x = 35.264;
control.angles.y = 35.264;
control.distance = 65;

