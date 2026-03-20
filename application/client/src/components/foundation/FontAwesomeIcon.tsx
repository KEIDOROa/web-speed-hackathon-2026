import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Calendar,
  Home,
  Images,
  Loader,
  LogIn,
  Mail,
  Music,
  Pause,
  Pencil,
  Play,
  Scale,
  Search,
  Send,
  User,
  Video,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  search: Search,
  play: Play,
  pause: Pause,
  "sign-in-alt": LogIn,
  envelope: Mail,
  edit: Pencil,
  user: User,
  "balance-scale": Scale,
  "arrow-right": ArrowRight,
  "paper-plane": Send,
  images: Images,
  music: Music,
  video: Video,
  "arrow-down": ArrowDown,
  "circle-notch": Loader,
  "exclamation-circle": AlertCircle,
  "calendar-alt": Calendar,
};

interface Props {
  iconType: string;
  styleType: "solid" | "regular";
}

export const FontAwesomeIcon = ({ iconType }: Props) => {
  const Icon = ICON_MAP[iconType];
  if (!Icon) {
    return null;
  }
  return <Icon className="font-awesome inline-block leading-none" />;
};
