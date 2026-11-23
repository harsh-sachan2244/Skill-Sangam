
import { useEffect, useState } from "react";
import {
  getAllComplaints,
  updateComplaint,
} from "../../api/complaints";
import { useToast } from "../../components/Toast";
import Skeleton from "../../components/Skeleton";

const statuses = ["All", "Pending", "In Progress", "Resolved", "Rejected"];

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Complaints() {
  const [complaints, setComplaints] = useState(null);
  const [tab, setTab] = useState("All");
  const [responses, setResponses] = useState({});
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [saving, setSaving] = useState("");
  const toast = useToast();

  const load = () =>
    getAllComplaints().then((response) => {
      setComplaints(response.data || []);
    });

  useEffect(() => {
    load().catch(() => setComplaints([]));
  }, []);

  async function handleUpdate(complaint) {
    const id = complaint._id || complaint.id;
    setSaving(id);

    try {
      await updateComplaint(id, {
        status: selectedStatuses[id] ?? complaint.status,
        adminResponse:
          responses[id] ?? complaint.adminResponse ?? "",
      });

      toast("Complaint updated successfully.");
      await load();
    } catch (error) {
      toast(error.message || "Unable to update complaint.");
    } finally {
      setSaving("");
    }
  }

  if (!complaints) return <Skeleton rows={4} />;

  const visible = complaints.filter(
    (complaint) =>
      tab === "All" || complaint.status === tab
  );

  const counts = {
    All: complaints.length,
    Pending: complaints.filter((c) => c.status === "Pending").length,
    "In Progress": complaints.filter((c) => c.status === "In Progress").length,
    Resolved: complaints.filter((c) => c.status === "Resolved").length,
    Rejected: complaints.filter((c) => c.status === "Rejected").length,
  };

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMIN WORKSPACE</div>
          <h1>Complaints</h1>
          <p className="muted">
            Review student complaints and manage their resolution.
          </p>
        </div>
      </div>

      {/* Complaint Filters */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setTab(status)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              tab === status
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {status}
            <span className="ml-1.5 opacity-75">
              ({counts[status]})
            </span>
          </button>
        ))}
      </div>

      {/* Complaints */}
      {!visible.length ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">
            No complaints found.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Student complaints will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((complaint) => {
            const id = complaint._id || complaint.id;
            const student = complaint.studentId?.name || "Student";
            const email = complaint.studentId?.email || "";

            return (
              <div
                key={id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                {/* Complaint Heading */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-800">
                    {complaint.subject}
                  </h2>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusStyles[complaint.status] ||
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {complaint.status}
                  </span>
                </div>

                {/* Complaint Information */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="font-medium text-indigo-600">
                    {complaint.category}
                  </span>
                  <span>•</span>
                  <span>{student}</span>
                  {email && (
                    <>
                      <span>•</span>
                      <span className="break-all">{email}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Description */}
                <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    Complaint Description
                  </p>
                  <p className="text-sm leading-5 text-slate-600 whitespace-pre-wrap">
                    {complaint.description}
                  </p>
                </div>

                {/* Admin Response */}
                <div>
                  <label
                    htmlFor={`response-${id}`}
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Admin Response
                  </label>

                  <textarea
                    id={`response-${id}`}
                    rows={2}
                    maxLength={2000}
                    placeholder="Write a response to the student..."
                    value={
                      responses[id] ??
                      complaint.adminResponse ??
                      ""
                    }
                    onChange={(event) =>
                      setResponses((previous) => ({
                        ...previous,
                        [id]: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Status and Save */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="w-full sm:w-52">
                    <label
                      htmlFor={`status-${id}`}
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Update Status
                    </label>

                    <select
                      id={`status-${id}`}
                      value={selectedStatuses[id] ?? complaint.status}
                      onChange={(event) =>
                        setSelectedStatuses((previous) => ({
                          ...previous,
                          [id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      {statuses
                        .filter((status) => status !== "All")
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdate(complaint)}
                    disabled={saving === id}
                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving === id ? "Saving..." : "Save Response"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
