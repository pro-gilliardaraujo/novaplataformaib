import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import * as Pi from "phosphor-react"
import { IconContext as PhosphorIconContext } from "phosphor-react"
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline"

export function renderIcon(iconString: string): React.ReactNode {
  const [library, style, name] = iconString.split("/")
  let iconSet: any

  const renderPhosphorIcon = (Icon: any) => {
    return (
      <PhosphorIconContext.Provider
        value={{
          size: 20,
          weight: style as any,
          mirrored: false,
        }}
      >
        <Icon />
      </PhosphorIconContext.Provider>
    )
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
      if (PhosphorIcon) {
        return renderPhosphorIcon(PhosphorIcon)
      }
      return <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
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
      return <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
  }

  const Icon = iconSet[name]
  if (!Icon) {
    return <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
  }

  return <Icon className="h-5 w-5" />
} 