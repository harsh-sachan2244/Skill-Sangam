
import { useEffect, useState } from "react";
import {
  createComplaint,
  getMyComplaints,
} from "../../api/complaints";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";

const initialForm = {
  subject: "",
  category: "Platform Issue",
  description: "",
};

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadComplaints() {
    try {
      const response = await getMyComplaints();
      setComplaints(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createComplaint(form);

      setForm(initialForm);
      setShowForm(false);
      setSuccess("Your complaint has been submitted successfully.");

      await loadComplaints();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Skeleton rows={4} />;

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="eyebrow">STUDENT SUPPORT</div>
          <h1>My Complaints</h1>
          <p className="muted mt-1">
            Submit an issue and track its progress.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Close Form" : "+ Submit Complaint"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {success && (
        <div className="success-box">
          {success}
        </div>
      )}

      {/* Complaint Form */}
      {showForm && (
        <div className="form-card">
          <h2 className="mb-3 text-xl font-bold text-indigo-600">
    Submit a Complaint
  </h2>

          <p className="muted mb-5">
            Please provide the details of your issue below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Subject</label>
              <input
                className="form-input"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter complaint subject"
                minLength={5}
                maxLength={120}
                required
              />
            </div>

            <div>
              <label className="form-label">Category</label>
              <select
                className="form-input"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option>Platform Issue</option>
                <option>Account Issue</option>
                <option>Application Issue</option>
                <option>Employer Issue</option>
                <option>Technical Issue</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Explain your issue in detail..."
                rows={5}
                minLength={20}
                maxLength={3000}
                required
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaint History */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            Complaint History
          </h2>

          <p className="muted mt-1">
            View all your submitted complaints and their latest status.
          </p>
        </div>

        {!complaints.length ? (
          <EmptyState title="No complaints submitted yet">
            Your submitted complaints will appear here.
          </EmptyState>
        ) : (
          <div className="list-card">
            {complaints.map((complaint) => (
              <div
                className="list-row"
                key={complaint._id || complaint.id}
              >
                <div className="min-w-0 flex-1">
                  <h3>{complaint.subject}</h3>

                  <p className="muted">
                    {complaint.category} ·{" "}
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </p>

                  <p className="mt-2">
                    {complaint.description}
                  </p>

                  {complaint.adminResponse && (
                    <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950">
                      <strong className="text-sm text-teal-800 dark:text-teal-300">
                        Admin Response
                      </strong>

                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {complaint.adminResponse}
                      </p>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Badge>{complaint.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
