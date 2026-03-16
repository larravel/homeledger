import { loadBills, saveBills, loadPayments, savePayments, loadUsage, saveUsage, loadTheme, saveTheme } from "./storage.js";
let editingBillId = null;
function uid() {
    return crypto.randomUUID();
}
function peso(amount) {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
}
function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function parseYMD(ymd) {
    const [y, m, day] = ymd.split("-").map(Number);
    return new Date(y, m - 1, day);
}
function formatYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function formatYM(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}
function addMonths(date, months) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setMonth(d.getMonth() + months);
    return d;
}
function daysBetween(a, b) {
    const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}
function isSameMonth(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function recomputeStatuses(bills, today = new Date()) {
    for (const bill of bills) {
        if (bill.status === "paid")
            continue;
        const due = parseYMD(bill.dueDate);
        const diff = daysBetween(today, due);
        bill.status = diff < 0 ? "overdue" : "unpaid";
    }
    return bills;
}
/** Recurring generator:
 * For each recurringGroupId, find the latest dueDate in that group.
 * If today has reached that next cycle's month, auto-create the next bill instance.
 */
function generateRecurringBills(bills, today = new Date()) {
    const groups = new Map();
    for (const b of bills) {
        if (b.isRecurring && b.recurringGroupId) {
            if (!groups.has(b.recurringGroupId))
                groups.set(b.recurringGroupId, []);
            groups.get(b.recurringGroupId).push(b);
        }
    }
    const currentYM = formatYM(today);
    for (const [groupId, groupBills] of groups.entries()) {
        // determine frequency from any bill in group
        const freq = groupBills.find(b => b.frequency)?.frequency ?? "monthly";
        const stepMonths = freq === "quarterly" ? 3 : 1;
        // latest dueDate bill
        const latest = [...groupBills].sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))[0];
        if (!latest)
            continue;
        const latestDue = parseYMD(latest.dueDate);
        const nextDue = addMonths(latestDue, stepMonths);
        const nextYM = formatYM(nextDue);
        // only generate if we have already entered the next cycle month (or beyond)
        // and if it doesn't exist yet
        if (currentYM >= nextYM) {
            const exists = bills.some(b => b.recurringGroupId === groupId && formatYM(parseYMD(b.dueDate)) === nextYM);
            if (!exists) {
                const nextBill = {
                    id: uid(),
                    name: latest.name,
                    provider: latest.provider,
                    amount: latest.amount,
                    dueDate: formatYMD(nextDue),
                    category: latest.category,
                    status: "unpaid",
                    isRecurring: true,
                    frequency: freq,
                    recurringGroupId: groupId,
                };
                bills.push(nextBill);
            }
        }
    }
    return bills;
}
function statusBadge(status) {
    if (status === "paid")
        return `<span class="badge paid">PAID</span>`;
    if (status === "overdue")
        return `<span class="badge overdue">OVERDUE</span>`;
    return `<span class="badge">UNPAID</span>`;
}
function recurringLabel(b) {
    if (!b.isRecurring)
        return `<span class="badge">NO</span>`;
    return `<span class="badge">YES (${b.frequency ?? "monthly"})</span>`;
}
function renderBills(bills) {
    const tbody = document.getElementById("billTableBody");
    if (!tbody)
        return;
    tbody.innerHTML = "";
    for (const bill of bills.sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))) {
        const tr = document.createElement("tr");
        const payBtn = bill.status === "paid"
            ? `<span class="badge paid">DONE</span>`
            : `<button class="payBtn" data-id="${bill.id}">Pay</button>`;
        const editBtn = `<button class="editBtn" data-id="${bill.id}">Edit</button>`;
        const deleteBtn = `<button class="deleteBtn" data-id="${bill.id}">Delete</button>`;
        tr.innerHTML = `
      <td>${bill.name}</td>
      <td>${bill.provider}</td>
      <td>${bill.dueDate}</td>
      <td>${peso(bill.amount)}</td>
      <td>${statusBadge(bill.status)}</td>
      <td>${recurringLabel(bill)}</td>
      <td>${payBtn} ${editBtn} ${deleteBtn}</td>
    `;
        tbody.appendChild(tr);
    }
}
function renderPayments(payments, bills) {
    const tbody = document.getElementById("paymentTableBody");
    if (!tbody)
        return;
    tbody.innerHTML = "";
    const sorted = [...payments].sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));
    for (const p of sorted) {
        const bill = bills.find(b => b.id === p.billId);
        const billName = bill ? bill.name : "(Deleted bill)";
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${billName}</td>
      <td>${p.paymentDate}</td>
      <td>${peso(p.lateFee)}</td>
      <td>${peso(p.amountPaid)}</td>
    `;
        tbody.appendChild(tr);
    }
    if (payments.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="4">No payments yet.</td>`;
        tbody.appendChild(tr);
    }
}
function renderDashboard(bills, today = new Date()) {
    const dTotalBills = document.getElementById("dTotalBills");
    const dPaid = document.getElementById("dPaid");
    const dUnpaid = document.getElementById("dUnpaid");
    const dUpcoming = document.getElementById("dUpcoming");
    const dOverdueCount = document.getElementById("dOverdueCount");
    const alertsList = document.getElementById("alertsList");
    if (!dTotalBills || !dPaid || !dUnpaid || !dUpcoming || !dOverdueCount || !alertsList)
        return;
    const monthBills = bills.filter(b => isSameMonth(parseYMD(b.dueDate), today));
    const total = monthBills.reduce((sum, b) => sum + b.amount, 0);
    const paid = monthBills.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amount, 0);
    const unpaid = monthBills.filter(b => b.status !== "paid").reduce((sum, b) => sum + b.amount, 0);
    const upcomingBills = bills.filter(b => {
        if (b.status === "paid")
            return false;
        const due = parseYMD(b.dueDate);
        const diff = daysBetween(today, due);
        return diff >= 0 && diff <= 7;
    });
    const upcomingTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    const overdueCount = bills.filter(b => b.status === "overdue").length;
    dTotalBills.textContent = peso(total);
    dPaid.textContent = peso(paid);
    dUnpaid.textContent = peso(unpaid);
    dUpcoming.textContent = peso(upcomingTotal);
    dOverdueCount.textContent = String(overdueCount);
    alertsList.innerHTML = "";
    const alerts = [];
    for (const b of bills) {
        if (b.status === "paid")
            continue;
        const due = parseYMD(b.dueDate);
        const diff = daysBetween(today, due);
        if (diff < 0)
            alerts.push(`⚠️ ${b.name} is OVERDUE (Due: ${b.dueDate})`);
        else if (diff <= 3)
            alerts.push(`⏳ ${b.name} is due in ${diff} day(s) (Due: ${b.dueDate})`);
    }
    if (alerts.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No alerts. You're all set!";
        alertsList.appendChild(li);
    }
    else {
        for (const a of alerts) {
            const li = document.createElement("li");
            li.textContent = a;
            alertsList.appendChild(li);
        }
    }
}
/* ---------------- Charts ---------------- */
function renderCategoryChart(bills) {
    const canvas = document.getElementById("categoryChart");
    if (!canvas)
        return;
    const categories = ["utility", "rent", "subscription", "loan", "insurance"];
    const totals = {
        utility: 0, rent: 0, subscription: 0, loan: 0, insurance: 0
    };
    for (const bill of bills)
        totals[bill.category] += bill.amount;
    const data = categories.map(c => totals[c]);
    const existing = window.categoryChart;
    if (existing)
        existing.destroy();
    const chart = new Chart(canvas, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{ data }]
        },
        options: { responsive: true }
    });
    window.categoryChart = chart;
}
function renderUsageSelect(bills) {
    const select = document.getElementById("usageBillSelect");
    if (!select)
        return;
    const utilities = bills.filter(b => b.category === "utility");
    // remember current selection before rebuilding list
    const previous = select.value;
    select.innerHTML = "";
    if (utilities.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No utility bills yet";
        select.appendChild(opt);
        return;
    }
    for (const b of utilities) {
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = `${b.name} (${b.provider})`;
        select.appendChild(opt);
    }
    // restore previous selection if it still exists, otherwise select first option
    if (utilities.some(u => u.id === previous)) {
        select.value = previous;
    }
    else {
        select.value = utilities[0].id;
    }
}
function renderUsageChart(usages, bills) {
    const canvas = document.getElementById("usageChart");
    const select = document.getElementById("usageBillSelect");
    if (!canvas || !select)
        return;
    const billId = select.value;
    if (!billId)
        return;
    const bill = bills.find(b => b.id === billId);
    const billName = bill ? bill.name : "Utility";
    const filtered = usages
        .filter(u => u.billId === billId)
        .sort((a, b) => (a.month > b.month ? 1 : -1));
    const labels = filtered.map(u => u.month);
    const data = filtered.map(u => u.value);
    const unit = filtered[0]?.unit ?? "";
    const existing = window.usageChart;
    if (existing)
        existing.destroy();
    const chart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                    label: `${billName} usage (${unit})`,
                    data
                }]
        },
        options: { responsive: true }
    });
    window.usageChart = chart;
}
/* ---------------- Edit Bill ---------------- */
function setEditMode(bill) {
    const title = document.getElementById("billFormTitle");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const submitBtn = document.getElementById("billSubmitBtn");
    if (!title || !cancelBtn || !submitBtn)
        return;
    if (!bill) {
        editingBillId = null;
        title.textContent = "Add Bill";
        submitBtn.textContent = "Save Bill";
        cancelBtn.style.display = "none";
        return;
    }
    editingBillId = bill.id;
    title.textContent = "Edit Bill";
    submitBtn.textContent = "Update Bill";
    cancelBtn.style.display = "inline-block";
    document.getElementById("billName").value = bill.name;
    document.getElementById("billProvider").value = bill.provider;
    document.getElementById("billAmount").value = String(bill.amount);
    document.getElementById("billDueDate").value = bill.dueDate;
    document.getElementById("billCategory").value = bill.category;
    document.getElementById("billRecurring").checked = !!bill.isRecurring;
    document.getElementById("billFrequency").value = bill.frequency ?? "monthly";
}
function resetBillForm() {
    const form = document.getElementById("billForm");
    form?.reset();
    setEditMode(null);
}
/* ---------------- CSV Export ---------------- */
function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function toCSV(rows, headers) {
    const escape = (v) => {
        const s = String(v ?? "");
        // quote if contains comma or quote or newline
        if (/[",\n]/.test(s))
            return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const lines = [];
    lines.push(headers.join(","));
    for (const r of rows) {
        lines.push(headers.map(h => escape(r[h])).join(","));
    }
    return lines.join("\n");
}
/* ---------------- Setup Handlers ---------------- */
function setupTheme() {
    const btn = document.getElementById("themeToggle");
    const theme = loadTheme();
    document.body.classList.toggle("dark", theme === "dark");
    btn?.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark");
        saveTheme(isDark ? "dark" : "light");
    });
}
function setupForm() {
    const form = document.getElementById("billForm");
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (!form)
        return;
    cancelBtn?.addEventListener("click", () => resetBillForm());
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("billName").value.trim();
        const provider = document.getElementById("billProvider").value.trim();
        const amount = Number(document.getElementById("billAmount").value);
        const dueDate = document.getElementById("billDueDate").value;
        const category = document.getElementById("billCategory").value;
        const isRecurring = document.getElementById("billRecurring").checked;
        const frequency = document.getElementById("billFrequency").value;
        if (!name || !provider || !dueDate || !Number.isFinite(amount) || amount <= 0) {
            alert("Please fill in all fields correctly.");
            return;
        }
        const bills = loadBills();
        // EDIT MODE
        if (editingBillId) {
            const bill = bills.find(b => b.id === editingBillId);
            if (!bill)
                return;
            bill.name = name;
            bill.provider = provider;
            bill.amount = amount;
            bill.dueDate = dueDate;
            bill.category = category;
            bill.isRecurring = isRecurring;
            bill.frequency = isRecurring ? frequency : undefined;
            // if newly set to recurring but no group id, assign one
            if (isRecurring && !bill.recurringGroupId)
                bill.recurringGroupId = uid();
            saveBills(bills);
            resetBillForm();
            refreshUI();
            return;
        }
        // ADD MODE
        const newBill = {
            id: uid(),
            name,
            provider,
            amount,
            dueDate,
            category,
            status: "unpaid",
            isRecurring,
            frequency: isRecurring ? frequency : undefined,
            recurringGroupId: isRecurring ? uid() : undefined,
        };
        bills.push(newBill);
        recomputeStatuses(bills);
        saveBills(bills);
        form.reset();
        refreshUI();
    });
}
function setupBillActions() {
    const tbody = document.getElementById("billTableBody");
    if (!tbody)
        return;
    tbody.addEventListener("click", (e) => {
        const target = e.target;
        const billId = target.dataset.id;
        if (!billId)
            return;
        // PAY
        if (target.classList.contains("payBtn")) {
            const bills = loadBills();
            const bill = bills.find(b => b.id === billId);
            if (!bill)
                return;
            const defaultDate = formatYMD(new Date());
            const paymentDate = prompt("Enter payment date (YYYY-MM-DD):", defaultDate);
            if (!paymentDate)
                return;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
                alert("Invalid date format. Use YYYY-MM-DD.");
                return;
            }
            const paidDate = parseYMD(paymentDate);
            const dueDate = parseYMD(bill.dueDate);
            const lateFee = paidDate > dueDate ? bill.amount * 0.05 : 0;
            const totalPaid = bill.amount + lateFee;
            bill.status = "paid";
            saveBills(bills);
            const payments = loadPayments();
            const payment = {
                id: uid(),
                billId: bill.id,
                paymentDate,
                lateFee,
                amountPaid: totalPaid,
            };
            payments.push(payment);
            savePayments(payments);
            refreshUI();
        }
        // EDIT
        if (target.classList.contains("editBtn")) {
            const bills = loadBills();
            const bill = bills.find(b => b.id === billId);
            if (!bill)
                return;
            setEditMode(bill);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        // DELETE
        if (target.classList.contains("deleteBtn")) {
            const confirmed = confirm("Delete this bill?");
            if (!confirmed)
                return;
            let bills = loadBills();
            bills = bills.filter(b => b.id !== billId);
            saveBills(bills);
            // If the bill being edited is deleted
            if (editingBillId === billId)
                resetBillForm();
            refreshUI();
        }
    });
}
function setupUsage() {
    const form = document.getElementById("usageForm");
    const select = document.getElementById("usageBillSelect");
    if (!form || !select)
        return;
    select.addEventListener("change", () => {
        const usages = loadUsage();
        const bills = loadBills();
        renderUsageChart(usages, bills);
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const billId = select.value;
        const month = document.getElementById("usageMonth").value; // YYYY-MM
        const value = Number(document.getElementById("usageValue").value);
        const unit = document.getElementById("usageUnit").value.trim();
        if (!billId) {
            alert("Please add a Utility bill first.");
            return;
        }
        if (!month || !Number.isFinite(value) || value <= 0 || !unit) {
            alert("Please fill usage fields correctly.");
            return;
        }
        const usages = loadUsage();
        // If same billId + month exists, overwrite (update)
        const existing = usages.find(u => u.billId === billId && u.month === month);
        if (existing) {
            existing.value = value;
            existing.unit = unit;
        }
        else {
            usages.push({
                id: uid(),
                billId,
                month,
                value,
                unit,
                createdAt: formatYMD(new Date()),
            });
        }
        saveUsage(usages);
        document.getElementById("usageValue").value = "";
        refreshUI();
    });
}
function setupExports() {
    const billsBtn = document.getElementById("exportBillsBtn");
    const payBtn = document.getElementById("exportPaymentsBtn");
    const usageBtn = document.getElementById("exportUsageBtn");
    billsBtn?.addEventListener("click", () => {
        const bills = loadBills();
        const rows = bills.map(b => ({
            id: b.id,
            name: b.name,
            provider: b.provider,
            amount: b.amount,
            dueDate: b.dueDate,
            status: b.status,
            category: b.category,
            isRecurring: b.isRecurring ? "yes" : "no",
            frequency: b.frequency ?? "",
            recurringGroupId: b.recurringGroupId ?? ""
        }));
        const csv = toCSV(rows, ["id", "name", "provider", "amount", "dueDate", "status", "category", "isRecurring", "frequency", "recurringGroupId"]);
        downloadTextFile("homeledger_bills.csv", csv);
    });
    payBtn?.addEventListener("click", () => {
        const payments = loadPayments();
        const rows = payments.map(p => ({
            id: p.id,
            billId: p.billId,
            paymentDate: p.paymentDate,
            lateFee: p.lateFee,
            amountPaid: p.amountPaid
        }));
        const csv = toCSV(rows, ["id", "billId", "paymentDate", "lateFee", "amountPaid"]);
        downloadTextFile("homeledger_payments.csv", csv);
    });
    usageBtn?.addEventListener("click", () => {
        const usages = loadUsage();
        const rows = usages.map(u => ({
            id: u.id,
            billId: u.billId,
            month: u.month,
            value: u.value,
            unit: u.unit,
            createdAt: u.createdAt
        }));
        const csv = toCSV(rows, ["id", "billId", "month", "value", "unit", "createdAt"]);
        downloadTextFile("homeledger_utility_usage.csv", csv);
    });
}
/* ---------------- Main UI refresh ---------------- */
function refreshUI() {
    const bills = loadBills();
    generateRecurringBills(bills);
    recomputeStatuses(bills);
    saveBills(bills);
    const payments = loadPayments();
    const usages = loadUsage();
    renderBills(bills);
    renderDashboard(bills);
    renderPayments(payments, bills);
    renderCategoryChart(bills);
    renderUsageSelect(bills);
    renderUsageChart(usages, bills);
}
function main() {
    setupTheme();
    setupForm();
    setupBillActions();
    setupUsage();
    setupExports();
    refreshUI();
}
main();
