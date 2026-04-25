import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createOrg } from "../api";
import Navbar from "../components/Navbar";

function CreateOrgPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setError("Organization name is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createOrg({
        name: trimmedName,
        description: formData.description.trim(),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong while creating the organization.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page page--narrow">
        <section>
          <h1>Create your organization</h1>
        </section>

        <form className="panel form-stack" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <label htmlFor="name">
            Organization name
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Product Team"
              autoComplete="organization"
              required
            />
          </label>

          <label htmlFor="description">
            Description
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What does this organization work on?"
              rows="4"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create organization"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateOrgPage;
