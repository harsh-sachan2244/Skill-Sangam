import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const linksByRole = {
  student: [
    { label: "Dashboard", to: "/student", end: true },
    { label: "Browse", to: "/student/browse" },
    { label: "Applications", to: "/student/applications" },
  ],
  employer: [
    { label: "Dashboard", to: "/employer", end: true },
    { label: "Post Internship", to: "/employer/internships/new" },
    { label: "Applicants", to: "/employer/internships", end: true },
    { label: "Messages", to: "/messages" },
  ],
 admin: [
    { label: "Dashboard", to: "/student", end: true },
  { label: "Browse", to: "/student/browse" },
  { label: "Applications", to: "/student/applications" },
  { label: "Complaints", to: "/student/complaints" },
  { label: "Messages", to: "/messages" },
],

};

const roleLabels = { student: "Student", employer: "Employer", admin: "Admin" };

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SS";
}

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const links = linksByRole[user?.role] || [];
  const profilePath =
    user?.role === "student"
      ? "/student/profile"
      : user?.role === "employer"
        ? "/employer/company"
        : "/account";

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const linkClass = ({ isActive }) =>
    `flex h-16 items-center border-b-2 text-sm font-medium ${
      isActive
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-gray-800"
    }`;
  const mobileLinkClass = ({ isActive }) =>
    `block border-b-2 px-3 py-2 text-sm font-medium ${
      isActive
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-gray-800"
    }`;

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
        <Link to={`/${user.role}`} onClick={() => setMobileOpen(false)}>
          <span className="text-xl font-bold text-gray-900">✦ Skill <span className="text-indigo-600">Sangam</span></span>
          {/*
          <span aria-hidden="true">✦ </span>Skill <span className="text-indigo-600">Sangam</span>
          */}
        </Link>
        <div className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          {links.map((link) => <NavLink key={link.to} end={link.end} to={link.to} className={linkClass}>{link.label}</NavLink>)}
        </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button type="button" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-gray-100" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen((open) => !open)}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">{initials(user.name)}</span>
            <span className="hidden sm:block"><span className="block text-sm font-semibold text-gray-900">{user.name}</span><span className="block text-xs text-gray-500">{roleLabels[user.role] || user.role}</span></span>
            <span className="text-sm text-gray-500" aria-hidden="true">▾</span>
            {/*
            <span className="text-lg text-gray-500" aria-hidden="true">▾</span>
            */}
          </button>
          {menuOpen && <div className="absolute right-0 mt-2 z-20 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu" aria-label="User menu">
            <Link className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" to={profilePath} role="menuitem" onClick={() => setMenuOpen(false)}>Profile</Link>
            <Link className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" to="/account" role="menuitem" onClick={() => setMenuOpen(false)}>Account</Link>
            <button type="button" className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50" role="menuitem" onClick={() => { setMenuOpen(false); onLogout(); }}>Log out</button>
          </div>}
          <button type="button" className="rounded-md p-2 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 md:hidden" aria-label="Toggle navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
            <span className="text-xl leading-none" aria-hidden="true">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </nav>
      {mobileOpen && <nav className="border-t border-gray-100 px-4 py-2 md:hidden" aria-label="Mobile navigation">
        {links.map((link) => <NavLink key={link.to} end={link.end} to={link.to} className={mobileLinkClass} onClick={() => setMobileOpen(false)}>{link.label}</NavLink>)}
      </nav>}
    </header>
  );
}
