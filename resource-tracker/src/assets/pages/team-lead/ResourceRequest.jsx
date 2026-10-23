import { useState } from "react";
import { FileText, Users,RotateCcw,ChevronRight,X,} from "lucide-react";

import "./ResourceRequest.css";

const initialForm = {
  itemName: "",
  quantity: "",
  estimatedPrice: "",
  supplier: "",
  department: "",
  purposeType: "",
  team: "",
  project: "",
  date: new Date().toISOString().slice(0, 10),
  justification: "",
};

function ResourceRequest() {
  const [form, setForm] = useState(initialForm);
  const [showReview, setShowReview] = useState(false);

  
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  
  function handleReset() {
    setForm({
      ...initialForm,
      date: new Date().toISOString().slice(0, 10),
    });

    setShowReview(false);
  }

  
  function handleReview(event) {
    event.preventDefault();
    setShowReview(true);
  }

  return (
    <div className="resource-request">
      <h1 className="page-title">Create Resource Request</h1>

      <form onSubmit={handleReview}>
        {}
        <section className="request-card">
          <div className="request-section-heading">
            <FileText size={30} />

            <div>
              <h2>Resource Details</h2>
              <p>Enter the resource item details</p>
            </div>
          </div>

          <div className="request-grid">
            <div className="request-field">
              <label htmlFor="itemName">Item Name</label>

              <input
                id="itemName"
                name="itemName"
                type="text"
                placeholder="e.g. Laptop, Projector"
                value={form.itemName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="request-field">
              <label htmlFor="quantity">Quantity</label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="request-field">
              <label htmlFor="estimatedPrice">
                Estimated Price (MWK)
              </label>

              <input
                id="estimatedPrice"
                name="estimatedPrice"
                type="number"
                min="0"
                placeholder="e.g. 150000"
                value={form.estimatedPrice}
                onChange={handleChange}
                required
              />
            </div>

            <div className="request-field">
              <label htmlFor="supplier">
                Supplier <span>(Optional)</span>
              </label>

              <input
                id="supplier"
                name="supplier"
                type="text"
                placeholder="e.g. XYZ Company"
                value={form.supplier}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {}
        <section className="request-card">
          <div className="request-section-heading">
            <Users size={30} />

            <div>
              <h2>Request Information</h2>
              <p>
                Select the relevant department, project and team
              </p>
            </div>
          </div>

          <div className="request-grid">
            <div className="request-field">
              <label htmlFor="department">Department</label>

              <select
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
              >
                <option value="">Select department</option>
                <option value="Finance">Finance</option>
                <option value="Information Technology">
                  Information Technology
                </option>
                <option value="Human Resources">
                  Human Resources
                </option>
                <option value="Operations">Operations</option>
                <option value="Procurement">Procurement</option>
              </select>
            </div>

            <div className="request-field">
              <label htmlFor="purposeType">Request Purpose</label>

              <select
                id="purposeType"
                name="purposeType"
                value={form.purposeType}
                onChange={handleChange}
                required
              >
                <option value="">Select purpose</option>
                <option value="New Purchase">New Purchase</option>
                <option value="Replacement">Replacement</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Project Support">Project Support</option>
              </select>
            </div>

            <div className="request-field">
              <label htmlFor="team">Requesting Team</label>

              <select
                id="team"
                name="team"
                value={form.team}
                onChange={handleChange}
                required
              >
                <option value="">Select team</option>
                <option value="Development Team">
                  Development Team
                </option>
                <option value="Finance Team">Finance Team</option>
                <option value="Administration Team">
                  Administration Team
                </option>
                <option value="ICT Support Team">
                  ICT Support Team
                </option>
              </select>
            </div>

            <div className="request-field">
              <label htmlFor="date">Request Date</label>

              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="request-field">
              <label htmlFor="project">Project</label>

              <select
                id="project"
                name="project"
                value={form.project}
                onChange={handleChange}
                required
              >
                <option value="">Select project</option>
                <option value="Website Development">
                  Website Development
                </option>
                <option value="Infrastructure Upgrade">
                  Infrastructure Upgrade
                </option>
                <option value="Office Operations">
                  Office Operations
                </option>
                <option value="Digital Transformation">
                  Digital Transformation
                </option>
              </select>
            </div>
          </div>

          {}
          <div className="request-field justification-field">
            <label htmlFor="justification">
              Purpose / Justification
            </label>

            <textarea
              id="justification"
              name="justification"
              placeholder="Explain why this resource is needed..."
              value={form.justification}
              onChange={handleChange}
              maxLength={300}
              required
            />

            <div className="character-count">
              {form.justification.length}/300 characters
            </div>
          </div>

          {}
          <div className="request-actions">
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
            >
              <RotateCcw size={19} />
              Reset
            </button>

            <button type="submit" className="review-button">
              Review Request
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
      </form>

      {}
      {showReview && (
        <div className="review-backdrop">
          <section
            className="review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-heading"
          >
            <button
              type="button"
              className="close-review"
              onClick={() => setShowReview(false)}
              aria-label="Close review"
            >
              <X size={22} />
            </button>

            <h2 id="review-heading">Review Resource Request</h2>

            <p>Please check your information before proceeding.</p>

            <div className="review-information">
              <p>
                <strong>Item:</strong> {form.itemName}
              </p>

              <p>
                <strong>Quantity:</strong> {form.quantity}
              </p>

              <p>
                <strong>Estimated Price:</strong>{" "}
                MWK {Number(form.estimatedPrice).toLocaleString()}
              </p>

              <p>
                <strong>Supplier:</strong>{" "}
                {form.supplier || "Not provided"}
              </p>

              <p>
                <strong>Department:</strong> {form.department}
              </p>

              <p>
                <strong>Purpose:</strong> {form.purposeType}
              </p>

              <p>
                <strong>Team:</strong> {form.team}
              </p>

              <p>
                <strong>Project:</strong> {form.project}
              </p>

              <p>
                <strong>Date:</strong> {form.date}
              </p>

              <p>
                <strong>Justification:</strong> {form.justification}
              </p>
            </div>

            <button
              type="button"
              className="review-button"
              onClick={() => setShowReview(false)}
            >
              Back to Edit
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default ResourceRequest;