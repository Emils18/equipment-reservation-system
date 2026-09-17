// =====================================================
// Staff Equipment Page
//
// Active:
// View / Edit / Archive
//
// Archived:
// View / Edit / Restore / Delete Permanently
// =====================================================

import {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";


function Items() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("success");

  const [showModal, setShowModal] =
    useState(false);

  const [modalMode, setModalMode] =
    useState("create");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [form, setForm] =
    useState({
      name: "",
      category: "",
      asset_code: "",
      description: "",
      condition_status: "good",
    });


  // =====================================================
  // Load Equipment
  // =====================================================

  const loadItems = async () => {
    try {
      setLoading(true);

      const response =
        await api.get("/items");

      setItems(
        response.data.items || []
      );
    } catch (error) {
      console.error(
        "Load items error:",
        error
      );

      showMessage(
        "Could not load equipment.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadItems();
  }, []);


  // =====================================================
  // Messages
  // =====================================================

  const showMessage = (
    text,
    type = "success"
  ) => {
    setMessage(text);
    setMessageType(type);
  };


  // =====================================================
  // Form Change
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =====================================================
  // Create
  // =====================================================

  const openCreate = () => {
    setModalMode("create");

    setSelectedItem(null);

    setForm({
      name: "",
      category: "",
      asset_code: "",
      description: "",
      condition_status: "good",
    });

    setShowModal(true);
  };


  // =====================================================
  // View
  // =====================================================

  const openView = (item) => {
    setModalMode("view");

    setSelectedItem(item);

    setShowModal(true);
  };


  // =====================================================
  // Edit
  // =====================================================

  const openEdit = (item) => {
    setModalMode("edit");

    setSelectedItem(item);

    setForm({
      name:
        item.name || "",

      category:
        item.category || "",

      asset_code:
        item.asset_code || "",

      description:
        item.description || "",

      condition_status:
        item.condition_status ||
        "good",
    });

    setShowModal(true);
  };


  // =====================================================
  // Close Modal
  // =====================================================

  const closeModal = () => {
    setShowModal(false);

    setSelectedItem(null);
  };


  // =====================================================
  // Save Create / Edit
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      if (
        modalMode === "create"
      ) {
        await api.post(
          "/items",
          form
        );

        showMessage(
          "Equipment created successfully."
        );
      }

      if (
        modalMode === "edit"
      ) {
        await api.put(
          `/items/${selectedItem.id}`,
          form
        );

        showMessage(
          "Equipment updated successfully."
        );
      }

      closeModal();

      await loadItems();
    } catch (error) {
      console.error(
        "Save equipment error:",
        error
      );

      showMessage(
        error.response?.data?.message ||
          "Could not save equipment.",

        "error"
      );
    }
  };


  // =====================================================
  // Archive
  // =====================================================

  const archiveItem = async (
    item
  ) => {
    const confirmed =
      window.confirm(
        `Archive "${item.name}"?\n\nIt will disappear from the borrower side, but you can restore it later.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await api.patch(
          `/items/${item.id}/archive`
        );

      showMessage(
        response.data.message
      );

      await loadItems();
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Could not archive equipment.",

        "error"
      );
    }
  };


  // =====================================================
  // Restore
  // =====================================================

  const restoreItem = async (
    item
  ) => {
    try {
      const response =
        await api.patch(
          `/items/${item.id}/restore`
        );

      showMessage(
        response.data.message
      );

      await loadItems();
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Could not restore equipment.",

        "error"
      );
    }
  };


  // =====================================================
  // Permanent Delete
  // =====================================================

  const deleteItem = async (
    item
  ) => {
    const firstConfirm =
      window.confirm(
        `Permanently delete "${item.name}"?\n\nThis cannot be undone.`
      );

    if (!firstConfirm) {
      return;
    }

    const secondConfirm =
      window.confirm(
        `Are you absolutely sure?\n\n"${item.name}" will be permanently removed.`
      );

    if (!secondConfirm) {
      return;
    }

    try {
      const response =
        await api.delete(
          `/items/${item.id}`
        );

      showMessage(
        response.data.message
      );

      await loadItems();
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
          "Could not permanently delete equipment.",

        "error"
      );
    }
  };


  // =====================================================
  // Condition Style
  // =====================================================

  const getConditionStyle = (
    condition
  ) => {
    if (
      condition === "good"
    ) {
      return "bg-emerald-50 text-emerald-700";
    }

    if (
      condition === "damaged"
    ) {
      return "bg-red-50 text-red-700";
    }

    return "bg-amber-50 text-amber-700";
  };


  return (
    <div className="animate-fade-up">

      {/* =================================================
          Header
          ================================================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Inventory
          </p>

          <h1 className="mt-1 text-3xl font-black text-slate-900">
            Equipment Items
          </h1>

          <p className="mt-2 text-slate-500">
            Manage equipment available
            for reservation.
          </p>
        </div>


        <button
          onClick={openCreate}
          className="
            rounded-xl
            bg-blue-600
            px-5 py-3
            font-bold text-white
            shadow-md shadow-blue-200
            transition
            hover:bg-blue-700
          "
        >
          + Create Item
        </button>

      </div>


      {/* =================================================
          Message
          ================================================= */}

      {message && (
        <div
          className={`
            mb-6 rounded-xl
            border px-4 py-3
            text-sm font-semibold

            ${
              messageType ===
              "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-100 bg-blue-50 text-blue-700"
            }
          `}
        >
          {message}
        </div>
      )}


      {/* =================================================
          Information
          ================================================= */}

      <div className="mb-6 grid gap-4 md:grid-cols-2">

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="font-bold text-emerald-800">
            Active Equipment
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            Visible and selectable by
            borrowers.
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-bold text-slate-700">
            Archived Equipment
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Hidden from borrowers.
            Staff can restore or permanently
            delete it.
          </p>
        </div>

      </div>


      {/* =================================================
          Equipment Table
          ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-6 py-5">

          <h2 className="text-xl font-black text-slate-900">
            Current Equipment
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {items.length} equipment record
            {items.length !== 1
              ? "s"
              : ""}
          </p>

        </div>


        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading equipment...
          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-blue-50/60">

                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4">
                    Item
                  </th>

                  <th className="px-6 py-4">
                    Asset Code
                  </th>

                  <th className="px-6 py-4">
                    Condition
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {items.map(
                  (item) => (

                    <tr
                      key={item.id}
                      className={`
                        transition
                        hover:bg-slate-50

                        ${
                          !item.is_active
                            ? "bg-slate-50/60"
                            : ""
                        }
                      `}
                    >

                      {/* Item */}
                      <td className="px-6 py-5">

                        <p className="font-bold text-slate-900">
                          {item.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.category ||
                            "No category"}
                        </p>

                      </td>


                      {/* Asset Code */}
                      <td className="px-6 py-5 font-mono text-sm text-slate-700">
                        {item.asset_code ||
                          "—"}
                      </td>


                      {/* Condition */}
                      <td className="px-6 py-5">

                        <span
                          className={`
                            rounded-full
                            px-3 py-1
                            text-xs
                            font-bold
                            capitalize

                            ${getConditionStyle(
                              item.condition_status
                            )}
                          `}
                        >
                          {
                            item.condition_status
                          }
                        </span>

                      </td>


                      {/* Status */}
                      <td className="px-6 py-5">

                        {item.is_active ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                            Archived
                          </span>
                        )}

                      </td>


                      {/* Actions */}
                      <td className="px-6 py-5">

                        <div className="flex flex-wrap gap-2">

                          {/* View */}
                          <button
                            onClick={() =>
                              openView(item)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                          >
                            View
                          </button>


                          {/* Edit */}
                          <button
                            onClick={() =>
                              openEdit(item)
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>


                          {/* Active */}
                          {item.is_active ? (

                            <button
                              onClick={() =>
                                archiveItem(
                                  item
                                )
                              }
                              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600"
                            >
                              Archive
                            </button>

                          ) : (

                            <>
                              {/* Restore */}
                              <button
                                onClick={() =>
                                  restoreItem(
                                    item
                                  )
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                              >
                                Restore
                              </button>


                              {/* Permanent Delete */}
                              <button
                                onClick={() =>
                                  deleteItem(
                                    item
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </>

                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}


                {items.length === 0 && (
                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-14 text-center text-slate-500"
                    >
                      No equipment has been
                      created yet.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* =================================================
          Modal
          ================================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-black text-slate-900">

                {modalMode ===
                  "create" &&
                  "Create Equipment"}

                {modalMode ===
                  "edit" &&
                  "Edit Equipment"}

                {modalMode ===
                  "view" &&
                  "Equipment Details"}

              </h2>


              <button
                type="button"
                onClick={
                  closeModal
                }
                className="text-3xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>


            {/* =================================================
                View Mode
                ================================================= */}

            {modalMode ===
              "view" &&
              selectedItem && (

                <div className="space-y-5">

                  <Detail
                    title="Item Name"
                    value={
                      selectedItem.name
                    }
                  />

                  <Detail
                    title="Category"
                    value={
                      selectedItem.category
                    }
                  />

                  <Detail
                    title="Asset Code"
                    value={
                      selectedItem.asset_code
                    }
                  />

                  <Detail
                    title="Condition"
                    value={
                      selectedItem.condition_status
                    }
                  />

                  <Detail
                    title="Status"
                    value={
                      selectedItem.is_active
                        ? "Active"
                        : "Archived"
                    }
                  />

                  <Detail
                    title="Description"
                    value={
                      selectedItem.description
                    }
                  />

                </div>
              )}


            {/* =================================================
                Create / Edit
                ================================================= */}

            {(modalMode ===
              "create" ||
              modalMode ===
                "edit") && (

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-4"
              >

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Item Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Example: Epson Projector"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Category
                  </label>

                  <input
                    type="text"
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: Projector"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Asset Code
                  </label>

                  <input
                    type="text"
                    name="asset_code"
                    value={
                      form.asset_code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: PROJ-001"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Condition
                  </label>

                  <select
                    name="condition_status"
                    value={
                      form.condition_status
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  >
                    <option value="good">
                      Good
                    </option>

                    <option value="damaged">
                      Damaged
                    </option>

                    <option value="maintenance">
                      Maintenance
                    </option>
                  </select>
                </div>


                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="Equipment description..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>


                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  {modalMode ===
                  "create"
                    ? "Create Equipment"
                    : "Save Changes"}
                </button>

              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
}


// =====================================================
// Detail Component
// =====================================================

function Detail({
  title,
  value,
}) {
  return (
    <div>

      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-1 font-semibold capitalize text-slate-800">
        {value || "—"}
      </p>

    </div>
  );
}


export default Items;