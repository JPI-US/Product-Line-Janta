import { PARTNERS_COPY } from "./websiteData";
import { useWebsiteHeroCanvasActive } from "./useWebsiteHeroCanvasActive";

function PartnerMark({
  id,
  name,
  logo,
  lazy,
}: {
  id: string;
  name: string;
  logo: string;
  lazy?: boolean;
}) {
  return (
    <span className="web-partners__mark">
      <img
        className={`web-partners__logo web-partners__logo--${id}`}
        src={logo}
        alt={name}
        decoding="async"
        loading={lazy ? "lazy" : "eager"}
      />
    </span>
  );
}

export function WebsitePartnersSection({ className }: { className?: string }) {
  const heroActive = useWebsiteHeroCanvasActive();
  const loop = [...PARTNERS_COPY.items, ...PARTNERS_COPY.items];
  const itemCount = PARTNERS_COPY.items.length;

  return (
    <section
      className={[
        "web-partners",
        className,
        heroActive ? null : "web-partners--paused",
      ]
        .filter(Boolean)
        .join(" ")}
      id="web-partners"
      aria-label="Partners"
    >
      <div className="web-partners__marquee" aria-hidden>
        <div className="web-partners__track">
          {loop.map((item, index) => (
            <span key={`${item.id}-${index}`} className="web-partners__segment">
              <PartnerMark
                id={item.id}
                name={item.name}
                logo={item.logo}
                lazy={index >= itemCount}
              />
              <span className="web-partners__diamond" aria-hidden />
            </span>
          ))}
        </div>
      </div>

      <ul className="web-partners__sr-list">
        {PARTNERS_COPY.items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
}
