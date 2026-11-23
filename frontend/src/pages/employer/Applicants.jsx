import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApplications, updateApplication } from "../../api/applications";
import { getInternship } from "../../api/internships";
import { useToast } from "../../components/Toast";
import Badge from "../../components/Badge";
import Skeleton from "../../components/Skeleton";
import { matchScore } from "../../utils/matchScore";
export default function Applicants() {
  const { id } = useParams();
  const toast = useToast();
  const [state, setState] = useState(null);
  useEffect(() => {
    Promise.all([
      getInternship(id),
      getApplications({ internshipId: id }),
    ]).then(([i, a]) => setState({ internship: i.data, apps: a.data }));
  }, [id]);
  const change = async (app, status) => {
    if (!window.confirm(`${status} this applicant?`)) return;
    await updateApplication(app.id, status);
    setState({
      ...state,
      apps: state.apps.map((a) => (a.id === app.id ? { ...a, status } : a)),
    });
    toast(`Applicant ${status.toLowerCase()}.`);
  };
  if (!state) return <Skeleton rows={4} />;
  return (
    <>
      <Link className="back" to="/employer">
        ← My internships
      </Link>
      <div className="page-head">
        <div>
          <div className="eyebrow">APPLICANTS</div>
          <h1>{state.internship.title}</h1>
          <p>
            {state.apps.length} applicant{state.apps.length === 1 ? "" : "s"} ·{" "}
            {state.internship.openings} opening(s) left
          </p>
        </div>
      </div>
      {!state.apps.length ? (
        <div className="empty">No applicants yet.</div>
      ) : (
        <div className="stack">
          {state.apps.map((a) => (
            <div className="card applicant" key={a.id}>
              <div>
                <h2>{a.student?.name}</h2>
                <p className="muted">
                  {a.student?.college || "College not provided"} ·{" "}
                  <a
                    href={`https://github.com/${a.student?.github}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                </p>
                <div className="chips">
                  {(a.student?.skills || []).map((s) => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))}
                  <strong>
                    {matchScore(
                      a.student?.skills,
                      state.internship.requiredSkills,
                    )}
                    % match
                  </strong>
                </div>
                <p>“{a.note}”</p>
              </div>
              <div className="applicant-actions">
                <Badge>{a.status}</Badge>
                {a.status === "Applied" && (
                  <>
                    <button
                      className="button small"
                      onClick={() => change(a, "Shortlisted")}
                    >
                      Shortlist
                    </button>
                    <button
                      className="button secondary small"
                      onClick={() => change(a, "Accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="text-button"
                      onClick={() => change(a, "Rejected")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
