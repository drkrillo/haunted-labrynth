import { engine, Entity, Transform, AvatarShape } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { EnemyComponent, EnemyTag } from '../components/enemy'

export interface EnemySpawnData {
  position: Vector3
  speed?: number
  glbModel?: string
}

export class EnemySystem {
  private enemies: Entity[] = []
  private walls: Entity[] = []
  private sceneBounds = { minX: 2.5, maxX: 157.5, minZ: 2.5, maxZ: 157.5 } // For 160x160m scene with 5x5m cells

  createEnemies(enemySpawns: EnemySpawnData[]): Entity[] {
    this.clearEnemies()
    
    const enemies: Entity[] = []
    
    enemySpawns.forEach((spawnData, index) => {
      const enemy = engine.addEntity()
      
      // Set up transform
      Transform.create(enemy, {
        position: Vector3.create(
          spawnData.position.x,
          spawnData.position.y,
          spawnData.position.z
        ),
        scale: Vector3.create(1.0, 1.0, 1.0) // Normal avatar size
      })
      
      // Create avatar shape for enemy with better configuration
      AvatarShape.create(enemy, {
        id: `enemy-${index}`,
        name: `Enemy ${index + 1}`,
        bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
        wearables: [
          'urn:decentraland:off-chain:base-avatars:red_tshirt',
          'urn:decentraland:off-chain:base-avatars:red_sneakers',
          'urn:decentraland:off-chain:base-avatars:black_jeans',
          'urn:decentraland:off-chain:base-avatars:red_cap'
        ],
        emotes: [],
        expressionTriggerId: 'Idle',
        expressionTriggerTimestamp: 0
      })
      
      // Add enemy tag
      EnemyTag.create(enemy)
      
      // Set up enemy component with movement data
      const speed = spawnData.speed || 2.0
      const direction = Vector3.create(
        Math.random() - 0.5, // Random direction between -0.5 and 0.5
        0,
        Math.random() - 0.5
      )
      
      EnemyComponent.create(enemy, {
        position: Vector3.create(spawnData.position.x, spawnData.position.y, spawnData.position.z),
        speed: speed,
        direction: Vector3.normalize(direction),
        lastPosition: Vector3.create(spawnData.position.x, spawnData.position.y, spawnData.position.z),
        glbModel: spawnData.glbModel || ""
      })
      
      enemies.push(enemy)
    })
    
    this.enemies = enemies
    return enemies
  }
  
  setWalls(walls: Entity[]): void {
    this.walls = walls
  }
  
  updateEnemies(deltaTime: number): void {
    this.enemies.forEach(enemy => {
      const enemyData = EnemyComponent.getOrNull(enemy)
      if (!enemyData) return
      
      const transform = Transform.getMutable(enemy)
      const mutableEnemyData = EnemyComponent.getMutable(enemy)
      
      // Store last position
      mutableEnemyData.lastPosition = Vector3.create(
        transform.position.x,
        transform.position.y,
        transform.position.z
      )
      
      // Calculate new position with smoother movement
      const movement = Vector3.scale(mutableEnemyData.direction, enemyData.speed * deltaTime)
      let newPosition = Vector3.add(transform.position, movement)
      
      // Check wall collisions with proper AABB collision detection
      let canMove = true
      for (const wall of this.walls) {
        const wallTransform = Transform.getOrNull(wall)
        if (wallTransform) {
          // AABB collision detection
          const enemyRadius = 0.8 // Avatar collision radius
          const wallHalfSizeX = wallTransform.scale.x / 2
          const wallHalfSizeZ = wallTransform.scale.z / 2
          
          const enemyMinX = newPosition.x - enemyRadius
          const enemyMaxX = newPosition.x + enemyRadius
          const enemyMinZ = newPosition.z - enemyRadius
          const enemyMaxZ = newPosition.z + enemyRadius
          
          const wallMinX = wallTransform.position.x - wallHalfSizeX
          const wallMaxX = wallTransform.position.x + wallHalfSizeX
          const wallMinZ = wallTransform.position.z - wallHalfSizeZ
          const wallMaxZ = wallTransform.position.z + wallHalfSizeZ
          
          if (
            enemyMaxX > wallMinX &&
            enemyMinX < wallMaxX &&
            enemyMaxZ > wallMinZ &&
            enemyMinZ < wallMaxZ
          ) {
            canMove = false
            break
          }
        }
      }
      
      // Check scene boundaries (for 160x160m scene with 5x5m cells)
      if (newPosition.x < this.sceneBounds.minX || newPosition.x > this.sceneBounds.maxX || 
          newPosition.z < this.sceneBounds.minZ || newPosition.z > this.sceneBounds.maxZ) {
        canMove = false
      }
      
      if (canMove) {
        // Move enemy smoothly
        transform.position = newPosition
        mutableEnemyData.position = newPosition
      } else {
        // Change direction when hitting wall or boundary with smoother direction changes
        const currentDirection = mutableEnemyData.direction
        
        // Try to find a new direction that doesn't immediately hit a wall
        let attempts = 0
        let newDirection: Vector3
        do {
          newDirection = Vector3.create(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
          )
          newDirection = Vector3.normalize(newDirection)
          attempts++
        } while (attempts < 10 && Vector3.dot(currentDirection, newDirection) > 0.5)
        
        mutableEnemyData.direction = newDirection
        
        // Occasionally change direction even when not hitting walls for more natural movement
        if (Math.random() < 0.01) { // 1% chance per frame
          const randomDirection = Vector3.create(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
          )
          mutableEnemyData.direction = Vector3.normalize(randomDirection)
        }
      }
    })
  }
  
  getEnemies(): Entity[] {
    return this.enemies
  }
  
  checkPlayerCollision(playerPosition: Vector3): boolean {
    for (const enemy of this.enemies) {
      const enemyTransform = Transform.getOrNull(enemy)
      if (enemyTransform) {
        const distance = Vector3.distance(playerPosition, enemyTransform.position)
        // More accurate collision detection - avatar collision radius
        if (distance < 2.5) { // Slightly larger than avatar radius for better gameplay
          return true
        }
      }
    }
    return false
  }
  
  clearEnemies(): void {
    this.enemies.forEach(enemy => {
      engine.removeEntity(enemy)
    })
    this.enemies = []
  }
}