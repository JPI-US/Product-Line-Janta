type Props = {
  id: string;
  title: string;
  body: string;
  image: string;
  imagePosition: string;
  isActive: boolean;
  /** Mouse/trackpad only — touch drives the panel by tap instead. */
  hasHover: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
};

/**
 * Accordion column. Expands on hover where hover exists; everywhere else (phones,
 * keyboard) it toggles open/closed on tap or Enter/Space — pointerleave never
 * fires on touch, so hover alone would leave a tapped panel stuck open.
 */
export function WebsiteApplicationsAccordionPanel({
  id,
  title,
  body,
  image,
  imagePosition,
  isActive,
  hasHover,
  onToggle,
  onActivate,
  onDeactivate,
}: Props) {
  const handlePointerLeave = (ev: React.PointerEvent<HTMLDivElement>) => {
    const panels = ev.currentTarget.parentElement;
    if (panels?.contains(ev.relatedTarget as Node)) return;
    onDeactivate();
  };

  const hoverProps = hasHover
    ? { onPointerEnter: onActivate, onPointerLeave: handlePointerLeave }
    : {};

  return (
    <div
      id={`web-applications-${id}`}
      className={`web-applications__panel${isActive ? " is-active" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={isActive}
      aria-label={title}
      onClick={onToggle}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onToggle();
        }
      }}
      {...hoverProps}
    >
      <img
        className="web-applications__panel-bg"
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ objectPosition: imagePosition }}
        aria-hidden
      />
      <div className="web-applications__panel-scrim" aria-hidden />
      <div className="web-applications__panel-content">
        <div className="web-applications__panel-copy">
          <h3 className="web-applications__panel-title">{title}</h3>
          <p className="web-applications__panel-body">{body}</p>
        </div>
      </div>
    </div>
  );
}
