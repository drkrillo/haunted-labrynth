import { engine, Schemas } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

export interface EnemyData {
  position: Vector3
  speed: number
  direction: Vector3
  lastPosition: Vector3
  glbModel?: string // For future GLB model support
}

export const EnemyComponent = engine.defineComponent('EnemyComponent', {
  position: Schemas.Vector3,
  speed: Schemas.Number,
  direction: Schemas.Vector3,
  lastPosition: Schemas.Vector3,
  glbModel: Schemas.String
})

export const EnemyTag = engine.defineComponent('EnemyTag', {})
