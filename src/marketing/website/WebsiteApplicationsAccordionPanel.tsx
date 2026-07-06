type Props = {
  id: string;
  title: string;
  body: string;
  image: string;
  imagePosition: string;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
};

/** Accordion column — expands on hover to reveal body copy */
export function WebsiteApplicationsAccordionPanel({
  id,
  title,
  body,
  image,
  imagePosition,
  isActive,
  onActivate,
  onDeactivate,
}: Props) {
  const handlePointerLeave = (ev: React.PointerEvent<HTMLDivElement>) => {
    const panels = ev.currentTarget.parentElement;
    if (panels?.contains(ev.relatedTarget as Node)) return;
    onDeactivate();
  };

  return (
    <div
      id={`web-applications-${id}`}
      className={`web-applications__panel${isActive ? " is-active" : ""}`}
      onPointerEnter={onActivate}
      onPointerLeave={handlePointerLeave}
      role="listitem"
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
