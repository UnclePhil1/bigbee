export function generateRows(count: number, stageId: number) {
  const rows = []
  for (let i = 0; i < count; i++) {
    rows.push(generateRow(stageId))
  }
  return rows
}

function generateRow(stageId: number) {
  // For Stage 1, we'll handle honey jar placement separately
  if (stageId === 1) {
    // Only generate car, truck, and forest rows for Stage 1
    const types = ["car", "truck", "forest"]
    const type = randomElement(types)
    if (type === "car") return generateCarLaneMetadata(stageId)
    if (type === "truck") return generateTruckLaneMetadata(stageId)
    return generateForesMetadata()
  }

  // Other stages work as before
  const types = ["car", "truck", "forest"]
  if (stageId === 3) {
    types.push("wasp")
  } else if (stageId === 4) {
    types.push("lost-bees")
  }

  const type = randomElement(types)
  if (type === "car") return generateCarLaneMetadata(stageId)
  if (type === "truck") return generateTruckLaneMetadata(stageId)
  if (type === "wasp") return generateWaspLaneMetadata()
  if (type === "lost-bees") return generateLostBeeLaneMetadata()
  return generateForesMetadata()
}

function generateWaspLaneMetadata() {
  const occupiedTiles = new Set()
  const wasps = Array.from({ length: 2 }, () => {
    let tileIndex: number
    do {
      tileIndex = Math.floor(Math.random() * 17) - 8
    } while (occupiedTiles.has(tileIndex))
    occupiedTiles.add(tileIndex)
    return { tileIndex }
  })
  return { type: "wasp", wasps }
}

function generateLostBeeLaneMetadata() {
  const occupiedTiles = new Set()
  const lostBees = Array.from({ length: 3 }, () => {
    let tileIndex: number
    do {
      tileIndex = Math.floor(Math.random() * 17) - 8
    } while (occupiedTiles.has(tileIndex))
    occupiedTiles.add(tileIndex)
    return { tileIndex }
  })
  return { type: "lost-bees", lostBees }
}

function randomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)]
}

function generateForesMetadata() {
  const occupiedTiles = new Set()
  const trees = Array.from({ length: 4 }, () => {
    let tileIndex: number
    do {
      tileIndex = Math.floor(Math.random() * 17) - 8
    } while (occupiedTiles.has(tileIndex))
    occupiedTiles.add(tileIndex)
    const height = randomElement([20, 45, 60])
    return { tileIndex, height }
  })
  return { type: "forest", trees }
}

function generateCarLaneMetadata(stageId = 1) {
  const direction = randomElement([true, false])
  // Increase speed based on stage
  const baseSpeed = 125
  const speed = randomElement([
    baseSpeed + (stageId - 1) * 25,
    baseSpeed + (stageId - 1) * 31,
    baseSpeed + (stageId - 1) * 38,
  ])

  const occupiedTiles = new Set()
  const vehicleCount = Math.max(2, 4 - stageId) // Fewer cars in harder stages

  const vehicles = Array.from({ length: vehicleCount }, () => {
    let initialTileIndex: number
    do {
      initialTileIndex = Math.floor(Math.random() * 17) - 8
    } while (occupiedTiles.has(initialTileIndex))
    occupiedTiles.add(initialTileIndex - 1)
    occupiedTiles.add(initialTileIndex)
    occupiedTiles.add(initialTileIndex + 1)
    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b])
    return { initialTileIndex, color }
  })

  const result: any = { type: "car", direction, speed, vehicles }

  return result
}

function generateTruckLaneMetadata(stageId = 1) {
  const direction = randomElement([true, false])
  const baseSpeed = 125
  const speed = randomElement([
    baseSpeed + (stageId - 1) * 25,
    baseSpeed + (stageId - 1) * 31,
    baseSpeed + (stageId - 1) * 38,
  ])

  const occupiedTiles = new Set()
  const vehicles = Array.from({ length: 2 }, () => {
    let initialTileIndex: number
    do {
      initialTileIndex = Math.floor(Math.random() * 17) - 8
    } while (occupiedTiles.has(initialTileIndex))
    occupiedTiles.add(initialTileIndex - 2)
    occupiedTiles.add(initialTileIndex - 1)
    occupiedTiles.add(initialTileIndex)
    occupiedTiles.add(initialTileIndex + 1)
    occupiedTiles.add(initialTileIndex + 2)
    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b])
    return { initialTileIndex, color }
  })

  const result: any = { type: "truck", direction, speed, vehicles }

  return result
}
