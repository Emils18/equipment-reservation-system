// =====================================================
// REPAIR ROOM - EQUIPMENT INVENTORY
// CMOB Department
// =====================================================
//
// Features:
// ✓ Create / View / Edit equipment
// ✓ Archive / Restore / Permanent Delete
// ✓ Real-time Socket.IO refresh
// ✓ Search by name, asset code, category, description
// ✓ Automatic Category filter
// ✓ Active / Archived visibility
// ✓ Full-screen ModalPortal
//
// =====================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../services/api";
import socket from "../../services/socket";

import ModalPortal from "../../components/ModalPortal";


const EMPTY_FORM = {
  name: "",
  category: "",
  asset_code: "",
  description: "",
  condition_status:
    "good",
};


function Items() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messageType,
    setMessageType,
  ] = useState(
    "success"
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    modalMode,
    setModalMode,
  ] = useState(
    "create"
  );

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_FORM,
  });


  // ===================================================
  // LOAD INVENTORY
  // ===================================================

  const loadItems =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (
            !silent
          ) {
            setLoading(
              true
            );
          }

          const response =
            await api.get(
              "/items"
            );

          setItems(
            response.data
              .items ||
              []
          );
        } catch (error) {
          console.error(
            "Load items error:",
            error
          );

          setMessage(
            "Could not load equipment."
          );

          setMessageType(
            "error"
          );
        } finally {
          if (
            !silent
          ) {
            setLoading(
              false
            );
          }
        }
      },
      []
    );


  useEffect(() => {
    loadItems();

    const handleEquipmentUpdated =
      () => {
        loadItems(
          true
        );
      };

    socket.on(
      "equipment_updated",
      handleEquipmentUpdated
    );

    return () => {
      socket.off(
        "equipment_updated",
        handleEquipmentUpdated
      );
    };
  }, [
    loadItems,
  ]);


  // ===================================================
  // FILTERS
  // ===================================================

  const categories =
    useMemo(
      () =>
        [
          ...new Set(
            items
              .map(
                (
                  item
                ) =>
                  item.category
                    ?.trim()
              )
              .filter(
                Boolean
              )
          ),
        ].sort(
          (
            a,
            b
          ) =>
            a.localeCompare(
              b
            )
        ),
      [
        items,
      ]
    );


  const filteredItems =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (
          item
        ) => {
          const matchesCategory =
            !categoryFilter ||
            item.category ===
              categoryFilter;

          if (
            !matchesCategory
          ) {
            return false;
          }

          if (
            !query
          ) {
            return true;
          }

          const haystack = [
            item.name,
            item.asset_code,
            item.category,
            item.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );
    }, [
      items,
      search,
      categoryFilter,
    ]);


  const filtersActive =
    Boolean(
      search.trim() ||
      categoryFilter
    );


  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
  };


  // ===================================================
  // FORM / MODAL
  // ===================================================

  const showMessage =
    (
      text,
      type = "success"
    ) => {
      setMessage(
        text
      );

      setMessageType(
        type
      );
    };


  const handleChange =
    (
      event
    ) => {
      const {
        name,
        value,
      } =
        event.target;

      setForm(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            value,
        })
      );
    };


  const openCreate = () => {
    setModalMode(
      "create"
    );

    setSelectedItem(
      null
    );

    setForm({
      ...EMPTY_FORM,
    });

    setShowModal(
      true
    );
  };


  const openView = (
    item
  ) => {
    setModalMode(
      "view"
    );

    setSelectedItem(
      item
    );

    setShowModal(
      true
    );
  };


  const openEdit = (
    item
  ) => {
    setModalMode(
      "edit"
    );

    setSelectedItem(
      item
    );

    setForm({
      name:
        item.name ||
        "",

      category:
        item.category ||
        "",

      asset_code:
        item.asset_code ||
        "",

      description:
        item.description ||
        "",

      condition_status:
        item.condition_status ||
        "good",
    });

    setShowModal(
      true
    );
  };


  const closeModal = () => {
    if (
      saving
    ) {
      return;
    }

    setShowModal(
      false
    );

    setSelectedItem(
      null
    );
  };


  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      try {
        setSaving(
          true
        );

        if (
          modalMode ===
          "create"
        ) {
          await api.post(
            "/items",
            form
          );

          showMessage(
            "Equipment created successfully."
          );
        } else {
          await api.put(
            `/items/${selectedItem.id}`,
            form
          );

          showMessage(
            "Equipment updated successfully."
          );
        }

        setShowModal(
          false
        );

        setSelectedItem(
          null
        );

        await loadItems(
          true
        );
      } catch (error) {
        showMessage(
          error.response
            ?.data
            ?.message ||
            "Could not save equipment.",

          "error"
        );
      } finally {
        setSaving(
          false
        );
      }
    };


  // ===================================================
  // INVENTORY ACTIONS
  // ===================================================

  const archiveItem =
    async (
      item
    ) => {
      if (
        !window.confirm(
          `Archive "${item.name}"?\n\nIt will disappear from the borrower side, but can be restored later.`
        )
      ) {
        return;
      }

      try {
        const response =
          await api.patch(
            `/items/${item.id}/archive`
          );

        showMessage(
          response.data
            .message ||
            "Equipment archived."
        );

        await loadItems(
          true
        );
      } catch (error) {
        showMessage(
          error.response
            ?.data
            ?.message ||
            "Could not archive equipment.",

          "error"
        );
      }
    };


  const restoreItem =
    async (
      item
    ) => {
      try {
        const response =
          await api.patch(
            `/items/${item.id}/restore`
          );

        showMessage(
          response.data
            .message ||
            "Equipment restored."
        );

        await loadItems(
          true
        );
      } catch (error) {
        showMessage(
          error.response
            ?.data
            ?.message ||
            "Could not restore equipment.",

          "error"
        );
      }
    };


  const deleteItem =
    async (
      item
    ) => {
      if (
        !window.confirm(
          `Permanently delete "${item.name}"?\n\nThis cannot be undone.`
        )
      ) {
        return;
      }

      if (
        !window.confirm(
          `Are you absolutely sure?\n\n"${item.name}" will be permanently removed.`
        )
      ) {
        return;
      }

      try {
        const response =
          await api.delete(
            `/items/${item.id}`
          );

        showMessage(
          response.data
            .message ||
            "Equipment deleted."
        );

        await loadItems(
          true
        );
      } catch (error) {
        showMessage(
          error.response
            ?.data
            ?.message ||
            "Could not permanently delete equipment.",

          "error"
        );
      }
    };


  // ===================================================
  // STYLES
  // ===================================================

  const conditionStyle =
    (
      condition
    ) => {
      if (
        condition ===
        "good"
      ) {
        return "bg-emerald-100 text-emerald-700";
      }

      if (
        condition ===
        "damaged"
      ) {
        return "bg-red-100 text-red-700";
      }

      return "bg-amber-100 text-amber-700";
    };


  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="animate-fade-up">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
            Repair Room Inventory
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Equipment Items
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Manage CMOB Department equipment available for reservation.
          </p>

        </div>


        <button
          type="button"
          onClick={
            openCreate
          }
          className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          + Create Equipment
        </button>

      </div>


      {/* FILTER BAR */}

      <div className="mb-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          <div className="relative flex-1">

            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              ⌕
            </span>

            <input
              type="search"
              value={
                search
              }
              onChange={
                (
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Search name, asset code, category or description..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

          </div>


          <select
            value={
              categoryFilter
            }
            onChange={
              (
                event
              ) =>
                setCategoryFilter(
                  event.target.value
                )
            }
            className="min-w-52 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >

            <option value="">
              All Categories
            </option>

            {categories.map(
              (
                category
              ) => (
                <option
                  key={
                    category
                  }
                  value={
                    category
                  }
                >
                  {
                    category
                  }
                </option>
              )
            )}

          </select>


          {filtersActive && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Clear
            </button>
          )}

        </div>


        <p className="mt-3 text-xs font-semibold text-slate-500">
          Showing{" "}
          <strong className="text-slate-800">
            {
              filteredItems.length
            }
          </strong>
          {" "}
          of{" "}
          <strong className="text-slate-800">
            {
              items.length
            }
          </strong>
          {" "}
          equipment item
          {
            items.length ===
            1
              ? ""
              : "s"
          }.
        </p>

      </div>


      {/* MESSAGE */}

      {message && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${
            messageType ===
            "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {
            message
          }
        </div>
      )}


      {/* DESKTOP TABLE */}

      <div className="hidden overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm md:block">

        {loading ? (

          <Loading />

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[900px] w-full">

              <thead className="bg-blue-50">

                <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">

                  <th className="px-5 py-4">
                    Equipment
                  </th>

                  <th className="px-5 py-4">
                    Asset Code
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Condition
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {filteredItems.map(
                  (
                    item
                  ) => (
                    <tr
                      key={
                        item.id
                      }
                      className="transition hover:bg-blue-50/60"
                    >

                      <td className="px-5 py-5">

                        <p className="font-bold text-slate-900">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 max-w-xs truncate text-sm text-slate-500">
                          {
                            item.description ||
                            "No description"
                          }
                        </p>

                      </td>


                      <td className="px-5 py-5 font-mono text-sm text-slate-600">
                        {
                          item.asset_code ||
                          "—"
                        }
                      </td>


                      <td className="px-5 py-5 text-sm font-semibold text-slate-600">
                        {
                          item.category ||
                          "Uncategorized"
                        }
                      </td>


                      <td className="px-5 py-5">

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${conditionStyle(
                            item.condition_status
                          )}`}
                        >
                          {
                            item.condition_status
                          }
                        </span>

                      </td>


                      <td className="px-5 py-5">

                        {
                          item.is_active
                            ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                Active
                              </span>
                            )
                            : (
                              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                                Archived
                              </span>
                            )
                        }

                      </td>


                      <td className="px-5 py-5">

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={
                              () =>
                                openView(
                                  item
                                )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={
                              () =>
                                openEdit(
                                  item
                                )
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>

                          {
                            item.is_active
                              ? (
                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      archiveItem(
                                        item
                                      )
                                  }
                                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600"
                                >
                                  Archive
                                </button>
                              )
                              : (
                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      restoreItem(
                                        item
                                      )
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                                >
                                  Restore
                                </button>
                              )
                          }

                          <button
                            type="button"
                            onClick={
                              () =>
                                deleteItem(
                                  item
                                )
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}


                {filteredItems.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan="6"
                      className="px-6 py-14 text-center"
                    >

                      <p className="font-bold text-slate-700">
                        No equipment matches your search.
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try another name, asset code or category.
                      </p>

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* MOBILE CARDS */}

      <div className="space-y-3 md:hidden">

        {
          loading
            ? (
              <Loading />
            )
            : filteredItems.map(
                (
                  item
                ) => (
                  <article
                    key={
                      item.id
                    }
                    className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate font-black text-slate-900">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 font-mono text-xs text-blue-600">
                          {
                            item.asset_code ||
                            "No asset code"
                          }
                        </p>

                      </div>


                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {
                          item.is_active
                            ? "Active"
                            : "Archived"
                        }
                      </span>

                    </div>


                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">

                      <MiniInfo
                        label="Category"
                        value={
                          item.category ||
                          "Uncategorized"
                        }
                      />

                      <MiniInfo
                        label="Condition"
                        value={
                          item.condition_status
                        }
                      />

                    </div>


                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={
                          () =>
                            openView(
                              item
                            )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={
                          () =>
                            openEdit(
                              item
                            )
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Edit
                      </button>

                      {
                        item.is_active
                          ? (
                            <button
                              type="button"
                              onClick={
                                () =>
                                  archiveItem(
                                    item
                                  )
                              }
                              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white"
                            >
                              Archive
                            </button>
                          )
                          : (
                            <button
                              type="button"
                              onClick={
                                () =>
                                  restoreItem(
                                    item
                                  )
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
                            >
                              Restore
                            </button>
                          )
                      }

                    </div>

                  </article>
                )
              )
        }


        {!loading &&
        filteredItems.length ===
          0 && (
          <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">

            <p className="font-bold text-slate-700">
              No equipment matches your search.
            </p>

          </div>
        )}

      </div>


      {/* =================================================
          MODAL
          ================================================= */}

      <ModalPortal
        open={
          showModal
        }
        onClose={
          closeModal
        }
        locked={
          saving
        }
        maxWidth="max-w-2xl"
      >

        {/* HEADER */}

        <div className="border-b border-blue-100 bg-blue-50 px-5 py-5 sm:px-7">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
                REPAIR ROOM • CMOB DEPARTMENT
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">

                {
                  modalMode ===
                  "create"
                    ? "Create Equipment"
                    : modalMode ===
                        "edit"
                      ? "Edit Equipment"
                      : "Equipment Details"
                }

              </h2>

            </div>


            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                closeModal
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-2xl text-slate-400 hover:border-blue-200 hover:text-slate-700"
            >
              ×
            </button>

          </div>

        </div>


        {/* VIEW */}

        {
          modalMode ===
            "view" &&
          selectedItem && (
            <>

              <div className="modal-scroll max-h-[calc(100dvh-12rem)] overflow-y-auto p-5 sm:p-7">

                <div className="grid gap-5 rounded-2xl border border-blue-100 bg-slate-50 p-5 sm:grid-cols-2">

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

                  <div className="sm:col-span-2">

                    <Detail
                      title="Description"
                      value={
                        selectedItem.description
                      }
                    />

                  </div>

                </div>

              </div>


              <div className="border-t border-blue-100 bg-white p-5 sm:px-7">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700"
                >
                  Close
                </button>

              </div>

            </>
          )
        }


        {/* CREATE / EDIT */}

        {
          modalMode !==
            "view" && (
            <form
              onSubmit={
                handleSubmit
              }
              autoComplete="off"
            >

              {/* Helps reduce unwanted browser/password-manager autofill. */}
              <input
                type="text"
                name="fake_username"
                autoComplete="username"
                className="hidden"
                tabIndex="-1"
              />

              <input
                type="password"
                name="fake_password"
                autoComplete="new-password"
                className="hidden"
                tabIndex="-1"
              />


              <div className="modal-scroll max-h-[calc(100dvh-15rem)] overflow-y-auto p-5 sm:p-7">

                <div className="grid gap-4 sm:grid-cols-2">

                  <Field label="Item Name">

                    <input
                      type="text"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: Epson Projector"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      required
                      className={
                        inputClass
                      }
                    />

                  </Field>


                  <Field label="Category">

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
                      list="equipment-categories"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      className={
                        inputClass
                      }
                    />

                    <datalist id="equipment-categories">

                      {
                        categories.map(
                          (
                            category
                          ) => (
                            <option
                              key={
                                category
                              }
                              value={
                                category
                              }
                            />
                          )
                        )
                      }

                    </datalist>

                  </Field>


                  <Field label="Asset Code">

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
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      required
                      className={
                        inputClass
                      }
                    />

                  </Field>


                  <Field label="Condition">

                    <select
                      name="condition_status"
                      value={
                        form.condition_status
                      }
                      onChange={
                        handleChange
                      }
                      className={
                        inputClass
                      }
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

                  </Field>


                  <div className="sm:col-span-2">

                    <Field label="Description">

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
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        className={`${inputClass} resize-none`}
                      />

                    </Field>

                  </div>

                </div>

              </div>


              <div className="border-t border-blue-100 bg-white p-5 sm:px-7">

                <div className="flex flex-col-reverse gap-3 sm:flex-row">

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      closeModal
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="flex-1 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {
                      saving
                        ? "Saving..."
                        : modalMode ===
                            "create"
                          ? "Create Equipment"
                          : "Save Changes"
                    }
                  </button>

                </div>

              </div>

            </form>
          )
        }

      </ModalPortal>

    </div>
  );
}


function Loading() {
  return (
    <div className="p-12 text-center">

      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

      <p className="mt-4 text-sm font-semibold text-slate-500">
        Loading equipment...
      </p>

    </div>
  );
}


function Field({
  label,
  children,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </label>

      {
        children
      }

    </div>
  );
}


function Detail({
  title,
  value,
}) {
  return (
    <div>

      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {
          title
        }
      </p>

      <p className="mt-1 break-words font-semibold capitalize text-slate-800">
        {
          value ||
          "—"
        }
      </p>

    </div>
  );
}


function MiniInfo({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {
          label
        }
      </p>

      <p className="mt-1 capitalize font-semibold text-slate-700">
        {
          value ||
          "—"
        }
      </p>

    </div>
  );
}


const inputClass = `
  w-full
  rounded-xl
  border
  border-slate-200
  bg-slate-50
  px-4
  py-3
  text-slate-900
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-blue-500
  focus:bg-white
  focus:ring-4
  focus:ring-blue-100
`;


export default Items;
