import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FlowingMenu from "./react-bits/FlowingMenu/FlowingMenu";
import { NAV_COPY } from "./websiteData";

const MENU_ITEMS = [
  { link: NAV_COPY.contactHref, text: NAV_COPY.contact, image: "/marketing/energy-cta.png" },
];

type Props = {
  open: boolean;
  onNavigate?: () => void;
};

/** Full-screen FlowingMenu overlay — mobile nav only */
export function WebsiteFlowingMenuOverlay({ open, onNavigate }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const root = document.querySelector(".web-rb-flowing-menu");
    if (!root) return;

    const onClick = (event: Event) => {
      const anchor = (event.target as HTMLElement).closest("a.menu__item-link");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("#")) {
        onNavigate?.();
        return;
      }
      if (href.startsWith("/")) {
        event.preventDefault();
        navigate(href);
        onNavigate?.();
      }
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [open, navigate, onNavigate]);

  if (!open) return null;

  return (
    <div className="web-rb-flowing-menu" aria-hidden={!open}>
      <FlowingMenu
        items={MENU_ITEMS}
        speed={18}
        textColor="#f5f5f7"
        bgColor="#1a2332"
        marqueeBgColor="#ffbf14"
        marqueeTextColor="#1a2332"
        borderColor="rgba(255, 255, 255, 0.12)"
      />
    </div>
  );
}
