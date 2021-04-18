import { geometryComponent } from './Geometry'
import { ConeGeometry } from 'three'

export const props = {
  radius: { type: Number, default: 1 },
  height: { type: Number, default: 1 },
  radialSegments: { type: Number, default: 8 },
  heightSegments: { type: Number, default: 1 },
  openEnded: { type: Boolean, default: false },
  thetaStart: { type: Number, default: 0 },
  thetaLength: { type: Number, default: Math.PI * 2 },
}

export function createGeometry(comp: any): ConeGeometry {
  return new ConeGeometry(comp.radius, comp.height, comp.radialSegments, comp.heightSegments, comp.openEnded, comp.thetaStart, comp.thetaLength)
}

export default geometryComponent('ConeGeometry', props, createGeometry)
