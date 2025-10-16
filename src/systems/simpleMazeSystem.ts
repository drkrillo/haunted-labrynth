import { engine, Entity, Transform, Material, MeshRenderer, MeshCollider } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'
import { mazeLayout } from '../data/simpleMaze'

export class TeleportMazeSystem {
  private walls: Entity[] = []
  private teleports: Entity[] = []
  private teleportPositions: Vector3[] = []

  createMaze(): { walls: Entity[], teleports: Entity[], startPosition: Vector3 } {
    this.clearMaze()
    
    const walls: Entity[] = []
    const teleports: Entity[] = []
    const teleportPositions: Vector3[] = []
    
    // 5x5 meter cell system for 160x160m scene
    const cellSize = 5.0  // 5 meters per cell
    
    // Create walls and teleports
    for (let row = 0; row < mazeLayout.grid.length; row++) {
      for (let col = 0; col < mazeLayout.grid[row].length; col++) {
        const cell = mazeLayout.grid[row][col]
        
        if (cell === 1) {
          // Create wall
          const wall = engine.addEntity()
          
          Transform.create(wall, {
            position: Vector3.create(
              col * cellSize + cellSize / 2,
              1.5, // Wall height centered
              row * cellSize + cellSize / 2
            ),
            scale: Vector3.create(cellSize, 3, cellSize) // 5x3x5 meter wall
          })
          
          MeshRenderer.setBox(wall)
          MeshCollider.setBox(wall)
          
          Material.setPbrMaterial(wall, {
            albedoColor: Color4.create(0.3, 0.3, 0.3, 1), // Dark gray walls
            metallic: 0.1,
            roughness: 0.8
          })
          
          walls.push(wall)
        } else if (cell === "O") {
          // Create teleport
          const teleport = engine.addEntity()
          const teleportPos = Vector3.create(
            col * cellSize + cellSize / 2,
            0.5,
            row * cellSize + cellSize / 2
          )
          
          Transform.create(teleport, {
            position: teleportPos,
            scale: Vector3.create(3, 1, 3) // 3x1x3 meter teleport
          })
          
          MeshRenderer.setBox(teleport)
          MeshCollider.setBox(teleport)
          
          Material.setPbrMaterial(teleport, {
            albedoColor: Color4.create(0.8, 0.2, 0.8, 0.8), // Purple teleport
            metallic: 0.3,
            roughness: 0.2,
            emissiveColor: Color4.create(0.4, 0.1, 0.4, 1),
            emissiveIntensity: 0.7
          })
          
          teleports.push(teleport)
          teleportPositions.push(teleportPos)
        }
      }
    }
    
    this.walls = walls
    this.teleports = teleports
    this.teleportPositions = teleportPositions
    
    return {
      walls,
      teleports,
      startPosition: Vector3.create(
        mazeLayout.startPosition.x * cellSize + cellSize / 2,
        0,
        mazeLayout.startPosition.z * cellSize + cellSize / 2
      )
    }
  }

  getTeleportPositions(): Vector3[] {
    return this.teleportPositions
  }
  
  getWalls(): Entity[] {
    return this.walls
  }
  
  getRandomTeleportPosition(excludePosition: Vector3): Vector3 | null {
    const availablePositions = this.teleportPositions.filter(pos => 
      Vector3.distance(pos, excludePosition) > 0.5
    )
    
    if (availablePositions.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * availablePositions.length)
    return availablePositions[randomIndex]
  }
  
  checkTeleportCollision(playerPosition: Vector3): Vector3 | null {
    for (const teleportPos of this.teleportPositions) {
      const distance = Vector3.distance(playerPosition, teleportPos)
      if (distance < 2.5) {
        return this.getRandomTeleportPosition(teleportPos)
      }
    }
    return null
  }
  
  clearMaze(): void {
    this.walls.forEach(wall => {
      engine.removeEntity(wall)
    })
    this.teleports.forEach(teleport => {
      engine.removeEntity(teleport)
    })
    this.walls = []
    this.teleports = []
    this.teleportPositions = []
  }
}
