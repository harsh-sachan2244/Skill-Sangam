import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConversations } from "../../api/messages";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/Badge";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";

export default function Inbox() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, data: [], error: "" });
  useEffect(() => {
    getConversations()
      .then((r) => setState({ loading: false, data: r.data, error: "" }))
      .catch((e) => setState({ loading: false, data: [], error: e.message }));
  }, []);
  if (state.loading) return <Skeleton rows={4} />;return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">MESSAGES</div>
          <h1>Your conversations</h1>
          <p>Chats open after a student applies to an internship.</p>
        </div>
      </div>
      {state.error ? (
        <div className="error-box">{state.error}</div>
      ) : !state.data.length ? (
        <EmptyState title="No conversations yet">
          {user.role === "student" ? (
            <Link to="/student/browse">
              Apply to an internship to start chatting.
            </Link>
          ) : (
            <Link to="/employer">
              Post an internship and wait for applicants.
            </Link>
          )}
        </EmptyState>
      ) : ( <div className="list-card">
          {state.data.map((c) => {
            const other = user.role === "student" ? c.employer : c.student;
            return (
              <Link
                className="list-row inbox-row"
                to={`/messages/${c.internshipId}/${other.id}`}
                key={`${c.internshipId}-${other.id}`}
              >
                <div>
                  <h3>{other?.name}</h3>
                  <p className="muted">
                    {c.internship?.title} · {c.lastMessage?.text}
                  </p>
                </div>
                {c.unread > 0 && <Badge>{c.unread} new</Badge>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}