import ReactEcs, { UiEntity, Label } from "@dcl/sdk/react-ecs"

interface TeleportUIProps {
  showTeleportMessage: boolean
}

export function TeleportUI({ showTeleportMessage }: TeleportUIProps) {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: { top: 20, left: 20 }
      }}
    >
      {/* Teleport Message */}
      {showTeleportMessage && (
        <UiEntity
          uiTransform={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          <Label
            value="🌀 TELEPORTED! 🌀"
            fontSize={36}
            color={{ r: 0.8, g: 0.2, b: 0.8, a: 1 }}
            uiTransform={{
              margin: { bottom: 20 }
            }}
          />
          <Label
            value="You've been teleported to another location!"
            fontSize={20}
            color={{ r: 1, g: 1, b: 1, a: 1 }}
          />
        </UiEntity>
      )}
    </UiEntity>
  )
}
