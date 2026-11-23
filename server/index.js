import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import multer from "multer";
import { connectDatabase } from "./config/database.js";
import Application from "./models/Application.js";
import Audit from "./models/Audit.js";
import Internship from "./models/Internship.js";
import Message from "./models/Message.js";
import Report from "./models/Report.js";
import User from "./models/User.js";
<<<<<<< HEAD
import Complaint from "./models/Complaint.js";
import { publicUser, requireAuth, requireRole, signUser } from "./middleware/auth.js";
=======
import {
  publicUser,
  requireAuth,
  requireRole,
  signUser,
} from "./middleware/auth.js";
>>>>>>> upstream/main
import { saveProof } from "./services/uploads.js";
import { id, withId } from "./utils/serialize.js";


const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});
const serverRoot = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "6mb" }));
app.use("/uploads", express.static(path.resolve(serverRoot, "../uploads")));

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
const data = (res, value, status = 200) =>
  res.status(status).json({ data: value });

async function bootstrapAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  if (await User.exists({ email })) return;
  await User.create({
    role: "admin",
    name: process.env.ADMIN_NAME || "Administrator",
    email,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
  });
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const { role, name, email, password } = req.body;
    if (!["student", "employer"].includes(role))
      return res.status(400).json({ message: "Choose a valid account type." });
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({
        message: "Name, email, and a six-character password are required.",
      });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail }))
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    const user = await User.create({
      role,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      ...(role === "student"
        ? { college: "", bio: "", skills: [], github: "" }
        : {
            verificationStatus: "unverified",
            companyName: "",
            website: "",
            linkedin: "",
            registrationType: "CIN",
            registrationNumber: "",
            proof: "",
          }),
    });
    data(res, { user: publicUser(user), token: signUser(user) }, 201);
  }),
);

app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const { email, password, expectedRole } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
      return res.status(401).json({ message: "Invalid email or password." });
    if (expectedRole && user.role !== expectedRole)
      return res
        .status(403)
        .json({ message: `This account is for the ${user.role} profile.` });
    data(res, { user: publicUser(user), token: signUser(user) });
  }),
);

app.get(
  "/api/auth/session",
  requireAuth,
  asyncRoute(async (req, res) => data(res, publicUser(req.user))),
);
app.post("/api/auth/logout", (req, res) => data(res, true));

app.get(
  "/api/users",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) =>
    data(res, (await User.find()).map(publicUser)),
  ),
);
app.patch(
  "/api/users/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    if (req.user.role !== "admin" && id(req.user) !== req.params.id)
      return res.status(403).json({ message: "You cannot edit this account." });
    const updates = { ...req.body };
    delete updates.password;
    delete updates.passwordHash;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found." });
    data(res, publicUser(user));
  }),
);

app.post(
  "/api/employers/:id/verification",
  requireAuth,
  requireRole("employer"),
  asyncRoute(async (req, res) => {
    if (id(req.user) !== req.params.id)
      return res
        .status(403)
        .json({ message: "You cannot update this employer." });
    const { proof, proofName, proofType, ...details } = req.body;
    let storedProof = {};
    if (proof?.startsWith("data:")) {
      const [, encoded] = proof.split(",");
      storedProof = await saveProof({
        data: Buffer.from(encoded, "base64"),
        filename: proofName || "proof-document",
        mimetype: proofType || "application/octet-stream",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...details,
        ...storedProof,
        verificationStatus: "pending",
        rejectionReason: "",
      },
      { new: true, runValidators: true },
    );
    data(res, publicUser(user));
  }),
);

app.patch(
  "/api/employers/:id/status",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const { status, rejectionReason = "" } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status, rejectionReason },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "Employer not found." });
    await Audit.create({
      action: status === "approved" ? "Approved employer" : "Rejected employer",
      target: id(user),
      actor: id(req.user),
      reason: rejectionReason,
    });
    data(res, publicUser(user));
  }),
);

app.patch(
  "/api/employers/:id/suspension",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const { status = "suspended" } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true },
    );
    if (status === "suspended")
      await Internship.updateMany(
        { employerId: req.params.id },
        { status: "closed" },
      );
    await Audit.create({
      action:
        status === "suspended" ? "Suspended employer" : "Reinstated employer",
      target: id(user),
      actor: id(req.user),
    });
    data(res, publicUser(user));
  }),
);

app.get(
  "/api/internships",
  asyncRoute(async (req, res) => {
    const {
      q = "",
      skill = "",
      sort = "match",
      studentSkills = "",
    } = req.query;
    const skills = studentSkills ? String(studentSkills).split(",") : [];
    const users = await User.find({ role: "employer" }).lean();
    let internships = await Internship.find({ status: "open" }).lean();
    let result = internships.map((item) => {
      const employer = users.find((user) => id(user) === id(item.employerId));
      const match = skills.length
        ? Math.round(
            (item.requiredSkills.filter((value) =>
              skills.some(
                (skillValue) =>
                  skillValue.toLowerCase() === value.toLowerCase(),
              ),
            ).length /
              item.requiredSkills.length) *
              100,
          )
        : null;
      return {
        ...withId(item),
        employerId: id(item.employerId),
        company: employer?.companyName || "Startup",
        match,
      };
    });
    const term = q.toLowerCase();
    if (term)
      result = result.filter((item) =>
        `${item.title} ${item.description} ${item.company} ${item.requiredSkills.join(" ")}`
          .toLowerCase()
          .includes(term),
      );
    if (skill)
      result = result.filter((item) => item.requiredSkills.includes(skill));
    result.sort((a, b) =>
      sort === "stipend"
        ? b.stipend - a.stipend
        : (b.match ?? 0) - (a.match ?? 0),
    );
    data(res, result);
  }),
);

app.get(
  "/api/internships/:id",
  asyncRoute(async (req, res) => {
    const item = await Internship.findById(req.params.id).lean();
    if (!item)
      return res.status(404).json({ message: "Internship not found." });
    const employer = await User.findById(item.employerId).lean();
    data(res, {
      ...withId(item),
      employerId: id(item.employerId),
      company: employer?.companyName || "Startup",
      employer: employer ? publicUser(employer) : null,
    });
  }),
);

app.get(
  "/api/employers/:id/internships",
  requireAuth,
  asyncRoute(async (req, res) => {
    const internships = await Internship.find({
      employerId: req.params.id,
    }).lean();
    data(
      res,
      internships.map((item) => ({
        ...withId(item),
        employerId: id(item.employerId),
      })),
    );
  }),
);
app.post(
  "/api/internships",
  requireAuth,
  requireRole("employer"),
  asyncRoute(async (req, res) => {
    if (req.user.verificationStatus !== "approved")
      return res
        .status(403)
        .json({ message: "Only approved employers can post internships." });
    const item = await Internship.create({
      ...req.body,
      employerId: req.user._id,
      status: "open",
    });
    data(res, { ...withId(item), employerId: id(item.employerId) }, 201);
  }),
);
app.patch(
  "/api/internships/:id",
  requireAuth,
  requireRole("employer"),
  asyncRoute(async (req, res) => {
    const item = await Internship.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user._id },
      req.body,
      { new: true },
    );
    if (!item)
      return res.status(404).json({ message: "Internship not found." });
    data(res, { ...withId(item), employerId: id(item.employerId) });
  }),
);

app.get(
  "/api/applications",
  requireAuth,
  asyncRoute(async (req, res) => {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.internshipId) filter.internshipId = req.query.internshipId;
    let applications = await Application.find(filter)
      .populate("studentId")
      .populate("internshipId")
      .lean();
    if (req.query.employerId)
      applications = applications.filter(
        (item) => id(item.internshipId?.employerId) === req.query.employerId,
      );
    data(
      res,
      applications.map((item) => ({
        ...withId(item),
        studentId: id(item.studentId),
        internshipId: id(item.internshipId),
        student: item.studentId ? publicUser(item.studentId) : null,
        internship: item.internshipId ? withId(item.internshipId) : null,
      })),
    );
  }),
);
app.post(
  "/api/applications",
  requireAuth,
  requireRole("student"),
  asyncRoute(async (req, res) => {
    if (
      await Application.exists({
        studentId: req.user._id,
        internshipId: req.body.internshipId,
      })
    )
      return res.status(409).json({ message: "You have already applied." });
    const application = await Application.create({
      ...req.body,
      studentId: req.user._id,
      status: "Applied",
    });
    data(
      res,
      {
        ...withId(application),
        studentId: id(application.studentId),
        internshipId: id(application.internshipId),
      },
      201,
    );
  }),
);
app.patch(
  "/api/applications/:id",
  requireAuth,
  requireRole("employer"),
  asyncRoute(async (req, res) => {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    data(res, {
      ...withId(application),
      studentId: id(application.studentId),
      internshipId: id(application.internshipId),
    });
  }),
);

// ===============================
// COMPLAINT MANAGEMENT APIs
// ===============================

// 1. Student submits a complaint
app.post(
  "/api/complaints",
  requireAuth,
  requireRole("student"),
  asyncRoute(async (req, res) => {
    const { subject, category, description } = req.body;

    if (
      typeof subject !== "string" ||
      typeof category !== "string" ||
      typeof description !== "string" ||
      subject.trim().length < 5 ||
      description.trim().length < 20
    ) {
      return res.status(400).json({
        message: "Enter a valid subject and description (at least 20 characters).",
      });
    }

    const complaint = await Complaint.create({
      studentId: req.user._id,
      subject: subject.trim(),
      category,
      description: description.trim(),
    });

    data(res, withId(complaint), 201);
  }),
);

// 2. Student views their own complaints
app.get(
  "/api/complaints/my",
  requireAuth,
  requireRole("student"),
  asyncRoute(async (req, res) => {
    const complaints = await Complaint.find({
      studentId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    data(res, complaints.map(withId));
  }),
);

// 3. Admin views all complaints
app.get(
  "/api/complaints",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const complaints = await Complaint.find()
      .populate("studentId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    data(res, complaints.map(withId));
  }),
);

// 4. Admin updates complaint status and response
app.patch(
  "/api/complaints/:id",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const { status, adminResponse } = req.body;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
      "Rejected",
    ];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid complaint status.",
      });
    }

    if (
      adminResponse !== undefined &&
      (typeof adminResponse !== "string" ||
        adminResponse.trim().length > 2000)
    ) {
      return res.status(400).json({
        message: "Admin response must be 2000 characters or fewer.",
      });
    }

    if (status === undefined && adminResponse === undefined) {
      return res.status(400).json({
        message: "Provide a status or admin response to update.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    if (status !== undefined) {
      complaint.status = status;
    }

    if (adminResponse !== undefined) {
      complaint.adminResponse = adminResponse.trim();
      complaint.respondedBy = req.user._id;
      complaint.respondedAt = new Date();
    }

    await complaint.save();

    data(res, withId(complaint));
  }),
);

app.get("/api/reports", requireAuth, requireRole("admin"), asyncRoute(async (req, res) => data(res, (await Report.find().sort({ createdAt: -1 }).lean()).map(withId))));
app.post("/api/reports", requireAuth, requireRole("student"), asyncRoute(async (req, res) => data(res, withId(await Report.create({ ...req.body, studentId: req.user._id, status: "Open" })), 201)));
app.get(
  "/api/reports",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) =>
    data(res, (await Report.find().sort({ createdAt: -1 }).lean()).map(withId)),
  ),
);
app.post(
  "/api/reports",
  requireAuth,
  requireRole("student"),
  asyncRoute(async (req, res) =>
    data(
      res,
      withId(
        await Report.create({
          ...req.body,
          studentId: req.user._id,
          status: "Open",
        }),
      ),
      201,
    ),
  ),
);
app.patch(
  "/api/reports/:id",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) => {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    data(res, withId(report));
  }),
);
app.get(
  "/api/audit",
  requireAuth,
  requireRole("admin"),
  asyncRoute(async (req, res) =>
    data(res, (await Audit.find().sort({ createdAt: -1 }).lean()).map(withId)),
  ),
);

app.get(
  "/api/messages",
  requireAuth,
  asyncRoute(async (req, res) => {
    const filter =
      req.user.role === "student"
        ? { studentId: req.user._id }
        : { employerId: req.user._id };
    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate("studentId")
      .populate("employerId")
      .populate("internshipId")
      .lean();
    const byConversation = {};
    for (const item of messages) {
      const key = `${id(item.internshipId)}:${id(item.studentId)}`;
      if (!byConversation[key]) {
        byConversation[key] = {
          internshipId: id(item.internshipId),
          internship: item.internshipId ? withId(item.internshipId) : null,
          student: item.studentId ? publicUser(item.studentId) : null,
          employer: item.employerId ? publicUser(item.employerId) : null,
          lastMessage: null,
          unread: 0,
        };
      }
      const conversation = byConversation[key];
      conversation.lastMessage = {
        text: item.text,
        senderId: id(item.senderId),
        createdAt: item.createdAt,
        read: item.read,
      };
      if (id(item.senderId) !== id(req.user) && !item.read)
        conversation.unread += 1;
    }
    data(
      res,
      Object.values(byConversation).sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt),
      ),
    );
  }),
);

app.get(
  "/api/messages/history",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { internshipId, userId } = req.query;
    if (!internshipId || !userId)
      return res
        .status(400)
        .json({ message: "Internship and user are required." });
    const filter =
      req.user.role === "student"
        ? { studentId: req.user._id, employerId: userId, internshipId }
        : { employerId: req.user._id, studentId: userId, internshipId };
    if (req.user.role === "student") {
      if (
        !(await Application.exists({ studentId: req.user._id, internshipId }))
      )
        return res
          .status(403)
          .json({ message: "Apply to this internship before messaging." });
    } else {
      const internship = await Internship.findById(internshipId).lean();
      if (!internship || id(internship.employerId) !== id(req.user))
        return res
          .status(403)
          .json({ message: "This internship is not yours." });
      if (!(await Application.exists({ studentId: userId, internshipId })))
        return res
          .status(403)
          .json({ message: "This student has not applied." });
    }
    const history = await Message.find(filter).sort({ createdAt: 1 }).lean();
    data(
      res,
      history.map((item) => ({
        ...withId(item),
        senderId: id(item.senderId),
        studentId: id(item.studentId),
        employerId: id(item.employerId),
        internshipId: id(item.internshipId),
      })),
    );
  }),
);

app.post(
  "/api/messages",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { internshipId, receiverId, text } = req.body;
    if (!internshipId || !receiverId || !text?.trim())
      return res
        .status(400)
        .json({ message: "Receiver and message text are required." });
    if (!["student", "employer"].includes(req.user.role))
      return res
        .status(403)
        .json({ message: "Only students and employers can message." });
    if (req.user.role === "student") {
      const internship = await Internship.findById(internshipId).lean();
      if (!internship || id(internship.employerId) !== receiverId)
        return res
          .status(403)
          .json({ message: "That employer does not own this internship." });
      if (
        !(await Application.exists({ studentId: req.user._id, internshipId }))
      )
        return res
          .status(403)
          .json({ message: "Apply to this internship before messaging." });
      const message = await Message.create({
        studentId: req.user._id,
        employerId: receiverId,
        internshipId,
        senderId: req.user._id,
        text: text.trim(),
      });
      return data(res, withId(message), 201);
    }
    const internship = await Internship.findById(internshipId).lean();
    if (!internship || id(internship.employerId) !== id(req.user))
      return res.status(403).json({ message: "This internship is not yours." });
    if (!(await Application.exists({ studentId: receiverId, internshipId })))
      return res.status(403).json({ message: "This student has not applied." });
    const message = await Message.create({
      studentId: receiverId,
      employerId: req.user._id,
      internshipId,
      senderId: req.user._id,
      text: text.trim(),
    });
    data(res, withId(message), 201);
  }),
);

app.patch(
  "/api/messages/read",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { internshipId, userId } = req.body;
    const filter =
      req.user.role === "student"
        ? {
            studentId: req.user._id,
            employerId: userId,
            internshipId,
            senderId: { $ne: req.user._id },
          }
        : {
            employerId: req.user._id,
            studentId: userId,
            internshipId,
            senderId: { $ne: req.user._id },
          };
    await Message.updateMany(filter, { read: true });
    data(res, true);
  }),
);

app.use((error, req, res, next) => {
  console.error(error);
  res
    .status(error.status || 500)
    .json({ message: error.message || "Server error." });
});

const port = Number(process.env.PORT || 4000);
const { memoryServer } = await connectDatabase();
await bootstrapAdmin();
app.listen(port, () =>
  console.log(`SkillSangam API listening on http://localhost:${port}`),
);
process.on("SIGINT", async () => process.exit(0));
process.on("SIGTERM", async () => process.exit(0));
