import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Pi from "phosphor-react"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import { IconContext as PhosphorIconContext } from "phosphor-react"
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline"

// Function to format Material icon name
export function formatMaterialIconName(iconPath: string) {
  if (!iconPath) return ''
  
  const [library, style, name] = iconPath.split('/')
  
  if (library === 'material') {
    // Convert from MdOutlineCleaningServices to cleaning_services
    return name
      .replace(/^Md/, '') // Remove Md prefix
      .replace(/^Outline/, '') // Remove Outline prefix
      .replace(/([A-Z])/g, (match, letter, offset) => 
        offset === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase()
      )
  }
  
  return name
}

// Function to get icon class based on library
export function getIconClass(iconPath: string) {
  if (!iconPath) return ''
  
  const [library, style] = iconPath.split('/')
  
  switch (library) {
    case 'material':
      return 'material-icons-outlined'
    case 'heroicons':
      return 'h-4 w-4'
    case 'phosphor':
      return 'h-4 w-4'
    case 'remixicon':
      return 'text-base'
    case 'boxicons':
      return 'text-base'
    case 'fontawesome':
      return 'text-base'
    case 'ionicons':
      return 'text-base'
    default:
      return 'h-4 w-4'
  }
}

// Function to get icon component
export function getIconComponent(iconPath: string | undefined, className: string = '') {
  if (!iconPath) return DocumentDuplicateIcon

  const [library, style, name] = iconPath.split('/')
  let iconSet: Record<string, any>

  // Função auxiliar para renderizar ícone do Phosphor
  const renderPhosphorIcon = (Icon: any) => {
    return function PhosphorIconWrapper(props: any) {
      return (
        <PhosphorIconContext.Provider
          value={{
            size: props.className?.includes('h-4') ? 16 : 20,
            weight: style as any,
            mirrored: false,
          }}
        >
          <Icon {...props} />
        </PhosphorIconContext.Provider>
      )
    }
  }

  switch (library) {
    case 'heroicons':
      switch (style) {
        case 'solid':
          iconSet = HeroIconsSolid
          break
        case 'mini':
          iconSet = HeroIconsMini
          break
        default:
          iconSet = HeroIconsOutline
      }
      break
    case 'remixicon':
      iconSet = Ri
      break
    case 'boxicons':
      iconSet = Bi
      break
    case 'phosphor':
      const PhosphorIcon = Pi[name as keyof typeof Pi]
      return PhosphorIcon ? renderPhosphorIcon(PhosphorIcon) : DocumentDuplicateIcon
    case 'fontawesome':
      iconSet = Fa
      break
    case 'material':
      iconSet = Md
      break
    case 'ionicons':
      iconSet = Io
      break
    default:
      iconSet = HeroIconsOutline
  }

  const IconComponent = iconSet[name]
  return IconComponent || DocumentDuplicateIcon
}

// Function to render an icon
export function renderIcon(iconPath: string | undefined, className: string = '') {
  if (!iconPath) return null

  const [library] = iconPath.split('/')

  if (library === 'material') {
    const iconName = formatMaterialIconName(iconPath)
    return <span className={`material-icons-outlined ${className}`}>{iconName}</span>
  }

  const IconComponent = getIconComponent(iconPath)
  return <IconComponent className={`${getIconClass(iconPath)} ${className}`} />
} 