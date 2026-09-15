#!/usr/bin/env python3
"""Christalin Mirrors — Daily Executive Briefing.

A local desktop tool: no browser, no login, no internet dependency.
Data lives in christalin_briefings.db (SQLite) next to this script.

Run with:  python3 daily_briefing.py
Requires:  Python 3.8+ with tkinter (ships with most Python installs;
           on Debian/Ubuntu, if missing: sudo apt install python3-tk)
"""

import json
import re
import sqlite3
import tkinter as tk
import tkinter.font as tkfont
from datetime import datetime, timedelta
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

APP_DIR = Path(__file__).resolve().parent
DB_PATH = APP_DIR / "christalin_briefings.db"

BRANCHES = [
    ("blr", "branch_blr", "Bengaluru"),
    ("klb", "branch_klb", "Kalaburagi"),
    ("bgm", "branch_bgm", "Belgaum"),
]

FIELD_GROUPS = [
    {"title": "Revenue & cash", "fields": [("cash", "Cash (₹)"), ("upi", "UPI (₹)"), ("card", "Card (₹)")], "subtotal": True},
    {"title": "Invoices", "fields": [("invRaised", "Raised today"), ("invPending", "Pending / unpaid")]},
    {"title": "Stock", "textarea": ("stock", "Low or out of stock (one per line)")},
    {"title": "Staff & attendance", "fields": [("staffTotal", "Total on roster"), ("staffPresent", "Present"), ("staffAbsent", "Absent"), ("staffLate", "Late")], "note": ("staffNote", "Note")},
    {"title": "Clients & reviews", "fields": [("newClients", "New clients today"), ("avgRating", "Avg. rating today")], "note": ("reviewNote", "Notable review / complaint")},
    {"title": "Appointments", "fields": [("apptDone", "Completed"), ("apptCancel", "Cancelled"), ("apptNoShow", "No-show"), ("apptTomorrow", "Tomorrow's bookings")]},
]

NUMERIC_FIELDS = {
    "cash", "upi", "card", "invRaised", "invPending", "staffTotal", "staffPresent",
    "staffAbsent", "staffLate", "newClients", "apptDone", "apptCancel", "apptNoShow", "apptTomorrow",
}

# Matches the labels in Daily-Report-Format.md, so a pasted WhatsApp message
# can be parsed straight into the form.
PARSE_LABELS = [
    ("cash", ["cash"]),
    ("upi", ["upi"]),
    ("card", ["card"]),
    ("invRaised", ["invoices raised", "invoices"]),
    ("invPending", ["invoices pending", "pending invoices"]),
    ("stock", ["stock low/out", "stock low", "stock"]),
    ("staffTotal", ["staff total", "total staff"]),
    ("staffPresent", ["staff present"]),
    ("staffAbsent", ["staff absent"]),
    ("newClients", ["new clients"]),
    ("apptDone", ["appointments done", "appts done"]),
    ("apptCancel", ["appointments cancelled", "appts cancelled"]),
    ("apptNoShow", ["appointments no-show", "appts no-show", "no-show", "no show"]),
    ("reviewNote", ["notes"]),
]

# Real numbers transcribed from the branch WhatsApp ledger photos.
# Kalaburagi uses the "Christalin Mirrors Gulbarga" ledger — Mane'a Salon is
# a separate business and is intentionally excluded. Only cash/UPI are known
# from these photos; everything else is left for daily entry going forward.
SEED = {
    "2026-09-01": {"branch_blr": {"cash": 1800, "upi": 950}, "branch_klb": {"cash": 1500, "upi": 1160}, "branch_bgm": {"cash": 3000, "upi": 1118}},
    "2026-09-02": {"branch_blr": {"cash": 0, "upi": 7020}, "branch_klb": {"cash": 2680, "upi": 6195}, "branch_bgm": {"cash": 1284, "upi": 7264}},
    "2026-09-03": {"branch_blr": {"cash": 0, "upi": 8630}, "branch_klb": {"cash": 1500, "upi": 5080}, "branch_bgm": {"cash": 13878, "upi": 16060}},
    "2026-09-04": {"branch_blr": {"cash": 2150, "upi": 3960}, "branch_klb": {"cash": 0, "upi": 1200}, "branch_bgm": {"cash": 800, "upi": 1860}},
    "2026-09-05": {"branch_blr": {"cash": 1680, "upi": 3314}, "branch_klb": {"cash": 700, "upi": 1800}, "branch_bgm": {"cash": 2020, "upi": 6314}},
    "2026-09-06": {"branch_blr": {"cash": 3200, "upi": 5140}, "branch_klb": {"cash": 3800, "upi": 3860}, "branch_bgm": {"cash": 7155, "upi": 3988}},
    "2026-09-07": {"branch_blr": {"cash": 4000, "upi": 500}, "branch_klb": {"cash": 0, "upi": 2300}, "branch_bgm": {"cash": 1288, "upi": 5868}},
    "2026-09-08": {"branch_blr": {"cash": 2500, "upi": 810}, "branch_klb": {"cash": 300, "upi": 0}, "branch_bgm": {"cash": 9845, "upi": 5555}},
    "2026-09-09": {"branch_blr": {"cash": 900, "upi": 510}},
}

COLORS = {
    "bg": "#FAF6F1",
    "surface": "#F0EAE2",
    "surface2": "#E4D8C7",
    "text": "#2A2018",
    "muted": "#7A6A5A",
    "accent": "#9B7B5E",
    "accent_dark": "#7E6249",
    "ok": "#4F7345",
    "critical": "#A3402A",
}


# ───────────────────────── helpers ─────────────────────────

def fmt_inr(n):
    n = int(round(n or 0))
    sign = "-" if n < 0 else ""
    s = str(abs(n))
    if len(s) > 3:
        last3 = s[-3:]
        rest = s[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        s = ",".join(parts) + "," + last3
    return f"₹{sign}{s}"


def weekday_label(date_str):
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return d.strftime("%A, %d %B %Y")


def pick_font(preferred):
    available = set(tkfont.families())
    for name in preferred:
        if name in available:
            return name
    return preferred[-1]


def parse_template(text):
    """Parse a 'Label: value' style WhatsApp report into form field values."""
    parsed = {}
    date_str = None
    for line in text.splitlines():
        m = re.match(r"^\s*([^:]+):\s*(.*)$", line)
        if not m:
            continue
        raw_label = m.group(1).strip().lower()
        value = m.group(2).strip()
        if raw_label == "date":
            date_str = value
            continue
        if raw_label == "branch":
            continue
        for key, patterns in PARSE_LABELS:
            if key in parsed:
                continue
            if raw_label in patterns:
                parsed[key] = value
                break
    return parsed, date_str


def ddmmyyyy_to_iso(s):
    m = re.match(r"^(\d{1,2})-(\d{1,2})-(\d{4})$", s)
    if not m:
        return None
    d, mo, y = m.groups()
    return f"{y}-{int(mo):02d}-{int(d):02d}"


# ───────────────────────── database ─────────────────────────

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS briefings (
            date TEXT PRIMARY KEY,
            prepared_by TEXT,
            flags TEXT,
            branches TEXT,
            updated_at TEXT
        )"""
    )
    conn.commit()
    return conn


def seed_if_needed(conn):
    if conn.execute("SELECT COUNT(*) FROM briefings").fetchone()[0] > 0:
        return
    for date, branches in SEED.items():
        conn.execute(
            "INSERT INTO briefings (date, prepared_by, flags, branches, updated_at) VALUES (?,?,?,?,?)",
            (date, "", "", json.dumps(branches), datetime.now().isoformat()),
        )
    conn.commit()


# ───────────────────────── scrollable frame ─────────────────────────

class ScrollFrame(tk.Frame):
    def __init__(self, parent, bg):
        super().__init__(parent, bg=bg)
        canvas = tk.Canvas(self, bg=bg, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=canvas.yview)
        self.inner = tk.Frame(canvas, bg=bg)

        self.inner.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=self.inner, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        def on_wheel(event):
            if event.num == 5 or getattr(event, "delta", 0) < 0:
                canvas.yview_scroll(1, "units")
            elif event.num == 4 or getattr(event, "delta", 0) > 0:
                canvas.yview_scroll(-1, "units")

        def bind_wheel(_):
            canvas.bind_all("<MouseWheel>", on_wheel)
            canvas.bind_all("<Button-4>", on_wheel)
            canvas.bind_all("<Button-5>", on_wheel)

        def unbind_wheel(_):
            canvas.unbind_all("<MouseWheel>")
            canvas.unbind_all("<Button-4>")
            canvas.unbind_all("<Button-5>")

        canvas.bind("<Enter>", bind_wheel)
        canvas.bind("<Leave>", unbind_wheel)


# ───────────────────────── main app ─────────────────────────

class BriefingApp:
    def __init__(self, root):
        self.root = root
        root.title("Christalin Mirrors — Daily Executive Briefing")
        root.geometry("1100x780")
        root.minsize(900, 640)
        root.configure(bg=COLORS["bg"])

        self.conn = get_conn()
        seed_if_needed(self.conn)

        self.heading_family = pick_font(["Georgia", "Times New Roman", "DejaVu Serif", "serif"])
        self.body_family = pick_font(["Segoe UI", "Helvetica", "DejaVu Sans", "Arial", "sans-serif"])
        self._setup_style()

        self.date_var = tk.StringVar(value=self._initial_date())
        self.prepared_var = tk.StringVar()
        self.status_var = tk.StringVar(value="")
        self.branch_vars = {code: {} for code, _, _ in BRANCHES}
        self._history_dates = []

        self._build_header()
        self._build_notebook()
        self._build_flags()
        self._build_history()
        self._build_footer()

        root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.load_date(self.date_var.get())
        self.refresh_history()

    # ---------- setup ----------

    def _setup_style(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("TNotebook", background=COLORS["bg"], borderwidth=0)
        style.configure("TNotebook.Tab", background=COLORS["surface"], foreground=COLORS["muted"],
                         font=(self.body_family, 10, "bold"), padding=(14, 8))
        style.map("TNotebook.Tab",
                  background=[("selected", COLORS["accent"])],
                  foreground=[("selected", "#FAF6F1")])
        style.configure("TButton", font=(self.body_family, 9, "bold"), padding=6)
        style.configure("Accent.TButton", background=COLORS["accent"], foreground="#FAF6F1")
        style.map("Accent.TButton", background=[("active", COLORS["accent_dark"])])
        style.configure("Treeview", font=(self.body_family, 9), rowheight=24,
                         background=COLORS["surface"], fieldbackground=COLORS["surface"])
        style.configure("Treeview.Heading", font=(self.body_family, 9, "bold"),
                         background=COLORS["surface2"], foreground=COLORS["accent"])
        style.configure("TEntry", padding=4)

    def _initial_date(self):
        today = datetime.now().strftime("%Y-%m-%d")
        if self.conn.execute("SELECT 1 FROM briefings WHERE date=?", (today,)).fetchone():
            return today
        row = self.conn.execute("SELECT MAX(date) FROM briefings").fetchone()
        return row[0] if row and row[0] else today

    # ---------- header ----------

    def _build_header(self):
        header = tk.Frame(self.root, bg=COLORS["bg"])
        header.pack(fill="x", padx=20, pady=(16, 8))

        brand = tk.Frame(header, bg=COLORS["bg"])
        brand.pack(side="left", anchor="w")
        tk.Label(brand, text="Christalin Mirrors", font=(self.heading_family, 22, "bold"),
                 fg=COLORS["text"], bg=COLORS["bg"]).pack(anchor="w")
        tk.Label(brand, text="DAILY EXECUTIVE BRIEFING · LOCAL", font=(self.body_family, 10, "bold"),
                 fg=COLORS["accent"], bg=COLORS["bg"]).pack(anchor="w")
        self.weekday_lbl = tk.Label(brand, text="", font=(self.body_family, 10),
                                     fg=COLORS["muted"], bg=COLORS["bg"])
        self.weekday_lbl.pack(anchor="w", pady=(2, 0))

        controls = tk.Frame(header, bg=COLORS["bg"])
        controls.pack(side="right", anchor="e")

        date_row = tk.Frame(controls, bg=COLORS["bg"])
        date_row.pack(anchor="e")
        ttk.Button(date_row, text="◀", width=3, command=self.prev_day).pack(side="left")
        date_entry = ttk.Entry(date_row, textvariable=self.date_var, width=12, justify="center")
        date_entry.pack(side="left", padx=4)
        date_entry.bind("<Return>", lambda e: self.load_date(self.date_var.get()))
        ttk.Button(date_row, text="▶", width=3, command=self.next_day).pack(side="left")

        prep_row = tk.Frame(controls, bg=COLORS["bg"])
        prep_row.pack(anchor="e", pady=(6, 0))
        tk.Label(prep_row, text="Prepared by", font=(self.body_family, 9),
                 fg=COLORS["muted"], bg=COLORS["bg"]).pack(side="left", padx=(0, 6))
        ttk.Entry(prep_row, textvariable=self.prepared_var, width=18).pack(side="left")

        btn_row = tk.Frame(controls, bg=COLORS["bg"])
        btn_row.pack(anchor="e", pady=(8, 0))
        ttk.Button(btn_row, text="Copy for WhatsApp", command=self.copy_whatsapp).pack(side="left", padx=4)
        ttk.Button(btn_row, text="Export summary", command=self.export_summary).pack(side="left", padx=4)
        ttk.Button(btn_row, text="Save briefing", style="Accent.TButton", command=self.save_briefing).pack(side="left", padx=4)

        tk.Label(controls, textvariable=self.status_var, font=(self.body_family, 9),
                 fg=COLORS["muted"], bg=COLORS["bg"]).pack(anchor="e", pady=(6, 0))

    # ---------- notebook / tabs ----------

    def _build_notebook(self):
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=20, pady=(0, 8))

        all_tab = tk.Frame(self.notebook, bg=COLORS["bg"])
        self.notebook.add(all_tab, text="All Branches")
        self._build_all_tab(all_tab)

        for code, bid, name in BRANCHES:
            tab = tk.Frame(self.notebook, bg=COLORS["bg"])
            self.notebook.add(tab, text=name)
            self._build_branch_tab(tab, code, name)

    def _build_all_tab(self, parent):
        strip = tk.Frame(parent, bg=COLORS["surface2"])
        strip.pack(fill="x", pady=(14, 14), padx=4)
        stats = [("revenue", "Total revenue", "₹"), ("invoices", "Invoices raised", ""),
                 ("staff", "Staff present", ""), ("clients", "New clients", ""),
                 ("appts", "Appointments done", "")]
        self.stat_labels = {}
        self.stat_delta_label = None
        for i, (key, cap, prefix) in enumerate(stats):
            cell = tk.Frame(strip, bg=COLORS["surface2"])
            cell.grid(row=0, column=i, padx=18, pady=14, sticky="n")
            val_lbl = tk.Label(cell, text=prefix + "0", font=(self.heading_family, 22, "bold"),
                                fg=COLORS["accent"], bg=COLORS["surface2"])
            val_lbl.pack()
            if key == "revenue":
                self.stat_delta_label = tk.Label(cell, text="", font=(self.body_family, 9, "bold"),
                                                  bg=COLORS["surface2"], fg=COLORS["ok"])
                self.stat_delta_label.pack()
            tk.Label(cell, text=cap.upper(), font=(self.body_family, 8, "bold"),
                     fg=COLORS["muted"], bg=COLORS["surface2"]).pack(pady=(2, 0))
            self.stat_labels[key] = val_lbl
        for i in range(len(stats)):
            strip.grid_columnconfigure(i, weight=1)

        columns = ("branch", "revenue", "invoices", "staff", "clients", "appts", "stock")
        headings = {"branch": "Branch", "revenue": "Revenue", "invoices": "Invoices", "staff": "Staff",
                    "clients": "New clients", "appts": "Appts (done/cxl/no-show)", "stock": "Stock alerts"}
        widths = {"branch": 110, "revenue": 110, "invoices": 90, "staff": 80, "clients": 90, "appts": 190, "stock": 100}
        self.tree = ttk.Treeview(parent, columns=columns, show="headings", height=4)
        for c in columns:
            self.tree.heading(c, text=headings[c])
            self.tree.column(c, width=widths[c], anchor="w" if c == "branch" else "center")
        self.tree.pack(fill="x", padx=4, pady=(0, 10))

    def _build_branch_tab(self, parent, code, name):
        scroll = ScrollFrame(parent, COLORS["bg"])
        scroll.pack(fill="both", expand=True)
        container = scroll.inner

        tk.Label(container, text=name, font=(self.heading_family, 16, "bold"),
                 fg=COLORS["text"], bg=COLORS["bg"]).pack(anchor="w", padx=8, pady=(10, 6))

        paste_frame = tk.LabelFrame(container, text="Fill from WhatsApp text", font=(self.body_family, 9, "bold"),
                                     fg=COLORS["accent"], bg=COLORS["surface2"], bd=1, relief="solid", labelanchor="nw")
        paste_frame.pack(fill="x", padx=8, pady=6)
        tk.Label(paste_frame, text="Paste the branch's standard-format message, then click Fill from text.",
                 font=(self.body_family, 8), fg=COLORS["muted"], bg=COLORS["surface2"],
                 wraplength=820, justify="left").pack(anchor="w", padx=8, pady=(4, 2))
        paste_text = tk.Text(paste_frame, height=4, bg=COLORS["bg"], fg=COLORS["text"],
                              font=(self.body_family, 9), wrap="word", relief="flat",
                              highlightthickness=1, highlightbackground=COLORS["muted"])
        paste_text.pack(fill="x", padx=8, pady=4)
        ttk.Button(paste_frame, text="Fill from text",
                   command=lambda: self.fill_from_text(code, paste_text)).pack(anchor="e", padx=8, pady=(0, 8))

        grid = tk.Frame(container, bg=COLORS["bg"])
        grid.pack(fill="both", expand=True, padx=8, pady=4)
        grid.grid_columnconfigure(0, weight=1, uniform="col")
        grid.grid_columnconfigure(1, weight=1, uniform="col")

        row = col = 0
        for group in FIELD_GROUPS:
            card = tk.LabelFrame(grid, text=group["title"], font=(self.body_family, 9, "bold"),
                                  fg=COLORS["accent"], bg=COLORS["surface"], bd=1, relief="solid", labelanchor="nw")
            card.grid(row=row, column=col, sticky="nsew", padx=6, pady=6)
            self._build_group_body(card, code, group)
            col += 1
            if col > 1:
                col = 0
                row += 1

    def _build_group_body(self, card, code, group):
        if "textarea" in group:
            key, label = group["textarea"]
            tk.Label(card, text=label, font=(self.body_family, 8), fg=COLORS["muted"],
                     bg=COLORS["surface"]).pack(anchor="w", padx=10, pady=(8, 2))
            txt = tk.Text(card, height=3, bg=COLORS["bg"], fg=COLORS["text"], font=(self.body_family, 9),
                          wrap="word", relief="flat", highlightthickness=1, highlightbackground=COLORS["muted"])
            txt.pack(fill="x", padx=10, pady=(0, 10))
            txt.bind("<KeyRelease>", lambda e: self.recompute())
            self.branch_vars[code][key] = txt
            return

        for key, label in group["fields"]:
            row = tk.Frame(card, bg=COLORS["surface"])
            row.pack(fill="x", padx=10, pady=3)
            tk.Label(row, text=label, font=(self.body_family, 9), fg=COLORS["muted"],
                     bg=COLORS["surface"]).pack(side="left")
            var = tk.StringVar()
            var.trace_add("write", lambda *a: self.recompute())
            ttk.Entry(row, textvariable=var, width=10, justify="right").pack(side="right")
            self.branch_vars[code][key] = var

        if "note" in group:
            key, label = group["note"]
            tk.Label(card, text=label, font=(self.body_family, 8), fg=COLORS["muted"],
                     bg=COLORS["surface"]).pack(anchor="w", padx=10, pady=(6, 2))
            txt = tk.Text(card, height=2, bg=COLORS["bg"], fg=COLORS["text"], font=(self.body_family, 9),
                          wrap="word", relief="flat", highlightthickness=1, highlightbackground=COLORS["muted"])
            txt.pack(fill="x", padx=10, pady=(0, 8))
            self.branch_vars[code][key] = txt

        if group.get("subtotal"):
            sub_row = tk.Frame(card, bg=COLORS["surface"])
            sub_row.pack(fill="x", padx=10, pady=(4, 10))
            tk.Label(sub_row, text="Subtotal", font=(self.body_family, 9, "bold"),
                     fg=COLORS["text"], bg=COLORS["surface"]).pack(side="left")
            lbl = tk.Label(sub_row, text="₹0", font=(self.heading_family, 12, "bold"),
                            fg=COLORS["accent"], bg=COLORS["surface"])
            lbl.pack(side="right")
            self.branch_vars[code]["__subtotal_label"] = lbl

    # ---------- flags / history / footer ----------

    def _build_flags(self):
        frame = tk.LabelFrame(self.root, text="For the CEO — Flags & action items", font=(self.body_family, 9, "bold"),
                               fg=COLORS["accent"], bg=COLORS["surface2"], bd=1, relief="solid", labelanchor="nw")
        frame.pack(fill="x", padx=20, pady=(0, 8))
        self.flags_text = tk.Text(frame, height=3, bg=COLORS["bg"], fg=COLORS["text"], font=(self.body_family, 9),
                                  wrap="word", relief="flat", highlightthickness=1, highlightbackground=COLORS["muted"])
        self.flags_text.pack(fill="x", padx=10, pady=8)
        tk.Label(frame, text="One item per line. This is the part she actually reads — keep it to what needs her decision.",
                 font=(self.body_family, 8), fg=COLORS["muted"], bg=COLORS["surface2"]).pack(anchor="w", padx=10, pady=(0, 8))

    def _build_history(self):
        frame = tk.LabelFrame(self.root, text="Briefing history (double-click to open)", font=(self.body_family, 9, "bold"),
                               fg=COLORS["accent"], bg=COLORS["surface"], bd=1, relief="solid", labelanchor="nw")
        frame.pack(fill="x", padx=20, pady=(0, 8))
        self.history_list = tk.Listbox(frame, height=5, bg=COLORS["bg"], fg=COLORS["text"],
                                       font=(self.body_family, 9), relief="flat", highlightthickness=0,
                                       activestyle="none", selectbackground=COLORS["accent"])
        self.history_list.pack(fill="x", padx=10, pady=8)
        self.history_list.bind("<Double-Button-1>", self.on_history_select)

    def _build_footer(self):
        tk.Label(self.root, text="Stored locally in christalin_briefings.db — nothing leaves this machine.  "
                                  "Standard branch report format: Daily-Report-Format.md",
                 font=(self.body_family, 8), fg=COLORS["muted"], bg=COLORS["bg"]).pack(pady=(0, 12))

    # ---------- field get/set ----------

    def get_field(self, code, key):
        widget = self.branch_vars[code].get(key)
        if widget is None:
            return ""
        if isinstance(widget, tk.StringVar):
            return widget.get()
        if isinstance(widget, tk.Text):
            return widget.get("1.0", "end").strip()
        return ""

    def set_field(self, code, key, value):
        widget = self.branch_vars[code].get(key)
        if widget is None:
            return
        if isinstance(widget, tk.StringVar):
            widget.set("" if value in (None, 0, "") else str(value))
        elif isinstance(widget, tk.Text):
            widget.delete("1.0", "end")
            if value:
                widget.insert("1.0", str(value))

    def num(self, code, key):
        try:
            return float(self.get_field(code, key) or 0)
        except ValueError:
            return 0.0

    def branch_data(self, code):
        data = {}
        for group in FIELD_GROUPS:
            if "textarea" in group:
                key, _ = group["textarea"]
                data[key] = self.get_field(code, key)
                continue
            for key, _ in group["fields"]:
                data[key] = self.num(code, key) if key in NUMERIC_FIELDS else self.get_field(code, key)
            if "note" in group:
                key, _ = group["note"]
                data[key] = self.get_field(code, key)
        return data

    def set_branch_data(self, code, data):
        data = data or {}
        for group in FIELD_GROUPS:
            if "textarea" in group:
                key, _ = group["textarea"]
                self.set_field(code, key, data.get(key, ""))
                continue
            for key, _ in group["fields"]:
                self.set_field(code, key, data.get(key, ""))
            if "note" in group:
                key, _ = group["note"]
                self.set_field(code, key, data.get(key, ""))

    # ---------- compute ----------

    def recompute(self):
        total_rev = total_inv = total_staff_p = total_staff_t = total_clients = total_appt = 0
        rows = []
        for code, bid, name in BRANCHES:
            d = self.branch_data(code)
            sub = (d.get("cash", 0) or 0) + (d.get("upi", 0) or 0) + (d.get("card", 0) or 0)
            lbl = self.branch_vars[code].get("__subtotal_label")
            if lbl:
                lbl.config(text=fmt_inr(sub))
            total_rev += sub
            total_inv += d.get("invRaised", 0) or 0
            total_staff_p += d.get("staffPresent", 0) or 0
            total_staff_t += d.get("staffTotal", 0) or 0
            total_clients += d.get("newClients", 0) or 0
            total_appt += d.get("apptDone", 0) or 0
            stock_count = len([l for l in (d.get("stock", "") or "").splitlines() if l.strip()])
            rows.append((name, sub, d, stock_count))

        self.stat_labels["revenue"].config(text=fmt_inr(total_rev).replace("₹", ""))
        self.stat_labels["invoices"].config(text=str(int(total_inv)))
        self.stat_labels["staff"].config(text=f"{int(total_staff_p)}/{int(total_staff_t)}")
        self.stat_labels["clients"].config(text=str(int(total_clients)))
        self.stat_labels["appts"].config(text=str(int(total_appt)))

        self.tree.delete(*self.tree.get_children())
        for name, sub, d, stock_count in rows:
            appts = f"{int(d.get('apptDone', 0) or 0)}/{int(d.get('apptCancel', 0) or 0)}/{int(d.get('apptNoShow', 0) or 0)}"
            self.tree.insert("", "end", values=(
                name, fmt_inr(sub), int(d.get("invRaised", 0) or 0),
                f"{int(d.get('staffPresent', 0) or 0)}/{int(d.get('staffTotal', 0) or 0)}",
                int(d.get("newClients", 0) or 0), appts, stock_count,
            ))
        return total_rev

    # ---------- date navigation ----------

    def prev_day(self):
        d = datetime.strptime(self.date_var.get(), "%Y-%m-%d") - timedelta(days=1)
        self.load_date(d.strftime("%Y-%m-%d"))

    def next_day(self):
        d = datetime.strptime(self.date_var.get(), "%Y-%m-%d") + timedelta(days=1)
        self.load_date(d.strftime("%Y-%m-%d"))

    def load_date(self, date_str):
        date_str = date_str.strip()
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            messagebox.showerror("Invalid date", "Use YYYY-MM-DD format.")
            return
        self.date_var.set(date_str)
        self.weekday_lbl.config(text=weekday_label(date_str))

        row = self.conn.execute("SELECT prepared_by, flags, branches FROM briefings WHERE date=?", (date_str,)).fetchone()
        if row:
            prepared_by, flags, branches_json = row
            branches = json.loads(branches_json or "{}")
            self.prepared_var.set(prepared_by or "")
            self.flags_text.delete("1.0", "end")
            self.flags_text.insert("1.0", flags or "")
            self.status_var.set("Loaded from local database")
        else:
            branches = {}
            self.flags_text.delete("1.0", "end")
            self.status_var.set("New briefing — not yet saved")

        for code, bid, name in BRANCHES:
            self.set_branch_data(code, branches.get(bid))

        self._update_delta(date_str)
        self.recompute()

    def _update_delta(self, date_str):
        prev = (datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
        row = self.conn.execute("SELECT branches FROM briefings WHERE date=?", (prev,)).fetchone()
        if not row:
            self.stat_delta_label.config(text="")
            return
        branches = json.loads(row[0] or "{}")
        prev_total = sum((b.get("cash", 0) or 0) + (b.get("upi", 0) or 0) + (b.get("card", 0) or 0) for b in branches.values())
        current_total = self.recompute()
        if prev_total <= 0:
            self.stat_delta_label.config(text="")
            return
        pct = round((current_total - prev_total) / prev_total * 100)
        arrow = "▲ +" if pct >= 0 else "▼ "
        self.stat_delta_label.config(text=f"{arrow}{pct}% vs yesterday",
                                      fg=COLORS["ok"] if pct >= 0 else COLORS["critical"])

    # ---------- save / history ----------

    def save_briefing(self):
        date_str = self.date_var.get().strip()
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            messagebox.showerror("Invalid date", "Use YYYY-MM-DD format.")
            return
        branches = {bid: self.branch_data(code) for code, bid, _ in BRANCHES}
        prepared_by = self.prepared_var.get().strip()
        flags = self.flags_text.get("1.0", "end").strip()
        self.conn.execute(
            "INSERT INTO briefings (date, prepared_by, flags, branches, updated_at) VALUES (?,?,?,?,?) "
            "ON CONFLICT(date) DO UPDATE SET prepared_by=excluded.prepared_by, flags=excluded.flags, "
            "branches=excluded.branches, updated_at=excluded.updated_at",
            (date_str, prepared_by, flags, json.dumps(branches), datetime.now().isoformat()),
        )
        self.conn.commit()
        self.status_var.set(f"Saved · {datetime.now().strftime('%I:%M %p')}")
        self.refresh_history()

    def refresh_history(self):
        rows = self.conn.execute("SELECT date, prepared_by, branches FROM briefings ORDER BY date DESC").fetchall()
        self.history_list.delete(0, "end")
        self._history_dates = []
        if not rows:
            self.history_list.insert("end", "No briefings saved yet.")
            return
        for date, prepared_by, branches_json in rows:
            branches = json.loads(branches_json or "{}")
            total = sum((b.get("cash", 0) or 0) + (b.get("upi", 0) or 0) + (b.get("card", 0) or 0) for b in branches.values())
            label = f"{weekday_label(date)} — {fmt_inr(total)}"
            if prepared_by:
                label += f"  ({prepared_by})"
            self.history_list.insert("end", label)
            self._history_dates.append(date)

    def on_history_select(self, _event):
        sel = self.history_list.curselection()
        if not sel or not self._history_dates:
            return
        date = self._history_dates[sel[0]]
        self.load_date(date)

    # ---------- text fill / export ----------

    def fill_from_text(self, code, paste_widget):
        text = paste_widget.get("1.0", "end")
        if not text.strip():
            return
        parsed, date_str = parse_template(text)
        if date_str:
            iso = ddmmyyyy_to_iso(date_str)
            if iso:
                self.load_date(iso)
        for key, value in parsed.items():
            self.set_field(code, key, value)
        self.recompute()
        branch_name = next(name for c, _, name in BRANCHES if c == code)
        self.status_var.set(f"Filled {branch_name} from pasted text — check the fields, then Save")

    def build_summary_text(self):
        self.recompute()
        lines = [
            "*Christalin Mirrors — Daily Briefing*",
            weekday_label(self.date_var.get()),
            f"Prepared by: {self.prepared_var.get() or '—'}",
            "",
        ]
        for code, bid, name in BRANCHES:
            d = self.branch_data(code)
            sub = (d.get("cash", 0) or 0) + (d.get("upi", 0) or 0) + (d.get("card", 0) or 0)
            lines.append(f"*{name}*")
            lines.append(f"Revenue: {fmt_inr(sub)} (Cash {fmt_inr(d.get('cash', 0))} / UPI {fmt_inr(d.get('upi', 0))} / Card {fmt_inr(d.get('card', 0))})")
            lines.append(f"Invoices: {int(d.get('invRaised', 0) or 0)} raised, {int(d.get('invPending', 0) or 0)} pending")
            note = f" — {d['staffNote']}" if d.get("staffNote") else ""
            lines.append(f"Staff: {int(d.get('staffPresent', 0) or 0)}/{int(d.get('staffTotal', 0) or 0)} present{note}")
            rating = f", avg rating {d['avgRating']}" if d.get("avgRating") else ""
            lines.append(f"New clients: {int(d.get('newClients', 0) or 0)}{rating}")
            lines.append(f"Appointments: {int(d.get('apptDone', 0) or 0)} done, {int(d.get('apptCancel', 0) or 0)} cancelled, {int(d.get('apptNoShow', 0) or 0)} no-show")
            stock_lines = [l.strip() for l in (d.get("stock", "") or "").splitlines() if l.strip()]
            if stock_lines:
                lines.append("Stock: " + "; ".join(stock_lines))
            lines.append("")
        flags = [l.strip() for l in self.flags_text.get("1.0", "end").splitlines() if l.strip()]
        lines.append("*Flags for the CEO*")
        lines.append("\n".join(f"• {f}" for f in flags) if flags else "None today.")
        return "\n".join(lines)

    def copy_whatsapp(self):
        text = self.build_summary_text()
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        self.status_var.set("Copied — paste into WhatsApp")

    def export_summary(self):
        text = self.build_summary_text()
        path = filedialog.asksaveasfilename(
            defaultextension=".txt",
            initialfile=f"CM-Briefing-{self.date_var.get()}.txt",
            filetypes=[("Text file", "*.txt")],
        )
        if not path:
            return
        Path(path).write_text(text, encoding="utf-8")
        self.status_var.set(f"Exported to {Path(path).name}")

    def on_close(self):
        self.conn.close()
        self.root.destroy()


def main():
    root = tk.Tk()
    BriefingApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
