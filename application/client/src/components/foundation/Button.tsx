import classNames from "classnames";
import { ComponentPropsWithRef, type MouseEvent, ReactNode } from "react";

import { scheduleShowModalFallback } from "@web-speed-hackathon-2026/client/src/utils/schedule_show_modal_fallback";

interface Props extends ComponentPropsWithRef<"button"> {
  variant?: "primary" | "secondary";
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  command?: string;
  commandfor?: string;
}

export const Button = ({
  variant = "primary",
  leftItem,
  rightItem,
  className,
  children,
  type = "button",
  onClick,
  command,
  commandfor,
  ...props
}: Props) => {
  const handleClick =
    command === "show-modal" && commandfor !== undefined
      ? (e: MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          scheduleShowModalFallback(commandfor);
        }
      : onClick;

  return (
    <button
      className={classNames(
        "flex items-center justify-center gap-2 rounded-full px-4 py-2 border",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong border-transparent":
            variant === "primary",
          "bg-cax-surface text-cax-text-muted hover:bg-cax-surface-subtle border-cax-border":
            variant === "secondary",
        },
        className,
      )}
      type={type}
      command={command}
      commandfor={commandfor}
      onClick={handleClick}
      {...props}
    >
      {leftItem}
      <span>{children}</span>
      {rightItem}
    </button>
  );
};
