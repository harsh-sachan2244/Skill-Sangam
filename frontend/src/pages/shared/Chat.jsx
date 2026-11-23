import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getConversations,
  getHistory,
  markConversationRead,
  sendMessage,
} from "../../api/messages";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import Skeleton from "../../components/Skeleton";

export default function Chat() {
  const { internshipId, userId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");const load = () =>
    getHistory(internshipId, userId)
      .then((r) => {
        setMessages(r.data);
        markConversationRead(internshipId, userId);
      })
      .catch(() => {});

  useEffect(() => {
    setMeta(null);
    setMessages(null);
    getConversations()
      .then((c) => {
        const conversation = c.data.find(
          (item) =>
            item.internshipId === internshipId &&
            ((user.role === "student" && item.employer?.id === userId) ||
              (user.role === "employer" && item.student?.id === userId)),
        );setMeta({
          other: conversation
            ? user.role === "student"
              ? conversation.employer
              : conversation.student
            : { name: "User" },
          internship: conversation?.internship || null,
        });
      })
      .catch(() => setMeta({ other: { name: "User" }, internship: null }));
    load();
    const poll = setInterval(load, 4000);
    return () => clearInterval(poll);
  }, [internshipId, userId]);
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await sendMessage({
        internshipId,
        receiverId: userId,
        text,
      });
      setMessages((m) => [...(m || []), data]);
      setText("");
    } catch (err) {
      toast(err.message, "error");
    }
  };
   if (messages === null || meta === null) return <Skeleton rows={4} />;
    return (
    <>
      <Link className="back" to="/messages">
        ← Messages
      </Link>
      <div className="page-head">
        <div>
          <div className="eyebrow">CONVERSATION</div>
          <h1>{meta.other?.name}</h1>
          <p className="muted">{meta.internship?.title}</p>
        </div>
      </div>
      <div className="chat-box">
        {messages.length ? (
          <div className="chat-messages">
            {messages.map((m) => (
              <div
                className={m.senderId === user.id ? "bubble mine" : "bubble"}
                key={m.id}
              >
                {m.text}
              </div>
            ))}
          </div>
        ) : ( <div className="empty">No messages yet. Say hello!</div>
        )}
        <form className="chat-form" onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
          />
          <button className="button">Send</button>
        </form>
      </div>
    </>
  );
}