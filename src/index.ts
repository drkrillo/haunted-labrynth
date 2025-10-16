import { engine, Entity, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'

// Import systems
import { TeleportMazeSystem } from './systems/simpleMazeSystem'
import { EnemySystem, EnemySpawnData } from './systems/enemySystem'

// Game state
let lastPlayerPosition = Vector3.create(0, 0, 0)
let teleportCooldown = 0
let respawnCooldown = 0
const TELEPORT_COOLDOWN_TIME = 3 // 3 seconds cooldown
const RESPAWN_COOLDOWN_TIME = 2 // 2 seconds respawn cooldown

// Initialize systems
const mazeSystem = new TeleportMazeSystem()
const enemySystem = new EnemySystem()

export function main() {
  // Create the maze
  const maze = mazeSystem.createMaze()
  
  // Set up enemies with wall collision data
  enemySystem.setWalls(maze.walls)
  
  // Define enemy spawn positions (avoiding walls and teleports, scaled for 160x160m scene)
  // Positions based on open spaces in the new maze layout with 5x5m cells
  const enemySpawns: EnemySpawnData[] = [
    { position: Vector3.create(10, 0, 10), speed: 2.5 },   // Open area in upper left
    { position: Vector3.create(140, 0, 140), speed: 2.0 }, // Open area in lower right  
    { position: Vector3.create(80, 0, 80), speed: 10.0 },
    { position: Vector3.create(10, 0, 140), speed: 2.5 },   // Open area in upper left corner
    { position: Vector3.create(140, 0, 10), speed: 2.0 },   // Open area in lower right corner
    { position: Vector3.create(10, 0, 10), speed: 2.5 },   // Open area in upper left corner
    { position: Vector3.create(140, 0, 140), speed: 2.0 }, // Open area in lower right corner
    { position: Vector3.create(80, 0, 80), speed: 10.0 },
    { position: Vector3.create(10, 0, 140), speed: 2.5 },   // Open area in upper left corner
    { position: Vector3.create(140, 0, 10), speed: 2.0 },   // Open area in lower right corner
    { position: Vector3.create(10, 0, 10), speed: 2.5 },   // Open area in upper left corner
    { position: Vector3.create(140, 0, 140), speed: 2.0 }, // Open area in lower right corner
  ]
  
  // Create enemies
  enemySystem.createEnemies(enemySpawns)
  
  // Move player to starting position
  movePlayerTo({
    newRelativePosition: maze.startPosition,
    cameraTarget: Vector3.create(80, 2, 80) // Centered for 160x160m scene
  })
  
  lastPlayerPosition = maze.startPosition
  
  // Game loop
  engine.addSystem(() => {
    // Update cooldowns
    if (teleportCooldown > 0) {
      teleportCooldown -= 1/60 // Assuming 60 FPS
    }
    if (respawnCooldown > 0) {
      respawnCooldown -= 1/60
    }
    
    // Update enemies
    enemySystem.updateEnemies(1/60)
    
    // Get player entity
    const playerEntity = engine.PlayerEntity
    if (playerEntity) {
      const playerTransform = Transform.getOrNull(playerEntity)
      if (playerTransform) {
        lastPlayerPosition = playerTransform.position
        
        // Check enemy collision and respawn player
        if (respawnCooldown <= 0 && enemySystem.checkPlayerCollision(lastPlayerPosition)) {
          // Respawn player to starting position
          movePlayerTo({
            newRelativePosition: maze.startPosition,
            cameraTarget: Vector3.create(80, 2, 80)
          })
          
          // Set respawn cooldown
          respawnCooldown = RESPAWN_COOLDOWN_TIME
        }
        
        // Check teleport collision and teleport player (only if cooldown is 0)
        if (teleportCooldown <= 0) {
          const teleportDestination = mazeSystem.checkTeleportCollision(lastPlayerPosition)
          if (teleportDestination) {
            // Teleport player to random location
            movePlayerTo({
              newRelativePosition: teleportDestination,
            })
            
            // Set cooldown to prevent immediate re-teleportation
            teleportCooldown = TELEPORT_COOLDOWN_TIME
          }
        }
      }
    }
  })
}
