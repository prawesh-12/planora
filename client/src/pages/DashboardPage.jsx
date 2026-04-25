import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { createBoard, getBoards, getOrgs } from "../api";
import BoardCard from "../components/BoardCard";
import Navbar from "../components/Navbar";

function DashboardPage() {
  const [orgs, setOrgs] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState("");
  const [boards, setBoards] = useState([]);
  const [boardName, setBoardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrgs() {
      try {
        setLoading(true);
        setError("");

        const res = await getOrgs();
        const nextOrgs = res.data.orgs || [];

        setOrgs(nextOrgs);

        if (nextOrgs.length > 0) {
          const savedOrgId = localStorage.getItem("activeOrgId");
          const nextActiveOrg =
            nextOrgs.find((org) => org._id === savedOrgId) || nextOrgs[0];

          setActiveOrgId(nextActiveOrg._id);
          localStorage.setItem("activeOrgId", nextActiveOrg._id);
        } else {
          setActiveOrgId("");
          localStorage.removeItem("activeOrgId");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load organizations");
      } finally {
        setLoading(false);
      }
    }

    loadOrgs();
  }, []);

  useEffect(() => {
    async function loadBoards() {
      if (!activeOrgId) {
        setBoards([]);
        return;
      }

      try {
        setError("");

        const res = await getBoards(activeOrgId);
        setBoards(res.data.boards || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load boards");
      }
    }

    loadBoards();
  }, [activeOrgId]);

  const handleCreateBoard = async (event) => {
    event.preventDefault();

    const trimmedName = boardName.trim();

    if (!trimmedName || !activeOrgId) {
      return;
    }

    try {
      setCreatingBoard(true);
      setError("");

      const res = await createBoard({
        name: trimmedName,
        orgId: activeOrgId,
      });

      setBoards((currentBoards) => [res.data.board, ...currentBoards]);
      setBoardName("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create board");
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleActiveOrgChange = (event) => {
    const nextOrgId = event.target.value;

    setActiveOrgId(nextOrgId);
    localStorage.setItem("activeOrgId", nextOrgId);
  };

  const activeOrg = orgs.find((org) => org._id === activeOrgId);

  return (
    <div className="app-page">
      <Navbar />

      <main className="page-shell">
        <div className="page-header">
          <div>
            <h1>Your boards</h1>
          </div>

          {orgs.length > 0 && (
            <label className="field field--compact">
              <span>Active organization</span>
              <select value={activeOrgId} onChange={handleActiveOrgChange}>
                {orgs.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <p className="alert alert--error">{error}</p>}

        {loading ? (
          <section className="empty-state">
            <h2>Loading dashboard...</h2>
            <p>Fetching your organizations and boards.</p>
          </section>
        ) : orgs.length === 0 ? (
          <section className="empty-state">
            <h2>No organizations yet</h2>
            <p>Create your first organization before adding boards.</p>
            <Link className="primary-link" to="/org/new">
              Create organization
            </Link>
          </section>
        ) : (
          <>
            <section className="dashboard-toolbar">
              <div className="dashboard-toolbar__org">
                <h2>{activeOrg?.name || "Selected organization"}</h2>
                <p>{activeOrg?.description || "No description added yet."}</p>
                {activeOrgId && (
                  <Link className="text-link" to={`/org/${activeOrgId}/admin`}>
                    Manage members and invites
                  </Link>
                )}
              </div>

              <form className="inline-form" onSubmit={handleCreateBoard}>
                <input
                  type="text"
                  value={boardName}
                  onChange={(event) => setBoardName(event.target.value)}
                  placeholder="New board name"
                  aria-label="New board name"
                />
                <button
                  type="submit"
                  disabled={creatingBoard || !boardName.trim()}
                >
                  {creatingBoard ? "Creating..." : "Create Board"}
                </button>
              </form>
            </section>

            {boards.length === 0 ? (
              <section className="empty-state">
                <h2>No boards yet</h2>
                <p>Create a board to start organizing your team tasks.</p>
              </section>
            ) : (
              <section className="board-grid" aria-label="Organization boards">
                {boards.map((board) => (
                  <BoardCard key={board._id} board={board} />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
