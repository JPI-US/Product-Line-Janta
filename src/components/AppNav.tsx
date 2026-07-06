import { NavLink } from "react-router-dom";

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Site sections">
      <NavLink
        to="/website"
        className={({ isActive }) =>
          isActive ? "app-nav__link app-nav__link--active" : "app-nav__link"
        }
      >
        Website
      </NavLink>
      <NavLink
        to="/products/designer"
        className={({ isActive }) =>
          isActive ? "app-nav__link app-nav__link--active" : "app-nav__link"
        }
      >
        DSR Tower
      </NavLink>
      <NavLink
        to="/products/utility"
        className={({ isActive }) =>
          isActive ? "app-nav__link app-nav__link--active" : "app-nav__link"
        }
      >
        LFM Tower
      </NavLink>
    </nav>
  );
}
