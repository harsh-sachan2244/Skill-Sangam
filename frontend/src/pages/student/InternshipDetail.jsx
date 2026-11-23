import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createApplication, getApplications } from "../../api/applications";
import { createReport } from "../../api/reports";
import { getInternship } from "../../api/internships";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";
import Skeleton from "../../components/Skeleton";
export default function InternshipDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [applied, setApplied] = useState(false);
  const [modal, setModal] = useState("");
  const [note, setNote] = useState("");
  const [report, setReport] = useState({
    reason: "Unclear compensation",
    details: "",
  });
  useEffect(() => {
    Promise.all([getInternship(id), getApplications({ studentId: user.id })])
      .then(([i, a]) => {
        setItem(i.data);
        setApplied(a.data.some((x) => x.internshipId === id));
      })
      .catch((e) => toast(e.message, "error"));
  }, [id]);
  if (!item) return <Skeleton rows={4} />;
  const apply = async (e) => {
    e.preventDefault();
    if (note.trim().length < 20)
      return toast("Application note must be at least 20 characters.", "error");
    try {
      await createApplication({ studentId: user.id, internshipId: id, note });
      setApplied(true);
      setModal("");
      toast("Application submitted.");
    } catch (e) {
      toast(e.message, "error");
    }
  };
  const submitReport = async (e) => {
    e.preventDefault();
    await createReport({
      ...report,
      studentId: user.id,
      employerId: item.employerId,
      internshipId: id,
      employer: item.company,
      internship: item.title,
    });
    setModal("");
    toast("Report sent to the admin team.");
  };
  return (
    <>
      <Link className="back" to="/student">
        ← Browse internships
      </Link>
      <article className="detail">
        <div className="page-head">
          <div>
            <Badge>Open</Badge>
            <h1>{item.title}</h1>
            <p>{item.company} · Fixed 2-week internship</p>
          </div>
          <div className="detail-price">
            <b>₹{item.stipend.toLocaleString("en-IN")}</b>
            <span>total stipend</span>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <h2>About the project</h2>
            <p>{item.description}</p>
            <h2>Deliverables</h2>
            <p>{item.deliverables}</p>
            <h2>Skills</h2>
            <div className="chips">
              {item.requiredSkills.map((s) => (
                <span
                  className={`chip ${user.skills.some((x) => x.toLowerCase() === s.toLowerCase()) ? "highlight" : ""}`}
                  key={s}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <aside className="card detail-aside">
            <div>
              <b>Start date</b>
              <span>{item.startDate}</span>
            </div>
            <div>
              <b>Openings left</b>
              <span>{item.openings}</span>
            </div>
            <button
              className="button full"
              disabled={applied || item.openings < 1}
              onClick={() => setModal("apply")}
            >
              {applied ? "Applied" : "Apply now"}
            </button>
            <button className="text-button" onClick={() => setModal("report")}>
              Report this employer
            </button>
          </aside>
        </div>
      </article>
      {modal === "apply" && (
        <Modal title="Apply to this internship" onClose={() => setModal("")}>
          <form onSubmit={apply}>
            <label>
              Note to the employer
              <textarea
                required
                minLength="20"
                rows="6"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell them why you are a good fit (20+ characters)"
              />
            </label>
            <button className="button full">Submit application</button>
          </form>
        </Modal>
      )}
      {modal === "report" && (
        <Modal title="Report this employer" onClose={() => setModal("")}>
          <form onSubmit={submitReport}>
            <label>
              Reason
              <select
                value={report.reason}
                onChange={(e) =>
                  setReport({ ...report, reason: e.target.value })
                }
              >
                <option>Unclear compensation</option>
                <option>Misleading internship details</option>
                <option>Unexpected project scope</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Details
              <textarea
                required
                rows="5"
                value={report.details}
                onChange={(e) =>
                  setReport({ ...report, details: e.target.value })
                }
              />
            </label>
            <button className="button full">Send report</button>
          </form>
        </Modal>
      )}
    </>
  );
}
