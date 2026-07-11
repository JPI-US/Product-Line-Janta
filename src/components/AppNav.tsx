import { NavLink } from "react-router-dom";

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Site sections">
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "app-nav__link app-nav__link--active" : "app-nav__link"
        }
      >
        Website
      </NavLink>
    </nav>
  );
}
