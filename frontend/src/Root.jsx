import React from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layouts/PublicLayout";
import StudentLayout from "./layouts/StudentLayout";
import EmployerLayout from "./layouts/EmployerLayout";
import AdminLayout from "./layouts/AdminLayout";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import HowItWorks from "./pages/public/HowItWorks";
import PublicBrowse from "./pages/public/PublicBrowse";
import StaticPage from "./pages/public/StaticPage";
import Unauthorized from "./pages/shared/Unauthorized";
import Account from "./pages/shared/Account";
import StudentDashboard from "./pages/student/Dashboard";
import Browse from "./pages/student/Browse";
import InternshipDetail from "./pages/student/InternshipDetail";
import Applications from "./pages/student/Applications";
import Complaints from "./pages/student/Complaints";
import Profile from "./pages/student/Profile";
import EmployerDashboard from "./pages/employer/Dashboard";
import EmployerHome from "./pages/employer/Home";
import Verification from "./pages/employer/Verification";
import EmployerNew from "./pages/employer/New";
import Applicants from "./pages/employer/Applicants";
import CompanyProfile from "./pages/employer/CompanyProfile";
import AdminDashboard from "./pages/admin/Dashboard";
import Approvals from "./pages/admin/Approvals";
import Reports from "./pages/admin/Reports";
import AdminComplaints from "./pages/admin/Complaints";
import Audit from "./pages/admin/Audit";

function Home() {
  const { user } = useAuth();
  return user ? (
    <Navigate to={`/${user.role}`} replace />
  ) : (
    <PublicLayout>
      <Landing />
    </PublicLayout>
  );
}

function PublicPage({ children }) {
  return (
    <PublicLayout>
      <main className="container page-content">{children}</main>
    </PublicLayout>
  );
}
function ProtectedPage({ role, layout: Layout, children }) {
  return (
    <ProtectedRoute role={role}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}
function AccountPage() {
  const { user } = useAuth();
  if (!user)
    return (
      <ProtectedRoute>
        <Account />
      </ProtectedRoute>
    );
  const Layout =
    user.role === "student"
      ? StudentLayout
      : user.role === "employer"
        ? EmployerLayout
        : AdminLayout;
  return (
    <ProtectedRoute>
      <Layout>
        <Account />
      </Layout>
    </ProtectedRoute>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <PublicLayout>
                  <Login />
                </PublicLayout>
              }
            />
            <Route
              path="/register"
              element={
                <PublicLayout>
                  <Register />
                </PublicLayout>
              }
            />
            <Route
              path="/how-it-works"
              element={
                <PublicPage>
                  <HowItWorks />
                </PublicPage>
              }
            />
            <Route
              path="/internships"
              element={
                <PublicPage>
                  <PublicBrowse />
                </PublicPage>
              }
            />
            <Route
              path="/about"
              element={
                <PublicPage>
                  <StaticPage
                    title="About SkillSangam"
                    description="A calmer bridge between what students know and what startups need."
                  />
                </PublicPage>
              }
            />
            <Route
              path="/terms"
              element={
                <PublicPage>
                  <StaticPage
                    title="Terms of use"
                    description="Use the platform honestly, respectfully, and for the projects described."
                  />
                </PublicPage>
              }
            />
            <Route
              path="/privacy"
              element={
                <PublicPage>
                  <StaticPage
                    title="Privacy"
                    description="The demo stores data in your browser and does not provide production security."
                  />
                </PublicPage>
              }
            />
            <Route
              path="/unauthorized"
              element={
                <PublicPage>
                  <Unauthorized />
                </PublicPage>
              }
            />
            <Route path="/account" element={<AccountPage />} />
            <Route
              path="/student"
              element={
                <ProtectedPage role="student" layout={StudentLayout}>
                  <StudentDashboard />
                </ProtectedPage>
              }
            />
            <Route
              path="/student/browse"
              element={
                <ProtectedPage role="student" layout={StudentLayout}>
                  <Browse />
                </ProtectedPage>
              }
            />
            <Route
              path="/student/internships/:id"
              element={
                <ProtectedPage role="student" layout={StudentLayout}>
                  <InternshipDetail />
                </ProtectedPage>
              }
            />
            <Route
              path="/student/applications"
              element={
                <ProtectedPage role="student" layout={StudentLayout}>
                  <Applications />
                </ProtectedPage>
              }
            />
            <Route
  path="/student/complaints"
  element={
    <ProtectedPage role="student" layout={StudentLayout}>
      <Complaints />
    </ProtectedPage>
  }
/>
            <Route
              path="/student/profile"
              element={
                <ProtectedPage role="student" layout={StudentLayout}>
                  <Profile />
                </ProtectedPage>
              }
            />
            <Route
              path="/employer"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <EmployerDashboard />
                </ProtectedPage>
              }
            />
            <Route
              path="/employer/verify"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <Verification />
                </ProtectedPage>
              }
            />
            <Route
              path="/verify-email"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <Verification />
                </ProtectedPage>
              }
            />
            <Route
              path="/employer/internships"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <EmployerHome />
                </ProtectedPage>
              }
            />
            <Route
              path="/employer/internships/new"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <EmployerNew />
                </ProtectedPage>
              }
            />
            <Route
              path="/employer/internships/:id/edit"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <EmployerNew />
                </ProtectedPage>
              }
            />
            <Route
              path="/employer/internships/:id/applicants"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <Applicants />
                </ProtectedPage>
              }
            />
            <Route
              path="/employer/company"
              element={
                <ProtectedPage role="employer" layout={EmployerLayout}>
                  <CompanyProfile />
                </ProtectedPage>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedPage role="admin" layout={AdminLayout}>
                  <AdminDashboard />
                </ProtectedPage>
              }
            />
            <Route
              path="/admin/employers"
              element={
                <ProtectedPage role="admin" layout={AdminLayout}>
                  <Approvals />
                </ProtectedPage>
              }
            />
            <Route
              path="/admin/verifications"
              element={
                <ProtectedPage role="admin" layout={AdminLayout}>
                  <Approvals />
                </ProtectedPage>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedPage role="admin" layout={AdminLayout}>
                  <Reports />
                </ProtectedPage>
              }
            />
            <Route
  path="/admin/complaints"
  element={
    <ProtectedPage role="admin" layout={AdminLayout}>
      <AdminComplaints />
    </ProtectedPage>
  }
/>
            <Route
              path="/admin/audit"
              element={
                <ProtectedPage role="admin" layout={AdminLayout}>
                  <Audit />
                </ProtectedPage>
              }
            />
            <Route
              path="*"
              element={
                <PublicPage>
                  <div className="empty page-message">
                    <h1>Page not found</h1>
                    <p>That page does not exist.</p>
                    <Link className="button" to="/">
                      Go home
                    </Link>
                  </div>
                </PublicPage>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
