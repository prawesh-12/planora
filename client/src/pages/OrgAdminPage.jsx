import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getOrg, inviteMember, removeMember } from "../api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function getEntityId(entity) {
  if (!entity) return "";
  return typeof entity === "string" ? entity : entity._id;
}

function OrgAdminPage() {
  const { id, orgId } = useParams();
  const organizationId = orgId || id;
  const { user } = useAuth();

  const [org, setOrg] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadOrg() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await getOrg(organizationId);
        setOrg(res.data.org);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load organization details.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      loadOrg();
    }
  }, [organizationId]);

  const ownerId = getEntityId(org?.owner);
  const currentUserId = getEntityId(user);
  const isOwner = useMemo(
    () => Boolean(ownerId && currentUserId && ownerId === currentUserId),
    [ownerId, currentUserId],
  );

  const members = org?.members || [];
  const invites = org?.invites || [];

  const handleInvite = async (event) => {
    event.preventDefault();

    const trimmedEmail = inviteEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Invite email is required.");
      setSuccess("");
      return;
    }

    try {
      setSubmittingInvite(true);
      setError("");
      setSuccess("");

      const res = await inviteMember(organizationId, { email: trimmedEmail });

      setOrg(res.data.org);
      setInviteEmail("");
      setSuccess(`${trimmedEmail} was added to pending invites.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to invite member.");
      setSuccess("");
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRemoveMember = async (member) => {
    const memberId = getEntityId(member);

    if (!memberId || memberId === ownerId) {
      return;
    }

    try {
      setRemovingMemberId(memberId);
      setError("");
      setSuccess("");

      const res = await removeMember(organizationId, memberId);

      setOrg(res.data.org);
      setSuccess(`${member.email || member.username || "Member"} was removed.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member.");
      setSuccess("");
    } finally {
      setRemovingMemberId("");
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Organization Admin</p>
            <h1>{org?.name || "Manage members"}</h1>
          </div>
        </div>

        {error && <p className="alert alert--error">{error}</p>}
        {success && <p className="alert alert--success">{success}</p>}

        {loading ? (
          <section className="empty-state">
            <h2>Loading organization...</h2>
            <p>Fetching members and pending invites.</p>
          </section>
        ) : !org ? (
          <section className="empty-state">
            <h2>Organization not found</h2>
            <p>You may not have access to this organization.</p>
          </section>
        ) : !isOwner ? (
          <section className="empty-state">
            <h2>Owner access required</h2>
            <p>
              Only the organization owner can manage members and pending
              invites.
            </p>
            <Link className="primary-link" to="/dashboard">
              Go to dashboard
            </Link>
          </section>
        ) : (
          <section className="admin-layout">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Members</h2>
                  <p className="muted">
                    {members.length} member{members.length === 1 ? "" : "s"} in
                    this organization.
                  </p>
                </div>
                <span className="muted">Owner controls</span>
              </div>

              {members.length === 0 ? (
                <div className="empty-state">
                  <p>No members found for this organization.</p>
                </div>
              ) : (
                <ul className="member-list">
                  {members.map((member) => {
                    const memberId = getEntityId(member);
                    const memberIsOwner = memberId === ownerId;

                    return (
                      <li className="member-row" key={memberId}>
                        <div>
                          <strong>{member.username || "Unnamed user"}</strong>
                          <p className="muted">
                            {member.email || "No email available"}
                          </p>
                          {memberIsOwner && (
                            <span className="member-badge">Owner</span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="secondary-button"
                          disabled={
                            memberIsOwner || removingMemberId === memberId
                          }
                          onClick={() => handleRemoveMember(member)}
                        >
                          {removingMemberId === memberId
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <aside className="panel">
              <div className="panel-header">
                <div>
                  <h2>Invite member</h2>
                </div>
              </div>

              <form className="stack" onSubmit={handleInvite}>
                <label htmlFor="invite-email">
                  Email address
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={submittingInvite || !inviteEmail.trim()}
                >
                  {submittingInvite ? "Inviting..." : "Invite"}
                </button>
              </form>

              <div className="pending-invites">
                <h3>Pending invites</h3>

                {invites.length === 0 ? (
                  <p className="muted">No pending invites yet.</p>
                ) : (
                  <ul>
                    {invites.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

export default OrgAdminPage;
