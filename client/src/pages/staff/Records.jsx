// =====================================================
// Staff Records
// Search, print, export Excel, and save PDF
// =====================================================

import { useEffect, useState } from "react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api";

function Records() {
  // =====================================================
  // Records from database
  // =====================================================

  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    department: "",
    status: "",
  });


  // =====================================================
  // Load records
  // =====================================================

  const loadRecords = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/staff/records",
        {
          params: filters,
        }
      );

      setRecords(
        response.data.records || []
      );
    } catch (error) {
      console.error(
        "Records error:",
        error
      );

      alert(
        "Could not load reservation records."
      );
    } finally {
      setLoading(false);
    }
  };


  // Load records when page opens
  useEffect(() => {
    loadRecords();
  }, []);


  // =====================================================
  // Filter change
  // =====================================================

  const handleChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]:
        event.target.value,
    });
  };


  // =====================================================
  // Format date
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };


  // =====================================================
  // Display status
  // =====================================================

  const displayStatus = (status) => {
    if (status === "released") {
      return "Borrowed";
    }

    if (!status) {
      return "—";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };


  // =====================================================
  // Export to REAL Excel .xlsx file
  // =====================================================

  const exportExcel = () => {
    if (records.length === 0) {
      alert(
        "There are no records to export."
      );

      return;
    }

    const excelData = records.map(
      (record) => ({
        "Reference Number":
          record.reference_code,

        "Borrower Name":
          record.requester_name,

        "School ID":
          record.school_id || "",

        Department:
          record.department || "",

        Subject:
          record.subject || "",

        Instructor:
          record.instructor_name || "",

        Location:
          record.location || "",

        Equipment:
          record.items || "",

        Purpose:
          record.purpose || "",

        "Start Date":
          formatDate(
            record.start_date
          ),

        "Return Date":
          formatDate(
            record.end_date
          ),

        "Start Time":
          record.start_time || "",

        "End Time":
          record.end_time || "",

        Status:
          displayStatus(
            record.status
          ),

        "Staff Message":
          record.staff_message || "",
      })
    );

    // Convert data to Excel sheet
    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    // Automatically make columns wider
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 35 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 40 },
    ];

    // Create workbook
    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Reservation Records"
    );

    // Download real .xlsx file
    XLSX.writeFile(
      workbook,
      "Equipment_Reservation_Records.xlsx"
    );
  };


  // =====================================================
  // Save REAL PDF file
  // =====================================================

  const exportPDF = () => {
    if (records.length === 0) {
      alert(
        "There are no records to save as PDF."
      );

      return;
    }

    // Landscape gives more room for the table
    const document = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // PDF title
    document.setFontSize(18);

    document.text(
      "University of Cebu - LM",
      14,
      15
    );

    document.setFontSize(13);

    document.text(
      "Computer Maintenance Office",
      14,
      22
    );

    document.setFontSize(16);

    document.text(
      "Equipment Reservation Records",
      14,
      31
    );

    document.setFontSize(9);

    document.text(
      `Generated: ${new Date().toLocaleString(
        "en-PH"
      )}`,
      14,
      38
    );

    // PDF table
    autoTable(document, {
      startY: 44,

      head: [
        [
          "Reference",
          "Borrower",
          "Department",
          "Equipment",
          "Start",
          "Return",
          "Status",
        ],
      ],

      body: records.map(
        (record) => [
          record.reference_code ||
            "—",

          record.requester_name ||
            "—",

          record.department ||
            "—",

          record.items || "—",

          formatDate(
            record.start_date
          ),

          formatDate(
            record.end_date
          ),

          displayStatus(
            record.status
          ),
        ]
      ),

      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },

      headStyles: {
        fontStyle: "bold",
      },

      columnStyles: {
        0: {
          cellWidth: 32,
        },

        1: {
          cellWidth: 38,
        },

        2: {
          cellWidth: 40,
        },

        3: {
          cellWidth: 55,
        },

        4: {
          cellWidth: 28,
        },

        5: {
          cellWidth: 28,
        },

        6: {
          cellWidth: 25,
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    });

    // Download PDF
    document.save(
      "Equipment_Reservation_Records.pdf"
    );
  };


  // =====================================================
  // Print records
  // =====================================================

  const printRecords = () => {
    window.print();
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="animate-fade-up">

      {/* =================================================
          Header
          ================================================= */}

      <div className="mb-8">

        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Soft Copy Records
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Records
        </h1>

        <p className="mt-2 text-slate-500">
          Search, print, save, and export
          reservation history.
        </p>

      </div>


      {/* =================================================
          Filters
          ================================================= */}

      <div className="no-print mb-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">

        <div className="grid gap-4 md:grid-cols-4">

          {/* From Date */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              From Date
            </label>

            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleChange}
              className="
                w-full rounded-xl
                border border-slate-200
                bg-slate-50
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:bg-white
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>


          {/* To Date */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              To Date
            </label>

            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleChange}
              className="
                w-full rounded-xl
                border border-slate-200
                bg-slate-50
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:bg-white
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>


          {/* Department */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Department
            </label>

            <input
              type="text"
              name="department"
              value={
                filters.department
              }
              onChange={handleChange}
              placeholder="All departments"
              className="
                w-full rounded-xl
                border border-slate-200
                bg-slate-50
                px-4 py-3
                outline-none
                transition
                focus:border-blue-500
                focus:bg-white
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>


          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Status
            </label>

            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="
                w-full rounded-xl
                border border-slate-200
                bg-slate-50
                px-4 py-3
                outline-none
              "
            >
              <option value="">
                All Statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="finalized">
                Finalized
              </option>

              <option value="released">
                Borrowed
              </option>

              <option value="returned">
                Returned
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

        </div>


        {/* =================================================
            Actions
            ================================================= */}

        <div className="mt-6 flex flex-wrap gap-3">

          <button
            onClick={loadRecords}
            className="
              rounded-xl
              bg-blue-600
              px-5 py-3
              text-sm font-bold
              text-white
              transition
              hover:bg-blue-700
            "
          >
            Search Records
          </button>


          <button
            onClick={printRecords}
            className="
              rounded-xl
              border border-slate-200
              bg-white
              px-5 py-3
              text-sm font-bold
              text-slate-700
              transition
              hover:bg-slate-50
            "
          >
            Print
          </button>


          <button
            onClick={exportExcel}
            className="
              rounded-xl
              border border-emerald-200
              bg-emerald-50
              px-5 py-3
              text-sm font-bold
              text-emerald-700
              transition
              hover:bg-emerald-100
            "
          >
            Export Excel
          </button>


          <button
            onClick={exportPDF}
            className="
              rounded-xl
              border border-red-200
              bg-red-50
              px-5 py-3
              text-sm font-bold
              text-red-700
              transition
              hover:bg-red-100
            "
          >
            Save PDF
          </button>

        </div>

      </div>


      {/* =================================================
          Records Table
          ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

        {/* Table Heading */}
        <div className="border-b border-slate-100 px-6 py-5">

          <h2 className="text-xl font-black text-slate-900">
            Reservation History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {records.length} record
            {records.length !== 1
              ? "s"
              : ""}
          </p>

        </div>


        {loading ? (
          <div className="p-14 text-center">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading records...
            </p>

          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-blue-50/60">

                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Reference
                  </th>

                  <th className="px-6 py-4">
                    Borrower
                  </th>

                  <th className="px-6 py-4">
                    Department
                  </th>

                  <th className="px-6 py-4">
                    Equipment
                  </th>

                  <th className="px-6 py-4">
                    Schedule
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {records.map(
                  (record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">
                        {
                          record.reference_code
                        }
                      </td>


                      <td className="px-6 py-4">

                        <p className="font-bold text-slate-900">
                          {
                            record.requester_name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {record.school_id ||
                            "No School ID"}
                        </p>

                      </td>


                      <td className="px-6 py-4 text-sm text-slate-600">
                        {
                          record.department
                        }
                      </td>


                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {record.items ||
                          "—"}
                      </td>


                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(
                          record.start_date
                        )}
                        {" – "}
                        {formatDate(
                          record.end_date
                        )}
                      </td>


                      <td className="px-6 py-4">

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {displayStatus(
                            record.status
                          )}
                        </span>

                      </td>

                    </tr>
                  )
                )}


                {records.length === 0 && (
                  <tr>

                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      No reservation records found.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Records;