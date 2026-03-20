import { AnchorHTMLAttributes, forwardRef, MouseEvent } from "react";
import { To, useHref } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
  reloadDocument?: boolean;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(
  ({ to, reloadDocument, onClick, target, ...props }, ref) => {
    const href = useHref(to);
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (!reloadDocument || e.defaultPrevented) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      if (target === "_blank") {
        return;
      }
      e.preventDefault();
      window.location.assign(href);
    };
    return <a ref={ref} href={href} target={target} onClick={handleClick} {...props} />;
  },
);

Link.displayName = "Link";
